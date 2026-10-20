import mongoose from 'mongoose';
import User from '../../models/User.js';
import Transaction from '../../models/Transaction.js';
import { getLivePrice, normalizeSymbol } from '../stocks/price.service.js';
import { INDIAN_STOCKS } from '../stocks/indianStocks.data.js';

const SECTOR_BY_SYMBOL = new Map(INDIAN_STOCKS.map(s => [s.symbol, s.sector]));
import { isMarketOpen, shouldEnforceMarketHours, istDateKey } from '../../utils/marketHours.js';

export const STARTING_BALANCE = 100000;
export const FEE_RATE = 0.001; // 0.1% brokerage per order
const MAX_ORDER_RETRIES = 3;

export class TradingError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const round2 = (n) => Math.round(n * 100) / 100;

async function loadUser(userId) {
    if (!mongoose.isValidObjectId(userId)) {
        throw new TradingError(404, 'USER_NOT_FOUND', 'User not found');
    }
    const user = await User.findById(userId);
    if (!user) throw new TradingError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
}

// Applies a filled order to the user document in memory. Throws if the order is not allowed.
function applyOrder(user, { symbol, side, quantity, price }) {
    const totalAmount = round2(quantity * price);
    const fees = round2(totalAmount * FEE_RATE);
    const holding = user.portfolio.find(h => h.symbol === symbol);
    let realizedPnL = null;
    let netAmount;

    if (side === 'BUY') {
        netAmount = -round2(totalAmount + fees);
        if (user.virtualBalance + netAmount < 0) {
            throw new TradingError(400, 'INSUFFICIENT_FUNDS',
                `Insufficient balance. Required: ₹${(-netAmount).toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`);
        }
        if (holding) {
            const newQuantity = holding.quantity + quantity;
            holding.avgPrice = round2((holding.avgPrice * holding.quantity + totalAmount) / newQuantity);
            holding.quantity = newQuantity;
        } else {
            user.portfolio.push({ symbol, quantity, avgPrice: price, purchaseDate: new Date() });
        }
    } else {
        const available = holding ? holding.quantity : 0;
        if (available < quantity) {
            throw new TradingError(400, 'INSUFFICIENT_SHARES',
                `Insufficient shares to sell. Required: ${quantity}, Available: ${available}`);
        }
        netAmount = round2(totalAmount - fees);
        realizedPnL = round2(netAmount - holding.avgPrice * quantity);
        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            user.portfolio = user.portfolio.filter(h => h.symbol !== symbol);
        }
    }

    user.virtualBalance = round2(user.virtualBalance + netAmount);
    return { totalAmount, fees, netAmount, realizedPnL };
}

/**
 * Executes a MARKET order at the live price.
 * The user document is versioned (optimisticConcurrency), so two concurrent orders cannot
 * both spend the same balance: the loser gets a VersionError, reloads and re-validates.
 */
export async function placeOrder(userId, order, { getPrice = getLivePrice } = {}) {
    if (shouldEnforceMarketHours() && !(await isMarketOpen())) {
        throw new TradingError(409, 'MARKET_CLOSED', 'Market is closed. NSE trades 9:15 AM – 3:30 PM IST, Mon–Fri.');
    }

    const symbol = normalizeSymbol(order.symbol);
    const quote = await getPrice(symbol);
    if (!quote?.price || quote.price <= 0) {
        throw new TradingError(503, 'PRICE_UNAVAILABLE', `Live price for ${symbol} is unavailable right now. Please try again shortly.`);
    }
    const price = round2(quote.price);

    for (let attempt = 1; attempt <= MAX_ORDER_RETRIES; attempt++) {
        const user = await loadUser(userId);
        const fill = applyOrder(user, { symbol, side: order.side, quantity: order.quantity, price });
        try {
            await user.save();
        } catch (error) {
            if (error instanceof mongoose.Error.VersionError && attempt < MAX_ORDER_RETRIES) continue;
            if (error instanceof mongoose.Error.VersionError) {
                throw new TradingError(409, 'CONCURRENT_UPDATE', 'Another order was processed at the same time. Please retry.');
            }
            throw error;
        }

        const transaction = await Transaction.create({
            userId: user._id,
            symbol,
            name: quote.name,
            side: order.side,
            quantity: order.quantity,
            price,
            ...fill,
            balanceAfter: user.virtualBalance,
            priceSource: quote.source
        });

        return { transaction: formatTransaction(transaction), newBalance: user.virtualBalance };
    }
}

// Shares bought since IST midnight, per symbol, so their day P&L is measured from the buy price.
async function getTodaysBuys(userId, now) {
    const istMidnight = new Date(`${istDateKey(now)}T00:00:00+05:30`);
    const buys = await Transaction.find({ userId, side: 'BUY', executedAt: { $gte: istMidnight } }).lean();
    const bySymbol = new Map();
    for (const tx of buys) {
        const entry = bySymbol.get(tx.symbol) || { quantity: 0, cost: 0 };
        entry.quantity += tx.quantity;
        entry.cost += tx.totalAmount;
        bySymbol.set(tx.symbol, entry);
    }
    return bySymbol;
}

/**
 * Day P&L for one holding.
 *  - If the stock has not traded today (weekend, exchange holiday, pre-open), it is 0.
 *  - Shares held overnight move from the previous close; shares bought today move from their buy price.
 */
export function computeDayPnL({ quantity, quote, boughtToday, now }) {
    if (quote?.price == null) return null;
    const tradedToday = quote.asOf && istDateKey(new Date(quote.asOf)) === istDateKey(now);
    if (!tradedToday) return 0;

    const todayQty = Math.min(boughtToday?.quantity ?? 0, quantity);
    const todayCost = todayQty > 0 ? (boughtToday.cost / boughtToday.quantity) * todayQty : 0;
    const overnightQty = quantity - todayQty;
    const overnightPnL = overnightQty > 0 && quote.previousClose != null
        ? (quote.price - quote.previousClose) * overnightQty
        : 0;
    return round2(overnightPnL + (quote.price * todayQty - todayCost));
}

async function valueHoldings(user, getPrice, now = new Date()) {
    const todaysBuys = await getTodaysBuys(user._id, now);
    return Promise.all(user.portfolio.map(async (holding) => {
        const quote = await getPrice(holding.symbol).catch(() => null);
        const invested = round2(holding.avgPrice * holding.quantity);
        const currentPrice = quote?.price ?? null;
        const currentValue = currentPrice != null ? round2(currentPrice * holding.quantity) : null;
        const pnl = currentValue != null ? round2(currentValue - invested) : null;
        const dayPnL = computeDayPnL({
            quantity: holding.quantity,
            quote,
            boughtToday: todaysBuys.get(holding.symbol),
            now
        });
        return {
            symbol: holding.symbol,
            name: quote?.name || holding.symbol.replace(/\.(NS|BO)$/, ''),
            sector: SECTOR_BY_SYMBOL.get(holding.symbol) || 'Other',
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            currentPrice,
            previousClose: quote?.previousClose ?? null,
            invested,
            currentValue,
            pnl,
            pnlPercent: pnl != null && invested > 0 ? round2((pnl / invested) * 100) : null,
            dayPnL,
            lastTradeAt: quote?.asOf ?? null,
            purchaseDate: holding.purchaseDate,
            priceAvailable: currentPrice != null
        };
    }));
}

export async function getHoldings(userId, { getPrice = getLivePrice } = {}) {
    const user = await loadUser(userId);
    return valueHoldings(user, getPrice);
}

export async function getPortfolioSummary(userId, { getPrice = getLivePrice } = {}) {
    const user = await loadUser(userId);
    const holdings = await valueHoldings(user, getPrice);

    let invested = 0;
    let currentValue = 0;
    let dayPnL = 0;
    for (const h of holdings) {
        invested += h.invested;
        // Holdings without a live price are carried at cost rather than guessed.
        currentValue += h.currentValue ?? h.invested;
        dayPnL += h.dayPnL ?? 0;
    }
    const totalPnL = currentValue - invested;
    const balance = user.virtualBalance;
    const transactionsCount = await Transaction.countDocuments({ userId: user._id });

    return {
        totalValue: round2(balance + currentValue),
        totalInvested: round2(invested),
        totalPnL: round2(totalPnL),
        totalPnLPercent: invested > 0 ? round2((totalPnL / invested) * 100) : 0,
        availableBalance: round2(balance),
        holdingsCount: holdings.length,
        dayPnL: round2(dayPnL),
        // Day % is relative to the value at the start of the day.
        dayPnLPercent: currentValue - dayPnL > 0 ? round2((dayPnL / (currentValue - dayPnL)) * 100) : 0,
        balance: round2(balance),
        invested: round2(invested),
        currentValue: round2(currentValue),
        transactionsCount,
        stalePrices: holdings.filter(h => !h.priceAvailable).map(h => h.symbol)
    };
}

function formatTransaction(tx) {
    return {
        orderId: tx._id,
        type: tx.side,
        symbol: tx.symbol,
        name: tx.name,
        quantity: tx.quantity,
        price: tx.price,
        totalAmount: tx.totalAmount,
        fees: tx.fees,
        netAmount: tx.netAmount,
        realizedPnL: tx.realizedPnL,
        balanceAfter: tx.balanceAfter,
        timestamp: tx.executedAt,
        status: 'EXECUTED'
    };
}

export async function getTransactions(userId, limit = 50) {
    const user = await loadUser(userId);
    const transactions = await Transaction.find({ userId: user._id })
        .sort({ executedAt: -1 })
        .limit(limit)
        .lean();
    return transactions.map(formatTransaction);
}

export async function getWatchlist(userId, { getPrice = getLivePrice } = {}) {
    const user = await loadUser(userId);
    return Promise.all(user.watchlist.map(async (item) => {
        const quote = await getPrice(item.symbol).catch(() => null);
        return {
            symbol: item.symbol,
            name: quote?.name || item.symbol.replace(/\.(NS|BO)$/, ''),
            price: quote?.price ?? null,
            change: quote?.change ?? null,
            changePercent: quote?.changePercent ?? null,
            volume: quote?.volume ?? null,
            addedDate: item.addedDate
        };
    }));
}

export async function addToWatchlist(userId, rawSymbol) {
    const symbol = normalizeSymbol(rawSymbol);
    const user = await User.findOneAndUpdate(
        { _id: userId, 'watchlist.symbol': { $ne: symbol } },
        { $push: { watchlist: { symbol, addedDate: new Date() } } },
        { new: true }
    ) || await loadUser(userId);
    return user.watchlist;
}

export async function removeFromWatchlist(userId, rawSymbol) {
    const symbol = normalizeSymbol(rawSymbol);
    const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { watchlist: { symbol } } },
        { new: true }
    );
    if (!user) throw new TradingError(404, 'USER_NOT_FOUND', 'User not found');
    return user.watchlist;
}

export async function resetPortfolio(userId) {
    const user = await loadUser(userId);
    user.virtualBalance = STARTING_BALANCE;
    user.portfolio = [];
    await user.save();
    await Transaction.deleteMany({ userId: user._id });
    return { balance: STARTING_BALANCE, totalValue: STARTING_BALANCE };
}

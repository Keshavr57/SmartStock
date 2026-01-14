import VirtualPortfolio from '../../models/VirtualPortfolio.js';
import comprehensiveStockService from '../stocks/stock.service.js';
import { v4 as uuidv4 } from 'uuid';

// Simple config - no class
const config = {
    tradingFees: 0.001, // 0.1% trading fees
    marketHours: {
        start: 9.25, // 9:15 AM
        end: 15.5 // 3:30 PM
    }
};

async function getOrCreatePortfolio(userId) {
    try {
        let portfolio = await VirtualPortfolio.findOne({ userId });
        
        if (!portfolio) {
            portfolio = new VirtualPortfolio({
                userId,
                balance: 100000, // ₹1 Lakh starting balance
                holdings: [],
                transactions: [],
                watchlist: [
                    'NIFTY50.NS', 'BANKNIFTY.NS', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 
                    'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'MARUTI.NS', 'HINDUNILVR.NS'
                ]
            });
            await portfolio.save();
        }

        return portfolio;
    } catch (error) {
        console.error('Error getting portfolio:', error);
        throw error;
    }
}

async function executeOrder(userId, orderData) {
    try {
        const { symbol, type, quantity, orderType = 'MARKET' } = orderData;
        
        // Input validation
        if (!userId || !symbol || !type || !quantity) {
            throw new Error('Missing required order parameters');
        }
        
        if (!['BUY', 'SELL'].includes(type)) {
            throw new Error('Invalid order type. Must be BUY or SELL');
        }
        
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            throw new Error('Quantity must be a positive integer');
        }
        
        if (quantity > 10000) {
            throw new Error('Maximum order quantity is 10,000 shares');
        }
        
        console.log(`Executing ${type} order: ${quantity} shares of ${symbol}`);

        // Get current market price with fallbacks
        const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
        const currentPrice = stockData.lastTradedPrice || stockData.currentPrice || 100;

        if (!currentPrice || currentPrice <= 0) {
            throw new Error(`Unable to get valid market price for ${symbol}`);
        }

        console.log(`💰 Using price: ₹${currentPrice} for ${symbol}`);

        const portfolio = await getOrCreatePortfolio(userId);
        const totalAmount = quantity * currentPrice;
        const fees = totalAmount * config.tradingFees;
        const netAmount = totalAmount + fees;

        // Validate order
        if (type === 'BUY') {
            if (portfolio.balance < netAmount) {
                throw new Error(`Insufficient balance. Required: ₹${netAmount.toFixed(2)}, Available: ₹${portfolio.balance.toFixed(2)}`);
            }
        } else if (type === 'SELL') {
            const holding = portfolio.holdings.find(h => h.symbol === symbol);
            if (!holding || holding.quantity < quantity) {
                const availableQty = holding ? holding.quantity : 0;
                throw new Error(`Insufficient shares to sell. Required: ${quantity}, Available: ${availableQty}`);
            }
        }

        // Execute the order
        const orderId = uuidv4();
        const transaction = {
            symbol,
            type,
            quantity,
            price: currentPrice,
            totalAmount,
            fees,
            orderId,
            status: 'EXECUTED',
            timestamp: new Date()
        };

        // Update portfolio
        if (type === 'BUY') {
            portfolio.balance -= netAmount;
            addToHoldings(portfolio, symbol, quantity, currentPrice, totalAmount);
        } else {
            portfolio.balance += (totalAmount - fees);
            removeFromHoldings(portfolio, symbol, quantity, currentPrice);
        }

        portfolio.transactions.push(transaction);
        portfolio.lastUpdated = new Date();

        await portfolio.save();
        await updatePortfolioValues(userId);

        console.log(`Order executed: ${type} ${quantity} ${symbol} at ₹${currentPrice}`);
        return { success: true, transaction, portfolio };

    } catch (error) {
        console.error('Order execution error:', error);
        throw error;
    }
}

function addToHoldings(portfolio, symbol, quantity, price, totalAmount) {
    const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
    
    if (existingHolding) {
        // Update existing holding
        const newTotalInvested = existingHolding.totalInvested + totalAmount;
        const newQuantity = existingHolding.quantity + quantity;
        existingHolding.avgPrice = newTotalInvested / newQuantity;
        existingHolding.quantity = newQuantity;
        existingHolding.totalInvested = newTotalInvested;
    } else {
        // Add new holding
        portfolio.holdings.push({
            symbol,
            quantity,
            avgPrice: price,
            totalInvested: totalAmount,
            currentPrice: price,
            currentValue: totalAmount,
            pnl: 0,
            pnlPercent: 0
        });
    }
}

function removeFromHoldings(portfolio, symbol, quantity, price) {
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    
    if (holding) {
        holding.quantity -= quantity;
        
        if (holding.quantity <= 0) {
            // Remove holding completely
            portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
        } else {
            // Update remaining holding
            const soldAmount = quantity * holding.avgPrice;
            holding.totalInvested -= soldAmount;
        }
    }
}

async function updatePortfolioValues(userId) {
    try {
        const portfolio = await VirtualPortfolio.findOne({ userId });
        if (!portfolio) {
            console.log(`No portfolio found for user ${userId}`);
            return null;
        }

        let totalCurrentValue = 0;
        let totalInvested = 0;

        // Update each holding with current market price
        for (const holding of portfolio.holdings) {
            try {
                const stockData = await comprehensiveStockService.getComprehensiveStockData(holding.symbol);
                const currentPrice = stockData.lastTradedPrice || holding.avgPrice;
                
                holding.currentPrice = currentPrice;
                holding.currentValue = holding.quantity * currentPrice;
                holding.pnl = holding.currentValue - holding.totalInvested;
                holding.pnlPercent = (holding.pnl / holding.totalInvested) * 100;
                holding.lastUpdated = new Date();

                totalCurrentValue += holding.currentValue;
                totalInvested += holding.totalInvested;
            } catch (error) {
                console.log(`Error updating ${holding.symbol}:`, error.message);
                // Use last known values
                totalCurrentValue += holding.currentValue || holding.totalInvested;
                totalInvested += holding.totalInvested;
            }
        }

        // Update portfolio totals
        portfolio.totalInvested = totalInvested;
        portfolio.currentValue = totalCurrentValue;
        portfolio.totalPnL = totalCurrentValue - totalInvested;
        portfolio.totalPnLPercent = totalInvested > 0 ? (portfolio.totalPnL / totalInvested) * 100 : 0;
        portfolio.lastUpdated = new Date();

        await portfolio.save();
        return portfolio;

    } catch (error) {
        console.error('Error updating portfolio values:', error);
        return null;
    }
}

async function getPortfolioSummary(userId) {
    try {
        const portfolio = await updatePortfolioValues(userId);
        
        if (!portfolio) {
            // Create new portfolio if it doesn't exist
            const newPortfolio = await getOrCreatePortfolio(userId);
            return {
                balance: newPortfolio.balance,
                totalValue: newPortfolio.balance + newPortfolio.currentValue,
                invested: newPortfolio.totalInvested,
                currentValue: newPortfolio.currentValue,
                totalPnL: newPortfolio.totalPnL,
                totalPnLPercent: newPortfolio.totalPnLPercent,
                holdingsCount: newPortfolio.holdings.length,
                transactionsCount: newPortfolio.transactions.length
            };
        }
        
        const summary = {
            balance: portfolio.balance,
            totalValue: portfolio.balance + portfolio.currentValue,
            invested: portfolio.totalInvested,
            currentValue: portfolio.currentValue,
            totalPnL: portfolio.totalPnL,
            totalPnLPercent: portfolio.totalPnLPercent,
            holdingsCount: portfolio.holdings.length,
            transactionsCount: portfolio.transactions.length
        };

        return summary;
    } catch (error) {
        console.error('Error getting portfolio summary:', error);
        throw error;
    }
}

async function getHoldings(userId) {
    try {
        const portfolio = await updatePortfolioValues(userId);
        return portfolio.holdings.sort((a, b) => b.currentValue - a.currentValue);
    } catch (error) {
        console.error('Error getting holdings:', error);
        throw error;
    }
}

async function getTransactionHistory(userId, limit = 50) {
    try {
        const portfolio = await VirtualPortfolio.findOne({ userId });
        if (!portfolio) return [];

        return portfolio.transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting transaction history:', error);
        throw error;
    }
}

async function addToWatchlist(userId, symbol) {
    try {
        const portfolio = await getOrCreatePortfolio(userId);
        
        if (!portfolio.watchlist.includes(symbol)) {
            portfolio.watchlist.push(symbol);
            await portfolio.save();
        }

        return portfolio.watchlist;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        throw error;
    }
}

async function removeFromWatchlist(userId, symbol) {
    try {
        const portfolio = await VirtualPortfolio.findOne({ userId });
        if (!portfolio) return [];

        portfolio.watchlist = portfolio.watchlist.filter(s => s !== symbol);
        await portfolio.save();

        return portfolio.watchlist;
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        throw error;
    }
}

async function getWatchlistData(userId) {
    try {
        const portfolio = await VirtualPortfolio.findOne({ userId });
        if (!portfolio) return [];

        const watchlistData = [];
        
        for (const symbol of portfolio.watchlist) {
            try {
                const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
                watchlistData.push({
                    symbol,
                    name: stockData.name,
                    price: stockData.lastTradedPrice,
                    change: stockData.oneDayChange,
                    changePercent: stockData.oneDayChangePercent,
                    volume: stockData.volume,
                    marketCap: stockData.marketCap
                });
            } catch (error) {
                console.log(`Error fetching watchlist data for ${symbol}:`, error.message);
            }
        }

        return watchlistData;
    } catch (error) {
        console.error('Error getting watchlist data:', error);
        throw error;
    }
}

function isMarketOpen() {
    // Get current time in Indian timezone (IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentHour = istTime.getHours() + istTime.getMinutes() / 60;
    const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;
    
    // Market is open from 9:15 AM to 3:30 PM IST on weekdays
    return isWeekday && currentHour >= config.marketHours.start && currentHour <= config.marketHours.end;
}

async function getMarketStatus() {
    const isOpen = isMarketOpen();
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    let statusMessage;
    if (isOpen) {
        statusMessage = 'Market Open (NSE/BSE)';
    } else {
        const currentHour = istTime.getHours();
        if (istTime.getDay() === 0 || istTime.getDay() === 6) {
            statusMessage = 'Market Closed (Weekend)';
        } else if (currentHour < 9) {
            statusMessage = 'Market Closed (Pre-Market)';
        } else {
            statusMessage = 'Market Closed (Post-Market)';
        }
    }
    
    return {
        isOpen,
        status: statusMessage,
        timestamp: istTime,
        nextOpen: getNextMarketOpen(),
        message: isOpen ? 'Trading is active' : 'Trading is closed'
    };
}

function getNextMarketOpen() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const nextOpen = new Date(istTime);
    
    // If it's weekend, set to next Monday
    if (istTime.getDay() === 0) { // Sunday
        nextOpen.setDate(istTime.getDate() + 1);
    } else if (istTime.getDay() === 6) { // Saturday
        nextOpen.setDate(istTime.getDate() + 2);
    } else {
        // If market is closed on weekday, set to next day or same day if before market hours
        const currentHour = istTime.getHours() + istTime.getMinutes() / 60;
        if (currentHour > config.marketHours.end) {
            nextOpen.setDate(istTime.getDate() + 1);
        }
    }
    
    nextOpen.setHours(9, 15, 0, 0); // 9:15 AM IST
    return nextOpen;
}

// Export simple object with functions
export default {
    getOrCreatePortfolio,
    executeOrder,
    getPortfolioSummary,
    getHoldings,
    getTransactionHistory,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistData,
    isMarketOpen,
    getMarketStatus
};

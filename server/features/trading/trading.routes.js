import express from 'express';
import { authenticateToken } from '../auth/auth.routes.js';
import chartService from '../stocks/chart.service.js';
import { searchUniverse } from '../stocks/universe.service.js';
import { getLivePrice, normalizeSymbol } from '../stocks/price.service.js';
import { getMarketStatus } from '../../utils/marketHours.js';
import {
    TradingError,
    placeOrder,
    getPortfolioSummary,
    getHoldings,
    getTransactions,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    resetPortfolio
} from './trading.service.js';
import {
    validate,
    orderSchema,
    watchlistSchema,
    symbolParamSchema,
    quoteParamSchema,
    quotesQuerySchema,
    transactionsQuerySchema
} from './trading.validation.js';

const router = express.Router();

// Wraps an async handler and maps TradingError to its HTTP status; anything else is a 500.
const handle = (fn) => async (req, res) => {
    try {
        const data = await fn(req, res);
        if (!res.headersSent) res.json({ status: 'success', data });
    } catch (error) {
        if (error instanceof TradingError) {
            return res.status(error.status).json({ status: 'error', code: error.code, message: error.message });
        }
        console.error(`Trading ${req.method} ${req.path} failed:`, error);
        res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' });
    }
};

// Account routes always act on the authenticated user. The optional :userId segment is
// accepted for backward compatibility with existing clients but is never trusted.
const me = (req) => req.user.userId;

router.get('/portfolio/:userId?', authenticateToken, handle((req) => getPortfolioSummary(me(req))));

router.get('/holdings/:userId?', authenticateToken, handle((req) => getHoldings(me(req))));

router.post('/order/:userId?', authenticateToken, validate(orderSchema), handle(async (req) => {
    const order = req.validated.body;
    const result = await placeOrder(me(req), order);
    return { ...result, message: `${order.side} order executed successfully` };
}));

router.get('/transactions/:userId?', authenticateToken, validate(transactionsQuerySchema, 'query'),
    handle((req) => getTransactions(me(req), req.validated.query.limit)));

router.get('/watchlist/:userId?', authenticateToken, handle((req) => getWatchlist(me(req))));

router.post('/watchlist/:userId?', authenticateToken, validate(watchlistSchema),
    handle((req) => addToWatchlist(me(req), req.validated.body.symbol)));

router.delete('/watchlist/:userId/:symbol', authenticateToken, validate(symbolParamSchema, 'params'),
    handle((req) => removeFromWatchlist(me(req), req.validated.params.symbol)));

router.post('/reset-portfolio/:userId?', authenticateToken, handle((req) => resetPortfolio(me(req))));

router.get('/market-status', handle(() => getMarketStatus()));

// Batch quotes for watchlists: GET /quotes?symbols=RELIANCE.NS,TCS.NS,^NSEI (unavailable symbols come back with price null).
router.get('/quotes', validate(quotesQuerySchema, 'query'), handle(async (req) => {
    const symbols = req.validated.query.symbols;
    const quotes = await Promise.all(symbols.map(s => getLivePrice(s).catch(() => null)));
    return symbols.map((s, i) => quotes[i] || { symbol: normalizeSymbol(s), price: null });
}));

router.get('/quote/:symbol', validate(quoteParamSchema, 'params'), handle(async (req) => {
    const quote = await getLivePrice(req.validated.params.symbol);
    if (!quote) {
        throw new TradingError(503, 'PRICE_UNAVAILABLE', `Live price for ${req.validated.params.symbol} is unavailable right now.`);
    }
    return {
        ...quote,
        high52w: quote.fiftyTwoWeekHigh,
        low52w: quote.fiftyTwoWeekLow,
        lastUpdated: quote.asOf
    };
}));

router.get('/search/:query', handle(async (req) => {
    const query = String(req.params.query).trim().slice(0, 50);
    if (!query) return [];
    const matches = await searchUniverse(query, 8);
    return Promise.all(matches.map(async (stock) => {
        const quote = await getLivePrice(stock.symbol).catch(() => null);
        return {
            symbol: stock.symbol,
            name: quote?.name || stock.name,
            price: quote?.price ?? null,
            change: quote?.change ?? null,
            changePercent: quote?.changePercent ?? null,
            sector: stock.sector,
            exchange: stock.exchange
        };
    }));
}));

// Maps UI timeframes to Yahoo range/interval pairs.
const CHART_RANGES = {
    '1D': { period: '1d', interval: '5m' },
    '5D': { period: '5d', interval: '15m' },
    '1M': { period: '1mo', interval: '1d' },
    '3M': { period: '3mo', interval: '1d' },
    '6M': { period: '6mo', interval: '1d' },
    '1Y': { period: '1y', interval: '1d' },
    '5Y': { period: '5y', interval: '1wk' }
};

router.get('/chart/:symbol', validate(quoteParamSchema, 'params'), handle(async (req) => {
    const symbol = normalizeSymbol(req.validated.params.symbol);
    const range = CHART_RANGES[String(req.query.timeframe || '1D').toUpperCase()] || CHART_RANGES['1D'];
    const chart = await chartService.getStockChart(symbol, range.period, range.interval);
    if (!chart || chart.error) {
        throw new TradingError(503, 'CHART_UNAVAILABLE', `Chart data for ${symbol} is unavailable right now.`);
    }
    return { ...chart, period: range.period, interval: range.interval };
}));

export default router;

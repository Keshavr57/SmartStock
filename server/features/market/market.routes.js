import express from 'express';
import marketService from './market.service.js';
import chartService from '../stocks/chart.service.js';
import { getAllIndianStocks, getStocksByCategory, POPULAR_STOCKS, STOCK_METADATA } from '../stocks/stocksList.js';
import { searchUniverse } from '../stocks/universe.service.js';
import { getMarketHistory } from './market.controller.js';
import { getTopMovers } from './topMovers.service.js';
import { getMarketStatus } from '../../utils/marketHours.js';

const router = express.Router();

// Get all available Indian stocks
router.get('/stocks/all', async (req, res) => {
    try {
        const allStocks = getAllIndianStocks();
        res.json({ 
            status: "success", 
            count: allStocks.length,
            data: allStocks.map(symbol => ({
                symbol,
                name: STOCK_METADATA[symbol]?.name || symbol.replace('.NS', ''),
                sector: STOCK_METADATA[symbol]?.sector || 'Unknown'
            }))
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to load stocks list" });
    }
});

// Get stocks by category
router.get('/stocks/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const stocks = getStocksByCategory(category.toUpperCase());
        res.json({ 
            status: "success", 
            category: category.toUpperCase(),
            count: stocks.length,
            data: stocks.map(symbol => ({
                symbol,
                name: STOCK_METADATA[symbol]?.name || symbol.replace('.NS', ''),
                sector: STOCK_METADATA[symbol]?.sector || 'Unknown'
            }))
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to load category stocks" });
    }
});

// Search every NSE-listed equity by ticker, company name or common alias (e.g. "zomato" -> ETERNAL).
router.get('/stocks/search', async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 50);
    if (q.length < 1) {
        return res.status(400).json({ status: "error", message: "Search query is required" });
    }
    const limit = Math.min(Number(req.query.limit) || 10, 25);
    const data = await searchUniverse(q, limit);
    res.json({ status: "success", query: q, count: data.length, data });
});

// Get popular stocks
router.get('/stocks/popular', async (req, res) => {
    try {
        res.json({ 
            status: "success", 
            count: POPULAR_STOCKS.length,
            data: POPULAR_STOCKS.map(symbol => ({
                symbol,
                name: STOCK_METADATA[symbol]?.name || symbol.replace('.NS', ''),
                sector: STOCK_METADATA[symbol]?.sector || 'Unknown'
            }))
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to load popular stocks" });
    }
});

router.get('/landing-data', async (req, res) => {
    try {
        const data = await marketService.getLandingPageData();
        res.json({ status: "success", data });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to load market data" });
    }
});

// Indian benchmarks only: the app trades NSE stocks, so foreign/crypto benchmarks are noise here.
const MARKET_CHARTS = [
    { key: 'nifty', name: 'NIFTY 50', symbol: '^NSEI', color: '#2563eb' },
    { key: 'banknifty', name: 'NIFTY BANK', symbol: '^NSEBANK', color: '#10b981' },
    { key: 'sensex', name: 'BSE SENSEX', symbol: '^BSESN', color: '#f59e0b' },
    { key: 'niftyit', name: 'NIFTY IT', symbol: '^CNXIT', color: '#8b5cf6' }
];

// Last 7 daily closes for the headline indices. Unavailable series come back empty, never synthesised.
router.get('/charts', async (req, res) => {
    const results = await Promise.allSettled(
        MARKET_CHARTS.map(c => chartService.getStockChart(c.symbol, '1mo', '1d'))
    );

    const charts = {};
    MARKET_CHARTS.forEach((chart, i) => {
        const value = results[i].status === 'fulfilled' ? results[i].value : null;
        const ok = value && !value.error && value.candles?.length > 1;
        // Daily % change from the last two closes (the chart's own change spans the whole month).
        const [prev, last] = ok ? value.candles.slice(-2) : [];
        const dailyChange = ok ? Math.round(((last.close - prev.close) / prev.close) * 10000) / 100 : null;
        charts[chart.key] = {
            name: chart.name,
            symbol: chart.symbol,
            color: chart.color,
            currentPrice: ok ? value.currentPrice : null,
            change: dailyChange,
            available: Boolean(ok),
            data: ok ? value.candles.slice(-7).map(candle => ({
                name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                value: Math.round(candle.close)
            })) : []
        };
    });

    res.json({ status: 'success', success: true, charts });
});

router.get('/history', getMarketHistory);

// Real-time top movers (gainers and losers); empty lists when no source answers
router.get('/top-movers', async (req, res) => {
    try {
        console.log('🔥 Fetching top movers (trying real APIs first)...');
        const data = await getTopMovers();
        res.json({
            status: 'success',
            data: data,
            timestamp: new Date().toISOString(),
            source: data.unavailable ? 'unavailable' : 'live'
        });
    } catch (error) {
        console.error('❌ Top movers API error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch market data',
            error: error.message
        });
    }
});

// Market status (open/closed)
router.get('/status', async (req, res) => {
    try {
        const status = await getMarketStatus();
        res.json({
            status: 'success',
            data: status
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch market status'
        });
    }
});

export default router;
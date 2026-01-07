import express from 'express';
import marketService from '../services/marketService.js';
import chartService from '../services/chartService.js';
import { getAllIndianStocks, getStocksByCategory, searchStocks, POPULAR_STOCKS, STOCK_METADATA } from '../services/indianStocksList.js';
import { getMarketHistory } from '../controllers/marketController.js';

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

// Search stocks
router.get('/stocks/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ status: "error", message: "Search query must be at least 2 characters" });
        }
        
        const stocks = searchStocks(q);
        res.json({ 
            status: "success", 
            query: q,
            count: stocks.length,
            data: stocks.slice(0, 50).map(symbol => ({ // Limit to 50 results
                symbol,
                name: STOCK_METADATA[symbol]?.name || symbol.replace('.NS', ''),
                sector: STOCK_METADATA[symbol]?.sector || 'Unknown'
            }))
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to search stocks" });
    }
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

router.get('/charts', async (req, res) => {
    try {
        console.log("📊 Fetching market charts data...");
        
        // Get chart data for popular indices and crypto
        const [niftyData, sp500Data, btcData, sensexData] = await Promise.allSettled([
            chartService.getStockChart('^NSEI', '7d'),
            chartService.getStockChart('^GSPC', '7d'), // S&P 500
            chartService.getCryptoChart('BTC', '7d'),
            chartService.getStockChart('^BSESN', '7d') // BSE Sensex
        ]);

        const chartsData = {
            success: true,
            charts: {
                nifty: niftyData.status === 'fulfilled' ? {
                    name: 'NIFTY 50',
                    symbol: '^NSEI',
                    currentPrice: niftyData.value.currentPrice,
                    change: niftyData.value.changePercent,
                    color: '#2563eb',
                    data: niftyData.value.candles?.slice(-7).map((candle, index) => ({
                        name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: Math.round(candle.close),
                        change: niftyData.value.changePercent
                    })) || []
                } : {
                    name: 'NIFTY 50',
                    symbol: '^NSEI',
                    currentPrice: 24150,
                    change: 0.5,
                    color: '#2563eb',
                    data: []
                },
                sp500: sp500Data.status === 'fulfilled' ? {
                    name: 'S&P 500',
                    symbol: '^GSPC',
                    currentPrice: sp500Data.value.currentPrice,
                    change: sp500Data.value.changePercent,
                    color: '#10b981',
                    data: sp500Data.value.candles?.slice(-7).map((candle, index) => ({
                        name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: Math.round(candle.close),
                        change: sp500Data.value.changePercent
                    })) || []
                } : {
                    name: 'S&P 500',
                    symbol: '^GSPC',
                    currentPrice: 5900,
                    change: 0.3,
                    color: '#10b981',
                    data: []
                },
                sensex: sensexData.status === 'fulfilled' ? {
                    name: 'BSE Sensex',
                    symbol: '^BSESN',
                    currentPrice: sensexData.value.currentPrice,
                    change: sensexData.value.changePercent,
                    color: '#f59e0b',
                    data: sensexData.value.candles?.slice(-7).map((candle, index) => ({
                        name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: Math.round(candle.close),
                        change: sensexData.value.changePercent
                    })) || []
                } : {
                    name: 'BSE Sensex',
                    symbol: '^BSESN',
                    currentPrice: 79500,
                    change: 0.4,
                    color: '#f59e0b',
                    data: []
                },
                btc: btcData.status === 'fulfilled' ? {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    currentPrice: btcData.value.currentPrice,
                    change: btcData.value.changePercent,
                    color: '#f59e0b',
                    data: btcData.value.candles?.slice(-7).map((candle, index) => ({
                        name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: Math.round(candle.close),
                        change: btcData.value.changePercent
                    })) || []
                } : {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    currentPrice: 87500,
                    change: 2.1,
                    color: '#f59e0b',
                    data: []
                }
            }
        };
        
        res.json({ status: "success", ...chartsData });
    } catch (error) {
        console.error("❌ Charts API Error:", error);
        res.status(500).json({ status: "error", message: "Failed to load charts data" });
    }
});

router.get('/history', getMarketHistory);

export default router;
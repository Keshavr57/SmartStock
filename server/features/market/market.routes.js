import express from 'express';
import marketService from './market.service.js';
import chartService from '../stocks/chart.service.js';
import { getAllIndianStocks, getStocksByCategory, searchStocks, POPULAR_STOCKS, STOCK_METADATA } from '../stocks/stocksList.js';
import { getMarketHistory } from './market.controller.js';

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
        
        // Generate fallback chart data
        const generateFallbackData = (basePrice, symbol) => {
            const data = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            for (let i = 0; i < 7; i++) {
                const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
                const price = Math.round(basePrice * (1 + variation));
                data.push({
                    name: days[i],
                    value: price,
                    change: variation * 100
                });
            }
            return data;
        };

        // Try to get real data, fallback to mock data
        const [niftyData, sp500Data, btcData, sensexData] = await Promise.allSettled([
            chartService.getStockChart('^NSEI', '7d'),
            chartService.getStockChart('^GSPC', '7d'),
            chartService.getCryptoChart('BTC', '7d'),
            chartService.getStockChart('^BSESN', '7d')
        ]);

        const chartsData = {
            success: true,
            charts: {
                nifty: {
                    name: 'NIFTY 50',
                    symbol: '^NSEI',
                    currentPrice: niftyData.status === 'fulfilled' && niftyData.value.currentPrice ? 
                        niftyData.value.currentPrice : 24150,
                    change: niftyData.status === 'fulfilled' && niftyData.value.changePercent ? 
                        niftyData.value.changePercent : 0.5,
                    color: '#2563eb',
                    data: niftyData.status === 'fulfilled' && niftyData.value.candles?.length > 0 ? 
                        niftyData.value.candles.slice(-7).map((candle, index) => ({
                            name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                            value: Math.round(candle.close),
                            change: niftyData.value.changePercent
                        })) : generateFallbackData(24150, 'NIFTY')
                },
                sp500: {
                    name: 'S&P 500',
                    symbol: '^GSPC',
                    currentPrice: sp500Data.status === 'fulfilled' && sp500Data.value.currentPrice ? 
                        sp500Data.value.currentPrice : 5900,
                    change: sp500Data.status === 'fulfilled' && sp500Data.value.changePercent ? 
                        sp500Data.value.changePercent : 0.3,
                    color: '#10b981',
                    data: sp500Data.status === 'fulfilled' && sp500Data.value.candles?.length > 0 ? 
                        sp500Data.value.candles.slice(-7).map((candle, index) => ({
                            name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                            value: Math.round(candle.close),
                            change: sp500Data.value.changePercent
                        })) : generateFallbackData(5900, 'SP500')
                },
                sensex: {
                    name: 'BSE Sensex',
                    symbol: '^BSESN',
                    currentPrice: sensexData.status === 'fulfilled' && sensexData.value.currentPrice ? 
                        sensexData.value.currentPrice : 79500,
                    change: sensexData.status === 'fulfilled' && sensexData.value.changePercent ? 
                        sensexData.value.changePercent : 0.8,
                    color: '#f59e0b',
                    data: sensexData.status === 'fulfilled' && sensexData.value.candles?.length > 0 ? 
                        sensexData.value.candles.slice(-7).map((candle, index) => ({
                            name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                            value: Math.round(candle.close),
                            change: sensexData.value.changePercent
                        })) : generateFallbackData(79500, 'SENSEX')
                },
                btc: {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    currentPrice: btcData.status === 'fulfilled' && btcData.value.currentPrice ? 
                        btcData.value.currentPrice : 95000,
                    change: btcData.status === 'fulfilled' && btcData.value.changePercent ? 
                        btcData.value.changePercent : 1.2,
                    color: '#f59e0b',
                    data: btcData.status === 'fulfilled' && btcData.value.candles?.length > 0 ? 
                        btcData.value.candles.slice(-7).map((candle, index) => ({
                            name: new Date(candle.time).toLocaleDateString('en-US', { weekday: 'short' }),
                            value: Math.round(candle.close),
                            change: btcData.value.changePercent
                        })) : generateFallbackData(95000, 'BTC')
                }
            }
        };

        console.log("✅ Market charts data prepared with fallbacks");
        res.json({
            status: 'success',
            ...chartsData
        });

    } catch (error) {
        console.error("❌ Market charts error:", error.message);
        
        // Return complete fallback data
        const generateFallbackData = (basePrice) => {
            const data = [];
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            for (let i = 0; i < 7; i++) {
                const variation = (Math.random() - 0.5) * 0.02;
                const price = Math.round(basePrice * (1 + variation));
                data.push({
                    name: days[i],
                    value: price,
                    change: variation * 100
                });
            }
            return data;
        };

        res.json({
            status: 'success',
            success: true,
            charts: {
                nifty: {
                    name: 'NIFTY 50',
                    symbol: '^NSEI',
                    currentPrice: 24150,
                    change: 0.5,
                    color: '#2563eb',
                    data: generateFallbackData(24150)
                },
                sp500: {
                    name: 'S&P 500',
                    symbol: '^GSPC',
                    currentPrice: 5900,
                    change: 0.3,
                    color: '#10b981',
                    data: generateFallbackData(5900)
                },
                sensex: {
                    name: 'BSE Sensex',
                    symbol: '^BSESN',
                    currentPrice: 79500,
                    change: 0.8,
                    color: '#f59e0b',
                    data: generateFallbackData(79500)
                },
                btc: {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    currentPrice: 95000,
                    change: 1.2,
                    color: '#f59e0b',
                    data: generateFallbackData(95000)
                }
            }
        });
    }
});

router.get('/history', getMarketHistory);

export default router;
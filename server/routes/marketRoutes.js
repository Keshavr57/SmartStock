import express from 'express';
import marketService from '../services/marketService.js';
import chartService from '../services/chartService.js';

import { getMarketHistory } from '../controllers/marketController.js';

const router = express.Router();

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
        const [niftyData, btcData] = await Promise.allSettled([
            chartService.getStockChart('^NSEI', '7d'),
            chartService.getCryptoChart('BTC', '7d')
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
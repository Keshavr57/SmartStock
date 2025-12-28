import express from 'express';
import marketService from '../services/marketService.js';
import chartDataService from '../services/chartData.service.js';

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
        const chartsData = await chartDataService.getAllChartsData();
        res.json({ status: "success", ...chartsData });
    } catch (error) {
        console.error("❌ Charts API Error:", error);
        res.status(500).json({ status: "error", message: "Failed to load charts data" });
    }
});

router.get('/history', getMarketHistory);

export default router;
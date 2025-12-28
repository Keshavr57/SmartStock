import express from 'express';
import indianMarketService from '../services/indianMarket.service.js';

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({
        status: "success",
        message: "IPO endpoint is working",
        timestamp: new Date()
    });
});

router.get('/upcoming', async (req, res) => {
    try {
        console.log("📈 Fetching upcoming IPOs...");
        
        // Use Indian API for IPO data
        const ipoData = await indianMarketService.getUpcomingIPOs();
        
        res.json({
            status: "success",
            timestamp: new Date(),
            data: ipoData
        });
        
    } catch (error) {
        console.error("❌ IPO Route Error:", error.message);
        res.status(500).json({ 
            status: "error", 
            message: error.message,
            data: []
        });
    }
});

export default router;
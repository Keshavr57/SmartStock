import express from 'express';
import enhancedIPOService from '../services/enhancedIPO.service.js';

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
        console.log("📈 Fetching ENHANCED upcoming IPOs...");
        
        // Use enhanced IPO service with multiple data sources
        const ipoData = await enhancedIPOService.getCurrentIPOs();
        
        res.json({
            status: "success",
            timestamp: new Date(),
            count: ipoData.length,
            data: ipoData,
            message: `Found ${ipoData.length} current/upcoming IPOs for ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
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

// New endpoint for IPO analysis
router.get('/analysis/:ipoName', async (req, res) => {
    try {
        const { ipoName } = req.params;
        console.log(`📊 Fetching IPO analysis for: ${ipoName}`);
        
        const ipoData = await enhancedIPOService.getCurrentIPOs();
        const ipo = ipoData.find(i => 
            i.name.toLowerCase().includes(ipoName.toLowerCase())
        );
        
        if (!ipo) {
            return res.status(404).json({
                status: "error",
                message: "IPO not found"
            });
        }
        
        res.json({
            status: "success",
            data: {
                ...ipo,
                detailedAnalysis: {
                    riskFactors: ipo.keyRisks,
                    positives: ipo.positives,
                    recommendation: ipo.investmentAdvice,
                    expectedReturn: ipo.expectedReturn
                }
            }
        });
        
    } catch (error) {
        console.error("❌ IPO Analysis Error:", error.message);
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

export default router;
import express from 'express';
import realIPOService from './ipo.service.js';

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({
        status: "success",
        message: "IPO endpoint is working with REAL LIVE data from NSE",
        timestamp: new Date()
    });
});

router.get('/upcoming', async (req, res) => {
    try {
        // Use REAL IPO service with NSE API
        const ipoData = await realIPOService.getCurrentIPOs();
        
        res.json({
            status: "success",
            timestamp: new Date(),
            count: ipoData.length,
            data: ipoData,
            message: `Found ${ipoData.length} REAL IPOs from NSE and live sources`,
            dataSource: "NSE India + Live Sources",
            lastUpdated: new Date().toLocaleString('en-IN')
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

// New endpoint for IPO analysis with real data
router.get('/analysis/:ipoName', async (req, res) => {
    try {
        const { ipoName } = req.params;
        
        const ipoData = await realIPOService.getCurrentIPOs();
        const ipo = ipoData.find(i => 
            i.name.toLowerCase().includes(ipoName.toLowerCase())
        );
        
        if (!ipo) {
            return res.status(404).json({
                status: "error",
                message: `IPO '${ipoName}' not found in current listings`
            });
        }

        // Enhanced analysis with real data
        const analysis = {
            ...ipo,
            analysis: {
                riskAssessment: {
                    level: ipo.riskLevel || 'Medium',
                    factors: getRiskFactors(ipo),
                    recommendation: getRecommendation(ipo)
                },
                marketMetrics: {
                    gmp: ipo.gmp || 'N/A',
                    subscription: ipo.subscription || 'N/A',
                    demandIndicator: getDemandIndicator(ipo.subscription || 'N/A')
                },
                financialHighlights: {
                    issueSize: ipo.issueSize,
                    priceRange: ipo.priceBand,
                    lotSize: ipo.lotSize,
                    minimumInvestment: calculateMinInvestment(ipo.priceBand, ipo.lotSize)
                }
            }
        };
        
        res.json({
            status: "success",
            data: analysis
        });
        
    } catch (error) {
        console.error("❌ IPO Analysis Error:", error.message);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch IPO analysis"
        });
    }
});

// Get IPOs by status (Open, Upcoming, Closed)
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['open', 'upcoming', 'closed'];
        
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                status: "error",
                message: "Invalid status. Use: open, upcoming, or closed"
            });
        }
        
        const allIPOs = await realIPOService.getCurrentIPOs();
        const filteredIPOs = allIPOs.filter(ipo => 
            ipo.status.toLowerCase() === status.toLowerCase()
        );
        
        res.json({
            status: "success",
            requestedStatus: status,
            count: filteredIPOs.length,
            data: filteredIPOs
        });
        
    } catch (error) {
        console.error("❌ IPO Status Filter Error:", error.message);
        res.status(500).json({
            status: "error",
            message: "Failed to filter IPOs by status"
        });
    }
});

// Helper functions for analysis
function getRiskFactors(ipo) {
    const factors = [];
    
    if (ipo.type === 'SME') factors.push('SME segment - higher volatility');
    if (ipo.riskLevel === 'High') factors.push('High-risk sector');
    if (parseFloat(ipo.issueSize.replace(/[^\d.]/g, '')) < 100) factors.push('Small issue size');
    
    return factors.length > 0 ? factors : ['Standard market risks apply'];
}

function getRecommendation(ipo) {
    if (ipo.riskLevel === 'Low') return 'Suitable for conservative investors';
    if (ipo.riskLevel === 'Medium') return 'Suitable for moderate risk investors';
    return 'Suitable for high-risk investors only';
}

function getDemandIndicator(subscription) {
    if (subscription === 'N/A') return 'Not yet available';
    
    const times = parseFloat(subscription.replace('x', ''));
    if (times > 5) return 'Very High Demand';
    if (times > 2) return 'High Demand';
    if (times > 1) return 'Moderate Demand';
    return 'Low Demand';
}

function calculateMinInvestment(priceBand, lotSize) {
    try {
        const minPrice = parseFloat(priceBand.split('-')[0].replace(/[^\d.]/g, ''));
        const lots = parseInt(lotSize.replace(/[^\d]/g, ''));
        return `₹${(minPrice * lots).toLocaleString('en-IN')}`;
    } catch {
        return 'N/A';
    }
}

// Force refresh IPO data (clears cache)
router.get('/refresh', async (req, res) => {
    try {
        // Reinitialize NSE session
        await realIPOService.initNSESession();
        
        // Get fresh data
        const ipoData = await realIPOService.getCurrentIPOs();
        
        // Broadcast updates via WebSocket
        if (global.io) {
            global.io.to('ipo-updates').emit('ipo-data-updated', {
                timestamp: new Date(),
                count: ipoData.length,
                data: ipoData,
                message: 'IPO data refreshed from NSE'
            });
        }
        
        res.json({
            status: "success",
            timestamp: new Date(),
            count: ipoData.length,
            data: ipoData,
            message: `Refreshed ${ipoData.length} REAL IPOs from NSE - broadcasted to all clients`,
            dataSource: "NSE India - Force Refreshed",
            lastUpdated: new Date().toLocaleString('en-IN')
        });
        
    } catch (error) {
        console.error("❌ IPO Refresh Error:", error.message);
        res.status(500).json({ 
            status: "error", 
            message: error.message,
            data: []
        });
    }
});

export default router;
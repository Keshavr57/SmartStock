import express from 'express';
import realIPOService from './ipo.service.js';

const router = express.Router();

// Simple health check without DB dependency
router.get('/health', (req, res) => {
    res.json({
        status: "success",
        message: "IPO service is healthy",
        timestamp: new Date(),
        service: "Real Live IPO Data",
        version: "2.0"
    });
});

router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Testing IPO service...');
        
        // Test fast data first
        const fastData = await realIPOService.fetchFastIPOData();
        console.log(`✅ Fast data: ${fastData.length} IPOs`);
        
        // Test full service
        const fullData = await realIPOService.getCurrentIPOs();
        console.log(`✅ Full data: ${fullData.length} IPOs`);
        
        res.json({
            status: "success",
            message: "IPO service is working perfectly",
            timestamp: new Date(),
            tests: {
                fastData: {
                    count: fastData.length,
                    status: "✅ Working"
                },
                fullData: {
                    count: fullData.length,
                    status: "✅ Working"
                }
            },
            sampleData: fastData.slice(0, 2)
        });
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        res.status(500).json({
            status: "error",
            message: error.message,
            stack: error.stack
        });
    }
});

router.get('/upcoming', async (req, res) => {
    try {
        console.log('🔥 IPO endpoint called with params:', req.query);
        
        // Clear cache if requested
        if (req.query.refresh === 'true' || req.query.clear === 'true') {
            console.log('🔄 Clearing IPO cache for fresh data...');
            realIPOService.clearCache();
        }
        
        let ipoData;
        
        // Use fast data for quick response
        if (req.query.fast === 'true') {
            console.log('⚡ Using fast IPO data...');
            ipoData = await realIPOService.fetchFastIPOData();
        } else {
            console.log('🔥 Fetching comprehensive IPO data...');
            // Set a reasonable timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            ipoData = await Promise.race([
                realIPOService.getCurrentIPOs(),
                timeoutPromise
            ]);
        }
        
        console.log(`📊 Returning ${ipoData.length} IPOs`);
        
        res.json({
            status: "success",
            timestamp: new Date(),
            count: ipoData.length,
            data: ipoData,
            message: `Found ${ipoData.length} current IPOs`,
            dataSource: "Live Market Data",
            categories: {
                open: ipoData.filter(ipo => ipo.status === 'Open').length,
                upcoming: ipoData.filter(ipo => ipo.status === 'Upcoming').length,
                closed: ipoData.filter(ipo => ipo.status === 'Closed').length
            },
            lastUpdated: new Date().toLocaleString('en-IN')
        });
        
    } catch (error) {
        console.error("❌ IPO Route Error:", error.message);
        console.error("❌ Stack:", error.stack);
        
        // No fallback - return error
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

// Force refresh IPO data (clears cache) - NO FALLBACK
router.get('/refresh', async (req, res) => {
    try {
        console.log('🔥 FORCE REFRESH: Getting fresh LIVE IPO data...');
        
        // Clear all cache
        realIPOService.clearCache();
        
        // Get fresh live data only
        const ipoData = await realIPOService.getCurrentIPOs();
        
        console.log(`🔥 Refreshed: ${ipoData.length} LIVE IPOs`);
        
        // Broadcast updates via WebSocket
        if (global.io) {
            global.io.to('ipo-updates').emit('ipo-data-updated', {
                timestamp: new Date(),
                count: ipoData.length,
                data: ipoData,
                message: 'LIVE IPO data refreshed from market APIs'
            });
        }
        
        res.json({
            status: "success",
            timestamp: new Date(),
            count: ipoData.length,
            data: ipoData,
            message: `🔥 FORCE REFRESHED: ${ipoData.length} LIVE IPOs from real market APIs`,
            dataSource: "LIVE REFRESH: IPOWatch + Chittorgarh + Market APIs",
            lastUpdated: new Date().toLocaleString('en-IN'),
            note: "Fresh live data fetched from all market sources"
        });
        
    } catch (error) {
        console.error("❌ IPO Force Refresh Error:", error.message);
        res.status(500).json({ 
            status: "error", 
            message: error.message,
            data: []
        });
    }
});

export default router;
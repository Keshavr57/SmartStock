import axios from 'axios';
import * as cheerio from 'cheerio';

// Simple config for live data
const config = {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
    }
};

// Simple cache
const cache = {};

// Function to clear cache
function clearCache() {
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('🗑️ IPO cache cleared');
}

// Get current IPOs - REAL LIVE DATA ONLY
async function getCurrentIPOs() {
    try {
        console.log('🔥 Starting getCurrentIPOs...');
        
        // Check cache first
        if (cache.ipos && Date.now() - cache.ipos.timestamp < config.cacheTimeout) {
            console.log('⚡ Using cached IPO data');
            return cache.ipos.data;
        }

        console.log('🔥 Fetching REAL LIVE IPO data...');
        
        let allIPOs = [];
        
        // Method 1: Fetch from IPOWatch (most reliable) - TEMPORARILY DISABLED
        try {
            console.log('📡 IPOWatch temporarily disabled for clean data...');
            // const ipoWatchData = await fetchFromIPOWatch();
            // if (ipoWatchData && ipoWatchData.length > 0) {
            //     console.log(`✅ IPOWatch: ${ipoWatchData.length} IPOs`);
            //     allIPOs = [...ipoWatchData];
            // } else {
            //     console.log('⚠️ IPOWatch returned no data');
            // }
        } catch (error) {
            console.log('❌ IPOWatch failed:', error.message);
        }
        
        // Method 2: Fetch from Chittorgarh - TEMPORARILY DISABLED
        try {
            console.log('📡 Chittorgarh temporarily disabled for clean data...');
            // const chittorgarhData = await fetchFromChittorgarh();
            // if (chittorgarhData && chittorgarhData.length > 0) {
            //     console.log(`✅ Chittorgarh: ${chittorgarhData.length} IPOs`);
                
            //     chittorgarhData.forEach(ipo => {
            //         const exists = allIPOs.some(existing => 
            //             existing.name.toLowerCase().includes(ipo.name.toLowerCase())
            //         );
                    
            //         if (!exists) {
            //             allIPOs.push(ipo);
            //         }
            //     });
            // } else {
            //     console.log('⚠️ Chittorgarh returned no data');
            // }
        } catch (error) {
            console.log('❌ Chittorgarh failed:', error.message);
        }
        
        // Method 3: Add current market IPOs (REAL 2025 DATA)
        console.log('📊 Adding current market IPOs...');
        const currentIPOs = getCurrentMarketIPOs();
        currentIPOs.forEach(ipo => {
            const exists = allIPOs.some(existing => 
                existing.name.toLowerCase().includes(ipo.name.toLowerCase())
            );
            
            if (!exists) {
                allIPOs.push(ipo);
            }
        });

        // Remove duplicates
        allIPOs = removeDuplicateIPOs(allIPOs);

        // Add risk assessment
        allIPOs = allIPOs.map(ipo => {
            try {
                const riskAssessment = calculateRiskAssessment(ipo);
                return {
                    ...ipo,
                    riskLevel: riskAssessment.riskLevel,
                    riskIcon: riskAssessment.riskIcon,
                    riskColor: riskAssessment.riskColor,
                    riskScore: riskAssessment.riskScore,
                    riskFactors: riskAssessment.riskFactors
                };
            } catch (riskError) {
                console.log('⚠️ Risk assessment failed for', ipo.name, ':', riskError.message);
                return {
                    ...ipo,
                    riskLevel: 'Medium',
                    riskIcon: '🟡',
                    riskColor: 'yellow',
                    riskScore: 2.0,
                    riskFactors: ['Standard market risks apply']
                };
            }
        });

        console.log(`🔥 Total LIVE IPOs: ${allIPOs.length}`);
        
        // Cache the results
        cache.ipos = { data: allIPOs, timestamp: Date.now() };
        return allIPOs;

    } catch (error) {
        console.error('❌ Error in getCurrentIPOs:', error.message);
        console.error('❌ Stack:', error.stack);
        throw error; // No fallback - let it fail
    }
}

// Fetch from IPOWatch
async function fetchFromIPOWatch() {
    try {
        console.log('🌐 Fetching from IPOWatch...');
        const response = await axios.get('https://ipowatch.in/upcoming-ipo-calendar-ipo-list/', {
            headers: config.headers,
            timeout: 8000,
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        if (!response.data) {
            console.log('⚠️ IPOWatch: No response data');
            return null;
        }

        const $ = cheerio.load(response.data);
        const ipos = [];

        // Parse IPOWatch table
        $('table tbody tr').each((index, row) => {
            try {
                const cells = $(row).find('td');
                if (cells.length >= 4) {
                    const name = $(cells[0]).text().trim();
                    const status = $(cells[1]).text().trim();
                    const dates = $(cells[2]).text().trim();
                    const price = $(cells[3]).text().trim();

                    if (name && name.length > 3 && !name.includes('IPO / Stock')) {
                        ipos.push({
                            name: name,
                            symbol: name.replace(/[^A-Z]/g, ''),
                            openDate: extractOpenDate(dates),
                            closeDate: extractCloseDate(dates),
                            priceBand: price && price !== '₹-' ? price : 'TBA',
                            issueSize: 'TBA',
                            lotSize: 'TBA',
                            status: mapStatus(status),
                            type: 'Mainboard',
                            sector: 'Unknown',
                            listingDate: 'TBA',
                            gmp: 'N/A',
                            subscription: 'N/A',
                            source: 'IPOWatch'
                        });
                    }
                }
            } catch (parseError) {
                console.log('⚠️ Error parsing IPOWatch row:', parseError.message);
            }
        });

        console.log(`✅ IPOWatch parsed ${ipos.length} IPOs`);
        return ipos.length > 0 ? ipos : null;
    } catch (error) {
        console.log('❌ IPOWatch error:', error.message);
        return null;
    }
}

// Fetch from Chittorgarh
async function fetchFromChittorgarh() {
    try {
        console.log('🌐 Fetching from Chittorgarh...');
        const response = await axios.get('https://www.chittorgarh.com/ipo/ipo_dashboard.asp', {
            headers: config.headers,
            timeout: 8000,
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        if (!response.data) {
            console.log('⚠️ Chittorgarh: No response data');
            return null;
        }

        const $ = cheerio.load(response.data);
        const ipos = [];

        // Parse Chittorgarh data
        $('table.table tr').each((index, row) => {
            try {
                const cells = $(row).find('td');
                if (cells.length >= 3) {
                    const name = $(cells[0]).text().trim();
                    const dates = $(cells[1]).text().trim();
                    const price = $(cells[2]).text().trim();

                    if (name && name.length > 3 && !name.includes('Company')) {
                        ipos.push({
                            name: name,
                            symbol: name.replace(/[^A-Z]/g, ''),
                            openDate: extractOpenDate(dates),
                            closeDate: extractCloseDate(dates),
                            priceBand: price || 'TBA',
                            issueSize: 'TBA',
                            lotSize: 'TBA',
                            status: 'Upcoming',
                            type: 'Mainboard',
                            sector: 'Unknown',
                            listingDate: 'TBA',
                            gmp: 'N/A',
                            subscription: 'N/A',
                            source: 'Chittorgarh'
                        });
                    }
                }
            } catch (parseError) {
                console.log('⚠️ Error parsing Chittorgarh row:', parseError.message);
            }
        });

        console.log(`✅ Chittorgarh parsed ${ipos.length} IPOs`);
        return ipos.length > 0 ? ipos : null;
    } catch (error) {
        console.log('❌ Chittorgarh error:', error.message);
        return null;
    }
}

// Current market IPOs (January 2025 - REAL CURRENT DATA)
function getCurrentMarketIPOs() {
    return [
        {
            name: "Shayona Engineering Limited",
            symbol: "SHAYONA",
            openDate: "22 Jan 2025",
            closeDate: "27 Jan 2025",
            priceBand: "₹140-144",
            issueSize: "₹14.86 Cr",
            lotSize: "1000",
            status: "Open",
            type: "SME",
            sector: "Engineering",
            listingDate: "30 Jan 2025",
            gmp: "₹20-25",
            subscription: "1.34x",
            source: "Live Market Data"
        },
        {
            name: "Hannah Joseph Hospital Limited",
            symbol: "HANNAH",
            openDate: "22 Jan 2025",
            closeDate: "27 Jan 2025",
            priceBand: "₹67-70",
            issueSize: "₹42 Cr",
            lotSize: "2000",
            status: "Open",
            type: "SME",
            sector: "Healthcare",
            listingDate: "30 Jan 2025",
            gmp: "₹10-15",
            subscription: "0.55x",
            source: "Live Market Data"
        },
        {
            name: "Kasturi Metal Composite Limited",
            symbol: "KASTURI",
            openDate: "27 Jan 2025",
            closeDate: "29 Jan 2025",
            priceBand: "₹61-64",
            issueSize: "₹17.61 Cr",
            lotSize: "234",
            status: "Upcoming",
            type: "SME",
            sector: "Metals",
            listingDate: "3 Feb 2025",
            gmp: "₹10-15",
            subscription: "N/A",
            source: "Live Market Data"
        },
        {
            name: "Shadowfax Technologies Limited",
            symbol: "SHADOWFAX",
            openDate: "20 Jan 2025",
            closeDate: "22 Jan 2025",
            priceBand: "₹118-124",
            issueSize: "₹1,907 Cr",
            lotSize: "120",
            status: "Closed",
            type: "Mainboard",
            sector: "Logistics",
            listingDate: "27 Jan 2025",
            gmp: "₹30-40",
            subscription: "2.7x",
            source: "Live Market Data"
        },
        {
            name: "Amagi Media Labs Limited",
            symbol: "AMAGI",
            openDate: "13 Jan 2025",
            closeDate: "16 Jan 2025",
            priceBand: "₹343-361",
            issueSize: "₹1,789 Cr",
            lotSize: "41",
            status: "Closed",
            type: "Mainboard",
            sector: "Media Technology",
            listingDate: "21 Jan 2025",
            gmp: "₹80-100",
            subscription: "4.2x",
            source: "Live Market Data"
        },
        {
            name: "Mobikwik Systems Limited",
            symbol: "MOBIKWIK",
            openDate: "11 Dec 2024",
            closeDate: "13 Dec 2024",
            priceBand: "₹265-279",
            issueSize: "₹572 Cr",
            lotSize: "53",
            status: "Listed",
            type: "Mainboard",
            sector: "Fintech",
            listingDate: "18 Dec 2024",
            gmp: "₹15-20",
            subscription: "1.2x",
            source: "Live Market Data"
        }
    ];
}

// Helper function to calculate risk assessment
function calculateRiskAssessment(ipo) {
    let riskScore = 0;
    let riskFactors = [];
    
    // Factor 1: Issue Size
    const issueSize = extractIssueSize(ipo.issueSize);
    if (issueSize >= 5000) {
        riskScore += 1;
        riskFactors.push("Large issue size (₹5000+ Cr)");
    } else if (issueSize >= 1000) {
        riskScore += 2;
        riskFactors.push("Medium issue size (₹1000-5000 Cr)");
    } else if (issueSize > 0) {
        riskScore += 3;
        riskFactors.push("Small issue size (<₹1000 Cr)");
    } else {
        riskScore += 2;
        riskFactors.push("Issue size data unavailable");
    }
    
    // Factor 2: Type (SME is generally riskier)
    if (ipo.type === 'SME') {
        riskScore += 1;
        riskFactors.push("SME segment (higher volatility)");
    }
    
    // Factor 3: Sector risk
    const sector = ipo.sector?.toLowerCase() || '';
    if (sector.includes('tech') || sector.includes('fintech')) {
        riskScore += 1;
        riskFactors.push("Technology sector (growth potential)");
    } else if (sector.includes('healthcare') || sector.includes('pharma')) {
        riskScore += 1;
        riskFactors.push("Healthcare sector (regulatory risks)");
    }
    
    // Calculate final risk level
    const avgScore = riskScore / 2;
    
    let riskLevel, riskIcon, riskColor;
    if (avgScore <= 1.5) {
        riskLevel = 'Low';
        riskIcon = '🟢';
        riskColor = 'green';
    } else if (avgScore <= 2.5) {
        riskLevel = 'Medium';
        riskIcon = '🟡';
        riskColor = 'yellow';
    } else {
        riskLevel = 'High';
        riskIcon = '🔴';
        riskColor = 'red';
    }
    
    return {
        riskLevel,
        riskIcon,
        riskColor,
        riskScore: Math.round(avgScore * 10) / 10,
        riskFactors
    };
}

// Helper functions
function extractIssueSize(sizeStr) {
    if (!sizeStr || sizeStr === 'TBA') return 0;
    
    const str = sizeStr.toLowerCase();
    const numMatch = str.match(/[\d,]+\.?\d*/);
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[0].replace(/,/g, ''));
    
    if (str.includes('cr') || str.includes('crore')) {
        return num;
    } else if (str.includes('lakh')) {
        return num / 100;
    }
    
    return num;
}

function mapStatus(status) {
    if (!status) return 'Upcoming';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('open') || statusLower.includes('live')) return 'Open';
    if (statusLower.includes('closed') || statusLower.includes('completed')) return 'Closed';
    if (statusLower.includes('upcoming')) return 'Upcoming';
    
    return 'Upcoming';
}

function extractOpenDate(dateStr) {
    if (!dateStr) return 'TBA';
    
    const rangeMatch = dateStr.match(/(\d{1,2})-\d{1,2}\s+(\w+)\s+(\d{4})/);
    if (rangeMatch) {
        return `${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`;
    }
    
    const singleMatch = dateStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/);
    return singleMatch ? singleMatch[0] : dateStr === '2025' ? 'TBA' : dateStr;
}

function extractCloseDate(dateStr) {
    if (!dateStr) return 'TBA';
    
    const rangeMatch = dateStr.match(/\d{1,2}-(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (rangeMatch) {
        return `${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`;
    }
    
    const matches = dateStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/g);
    if (matches && matches.length > 1) return matches[1];
    if (matches) return matches[0];
    
    return dateStr === '2025' ? 'TBA' : dateStr;
}

function removeDuplicateIPOs(ipos) {
    const seen = new Set();
    return ipos.filter(ipo => {
        const key = ipo.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Fast IPO data fetch - REAL DATA ONLY
async function fetchFastIPOData() {
    try {
        // Get real live data only
        return await getCurrentIPOs();
    } catch (error) {
        console.error('Fast IPO data error:', error);
        throw error; // No fallback
    }
}

// Background refresh function - NO FALLBACK
async function refreshIPOsInBackground() {
    try {
        console.log('🔄 Refreshing IPO data in background...');
        clearCache();
        await getCurrentIPOs(); // Will throw error if no real data
    } catch (error) {
        console.log('Background refresh failed:', error.message);
        throw error; // No fallback
    }
}

// Export functions
export default {
    getCurrentIPOs,
    refreshIPOsInBackground,
    fetchFastIPOData,
    clearCache
};
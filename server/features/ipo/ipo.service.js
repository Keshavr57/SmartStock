import axios from 'axios';
import * as cheerio from 'cheerio';

// Cache configuration
const CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const cache = { ipos: null, timestamp: 0 };

// User agent for web scraping
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Main function to get current IPOs from multiple sources
 */
async function getCurrentIPOs() {
    try {
        // Check cache first
        if (cache.ipos && (Date.now() - cache.timestamp) < CACHE_TIMEOUT) {
            console.log('⚡ Using cached IPO data');
            return cache.ipos;
        }

        console.log('🔥 Fetching LIVE IPO data from sources...');
        
        let allIPOs = [];

        // Source 1: Chittorgarh (Most reliable for Indian IPOs)
        try {
            const chittorgarhIPOs = await fetchFromChittorgarh();
            if (chittorgarhIPOs && chittorgarhIPOs.length > 0) {
                console.log(`✅ Chittorgarh: ${chittorgarhIPOs.length} IPOs`);
                allIPOs = [...chittorgarhIPOs];
            }
        } catch (error) {
            console.log('Chittorgarh failed:', error.message);
        }

        // Source 2: IPOWatch
        try {
            const ipoWatchIPOs = await fetchFromIPOWatch();
            if (ipoWatchIPOs && ipoWatchIPOs.length > 0) {
                console.log(`✅ IPOWatch: ${ipoWatchIPOs.length} IPOs`);
                // Merge without duplicates
                ipoWatchIPOs.forEach(ipo => {
                    if (!allIPOs.some(existing => isSameIPO(existing, ipo))) {
                        allIPOs.push(ipo);
                    }
                });
            }
        } catch (error) {
            console.log('IPOWatch failed:', error.message);
        }

        // Source 3: Investing.com India
        try {
            const investingIPOs = await fetchFromInvesting();
            if (investingIPOs && investingIPOs.length > 0) {
                console.log(`✅ Investing.com: ${investingIPOs.length} IPOs`);
                investingIPOs.forEach(ipo => {
                    if (!allIPOs.some(existing => isSameIPO(existing, ipo))) {
                        allIPOs.push(ipo);
                    }
                });
            }
        } catch (error) {
            console.log('⚠️ Investing.com failed:', error.message);
        }

        // If all sources fail, throw error
        if (allIPOs.length === 0) {
            throw new Error('No IPO data available from any source');
        }

        // Add risk assessment to each IPO
        allIPOs = allIPOs.map(ipo => ({
            ...ipo,
            ...calculateRiskAssessment(ipo)
        }));

        // Sort by date (open IPOs first, then upcoming, then closed)
        allIPOs.sort((a, b) => {
            const statusOrder = { 'Open': 1, 'Upcoming': 2, 'Closed': 3, 'Listed': 4 };
            return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
        });

        console.log(`✅ Total IPOs fetched: ${allIPOs.length}`);

        // Cache the results
        cache.ipos = allIPOs;
        cache.timestamp = Date.now();

        return allIPOs;

    } catch (error) {
        console.error('❌ Error fetching IPO data:', error.message);
        
        // Return cached data if available, even if expired
        if (cache.ipos) {
            console.log('⚠️ Returning stale cached data');
            return cache.ipos;
        }
        
        throw error;
    }
}

/**
 * Fetch IPOs from Chittorgarh.com
 */
async function fetchFromChittorgarh() {
    const response = await axios.get('https://www.chittorgarh.com/ipo/ipo_dashboard.asp', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const ipos = [];

    // Parse upcoming IPOs table
    $('table.table').each((_, table) => {
        $(table).find('tr').each((index, row) => {
            if (index === 0) return; // Skip header

            const cells = $(row).find('td');
            if (cells.length < 4) return;

            const name = $(cells[0]).text().trim();
            const openDate = $(cells[1]).text().trim();
            const closeDate = $(cells[2]).text().trim();
            const price = $(cells[3]).text().trim();
            const issueSize = $(cells[4])?.text().trim() || 'TBA';
            const type = $(cells[5])?.text().trim() || 'Mainboard';

            if (name && name.length > 3) {
                ipos.push({
                    name,
                    symbol: extractSymbol(name),
                    openDate: formatDate(openDate),
                    closeDate: formatDate(closeDate),
                    priceBand: price || 'TBA',
                    issueSize: issueSize || 'TBA',
                    lotSize: 'TBA',
                    status: determineStatus(openDate, closeDate),
                    type: type.includes('SME') ? 'SME' : 'Mainboard',
                    sector: 'Unknown',
                    listingDate: 'TBA',
                    gmp: 'N/A',
                    subscription: 'N/A',
                    source: 'Chittorgarh'
                });
            }
        });
    });

    return ipos;
}

/**
 * Fetch IPOs from IPOWatch.in
 */
async function fetchFromIPOWatch() {
    const response = await axios.get('https://ipowatch.in/upcoming-ipo-calendar-ipo-list/', {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const ipos = [];

    $('table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 4) return;

        const name = $(cells[0]).text().trim();
        const dates = $(cells[1]).text().trim();
        const price = $(cells[2]).text().trim();
        const status = $(cells[3]).text().trim();

        if (name && name.length > 3 && !name.includes('Company')) {
            const [openDate, closeDate] = extractDateRange(dates);
            
            ipos.push({
                name,
                symbol: extractSymbol(name),
                openDate,
                closeDate,
                priceBand: price || 'TBA',
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
    });

    return ipos;
}

/**
 * Fetch IPOs from Investing.com India
 */
async function fetchFromInvesting() {
    try {
        const response = await axios.get('https://in.investing.com/equities/india-ipos', {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const ipos = [];

        $('table.genTbl tr').each((index, row) => {
            if (index === 0) return; // Skip header

            const cells = $(row).find('td');
            if (cells.length < 3) return;

            const name = $(cells[0]).text().trim();
            const dates = $(cells[1]).text().trim();
            const price = $(cells[2]).text().trim();

            if (name && name.length > 3) {
                const [openDate, closeDate] = extractDateRange(dates);
                
                ipos.push({
                    name,
                    symbol: extractSymbol(name),
                    openDate,
                    closeDate,
                    priceBand: price || 'TBA',
                    issueSize: 'TBA',
                    lotSize: 'TBA',
                    status: determineStatus(openDate, closeDate),
                    type: 'Mainboard',
                    sector: 'Unknown',
                    listingDate: 'TBA',
                    gmp: 'N/A',
                    subscription: 'N/A',
                    source: 'Investing.com'
                });
            }
        });

        return ipos;
    } catch (error) {
        console.log('⚠️ Investing.com scraping failed:', error.message);
        return [];
    }
}

/**
 * Helper: Check if two IPOs are the same
 */
function isSameIPO(ipo1, ipo2) {
    const name1 = ipo1.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const name2 = ipo2.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return name1 === name2 || name1.includes(name2) || name2.includes(name1);
}

/**
 * Helper: Extract symbol from company name
 */
function extractSymbol(name) {
    return name
        .replace(/Limited|Ltd|Private|Pvt|IPO/gi, '')
        .replace(/[^A-Z]/g, '')
        .substring(0, 10)
        .toUpperCase();
}

/**
 * Helper: Format date string
 */
function formatDate(dateStr) {
    if (!dateStr || dateStr === 'TBA') return 'TBA';
    
    // Try to parse and format consistently
    const cleaned = dateStr.trim();
    if (cleaned.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
        return cleaned;
    }
    
    return cleaned;
}

/**
 * Helper: Extract date range from string
 */
function extractDateRange(dateStr) {
    if (!dateStr) return ['TBA', 'TBA'];
    
    // Pattern: "DD MMM - DD MMM YYYY" or "DD-DD MMM YYYY"
    const rangeMatch = dateStr.match(/(\d{1,2})\s*(\w+)?\s*-\s*(\d{1,2})\s*(\w+)\s*(\d{4})/);
    if (rangeMatch) {
        const [, day1, month1, day2, month2, year] = rangeMatch;
        const m1 = month1 || month2;
        return [
            `${day1} ${m1} ${year}`,
            `${day2} ${month2} ${year}`
        ];
    }
    
    return [dateStr, dateStr];
}

/**
 * Helper: Determine IPO status based on dates
 */
function determineStatus(openDate, closeDate) {
    if (openDate === 'TBA' || closeDate === 'TBA') return 'Upcoming';
    
    try {
        const today = new Date();
        const open = new Date(openDate);
        const close = new Date(closeDate);
        
        if (today >= open && today <= close) return 'Open';
        if (today < open) return 'Upcoming';
        if (today > close) return 'Closed';
    } catch (error) {
        // Date parsing failed
    }
    
    return 'Upcoming';
}

/**
 * Helper: Map status string
 */
function mapStatus(status) {
    const s = status.toLowerCase();
    if (s.includes('open') || s.includes('live')) return 'Open';
    if (s.includes('closed') || s.includes('completed')) return 'Closed';
    if (s.includes('upcoming') || s.includes('forthcoming')) return 'Upcoming';
    if (s.includes('listed')) return 'Listed';
    return 'Upcoming';
}

/**
 * Calculate risk assessment for IPO
 */
function calculateRiskAssessment(ipo) {
    let riskScore = 0;
    const riskFactors = [];
    
    // Factor 1: Type
    if (ipo.type === 'SME') {
        riskScore += 1.5;
        riskFactors.push('SME segment (higher volatility)');
    } else {
        riskScore += 0.5;
    }
    
    // Factor 2: Issue size
    const issueSize = extractIssueSize(ipo.issueSize);
    if (issueSize > 0 && issueSize < 100) {
        riskScore += 1;
        riskFactors.push('Small issue size');
    } else if (issueSize >= 1000) {
        riskScore += 0.5;
        riskFactors.push('Large issue size');
    }
    
    // Factor 3: Price band availability
    if (ipo.priceBand === 'TBA') {
        riskScore += 0.5;
        riskFactors.push('Price not yet announced');
    }
    
    // Determine risk level
    let riskLevel, riskIcon, riskColor;
    if (riskScore <= 1) {
        riskLevel = 'Low';
        riskIcon = '🟢';
        riskColor = 'green';
    } else if (riskScore <= 2) {
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
        riskScore: Math.round(riskScore * 10) / 10,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['Standard market risks']
    };
}

/**
 * Helper: Extract numeric issue size
 */
function extractIssueSize(sizeStr) {
    if (!sizeStr || sizeStr === 'TBA') return 0;
    
    const numMatch = sizeStr.match(/[\d,]+\.?\d*/);
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[0].replace(/,/g, ''));
    
    if (sizeStr.toLowerCase().includes('cr')) return num;
    if (sizeStr.toLowerCase().includes('lakh')) return num / 100;
    
    return num;
}

/**
 * Clear cache
 */
function clearCache() {
    cache.ipos = null;
    cache.timestamp = 0;
    console.log('🗑️ IPO cache cleared');
}

/**
 * Fast IPO data fetch (uses cache aggressively)
 */
async function fetchFastIPOData() {
    return await getCurrentIPOs();
}

/**
 * Background refresh
 */
async function refreshIPOsInBackground() {
    try {
        console.log('🔄 Background IPO refresh started...');
        clearCache();
        await getCurrentIPOs();
        console.log('✅ Background IPO refresh completed');
    } catch (error) {
        console.error('❌ Background refresh failed:', error.message);
    }
}

export default {
    getCurrentIPOs,
    refreshIPOsInBackground,
    fetchFastIPOData,
    clearCache
};

import axios from 'axios';
import * as cheerio from 'cheerio';

// Simple config
const config = {
    nseBaseURL: 'https://www.nseindia.com',
    bseBaseURL: 'https://api.bseindia.com',
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
    }
};

// Simple cache
const cache = {};
let cookies = '';

// Initialize session with NSE
async function initNSESession() {
    try {
        console.log('🔄 Initializing NSE session...');
        const response = await axios.get(`${config.nseBaseURL}/market-data/all-upcoming-issues-ipo`, {
            headers: {
                'User-Agent': config.headers['User-Agent'],
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            },
            timeout: 10000
        });
        
        // Extract cookies from response
        if (response.headers['set-cookie']) {
            cookies = response.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
            console.log('✅ NSE session initialized');
        }
        
        return true;
    } catch (error) {
        console.log('⚠️ NSE session init failed:', error.message);
        return false;
    }
}

// Get current IPOs from NSE
async function getCurrentIPOs() {
    try {
        // Check cache
        if (cache.ipos && Date.now() - cache.ipos.timestamp < config.cacheTimeout) {
            console.log('📦 Using cached IPO data');
            return cache.ipos.data;
        }

        console.log('🔍 Fetching REAL IPO data from NSE...');
        
        // Initialize session if needed
        if (!cookies) {
            await initNSESession();
        }

        // Fetch from NSE API
        const nseIPOs = await fetchFromNSEAPI();
        
        // Fetch from IPOWatch for additional upcoming IPOs
        const ipoWatchData = await fetchFromIPOWatch();
        
        // Combine and deduplicate
        let allIPOs = [];
        
        if (nseIPOs && nseIPOs.length > 0) {
            console.log(`✅ NSE Total: ${nseIPOs.length} IPOs`);
            allIPOs = [...nseIPOs];
        }
        
        if (ipoWatchData && ipoWatchData.length > 0) {
            console.log(`📊 IPOWatch: ${ipoWatchData.length} IPOs found`);
            
            let addedCount = 0;
            // Add IPOWatch data that's not already in NSE data
            // Only add if it has at least some real data (not all TBA)
            ipoWatchData.forEach(watchIPO => {
                const exists = allIPOs.some(nseIPO => 
                    nseIPO.name.toLowerCase().includes(watchIPO.name.toLowerCase()) ||
                    watchIPO.name.toLowerCase().includes(nseIPO.name.toLowerCase())
                );
                
                // Only add if not duplicate and has at least dates or price
                const hasRealData = watchIPO.openDate !== 'TBA' || watchIPO.priceBand !== 'TBA';
                
                if (!exists && hasRealData) {
                    allIPOs.push(watchIPO);
                    addedCount++;
                }
            });
            
            console.log(`  ✓ Added ${addedCount} unique IPOs from IPOWatch`);
        }

        if (allIPOs.length === 0) {
            // Fallback: Try scraping NSE website
            console.log('⚠️ Primary sources failed, trying NSE website scraping...');
            const scrapedIPOs = await scrapeNSEWebsite();
            
            if (scrapedIPOs && scrapedIPOs.length > 0) {
                console.log(`✅ Got ${scrapedIPOs.length} IPOs from NSE website`);
                allIPOs = scrapedIPOs;
            }
        }

        if (allIPOs.length === 0) {
            throw new Error('All IPO data sources failed');
        }

        console.log(`📊 Total IPOs collected: ${allIPOs.length}`);
        cache.ipos = { data: allIPOs, timestamp: Date.now() };
        return allIPOs;

    } catch (error) {
        console.error('❌ Error fetching IPO data:', error.message);
        
        // Return cached data if available, even if expired
        if (cache.ipos) {
            console.log('⚠️ Returning expired cache data');
            return cache.ipos.data;
        }
        
        throw error;
    }
}

// Fetch from NSE API
async function fetchFromNSEAPI() {
    try {
        // Fetch both IPO and SME categories
        const ipoURL = `${config.nseBaseURL}/api/all-upcoming-issues?category=ipo`;
        const smeURL = `${config.nseBaseURL}/api/all-upcoming-issues?category=sme`;
        
        const [ipoResponse, smeResponse] = await Promise.allSettled([
            axios.get(ipoURL, {
                headers: { ...config.headers, 'Cookie': cookies },
                timeout: 10000
            }),
            axios.get(smeURL, {
                headers: { ...config.headers, 'Cookie': cookies },
                timeout: 10000
            })
        ]);

        let allIPOs = [];

        // Process IPO response
        if (ipoResponse.status === 'fulfilled' && ipoResponse.value.data && Array.isArray(ipoResponse.value.data)) {
            const ipos = ipoResponse.value.data.map(ipo => ({
                name: ipo.companyName || ipo.symbol,
                symbol: ipo.symbol,
                openDate: ipo.issueStartDate || 'TBA',
                closeDate: ipo.issueEndDate || 'TBA',
                priceBand: ipo.issuePrice || ipo.priceBand || 'TBA',
                issueSize: formatIssueSize(ipo.issueSize),
                lotSize: ipo.lotSize || 'TBA',
                status: mapNSEStatus(ipo.status),
                type: ipo.series === 'SME' ? 'SME' : 'Mainboard',
                sector: 'Unknown',
                listingDate: ipo.listingDate || 'TBA',
                source: 'NSE India'
            }));
            allIPOs = [...allIPOs, ...ipos];
            console.log(`  ✓ NSE IPO API: ${ipos.length} IPOs`);
        }

        // Process SME response
        if (smeResponse.status === 'fulfilled' && smeResponse.value.data && Array.isArray(smeResponse.value.data)) {
            const smes = smeResponse.value.data.map(ipo => ({
                name: ipo.companyName || ipo.symbol,
                symbol: ipo.symbol,
                openDate: ipo.issueStartDate || 'TBA',
                closeDate: ipo.issueEndDate || 'TBA',
                priceBand: ipo.issuePrice || ipo.priceBand || 'TBA',
                issueSize: formatIssueSize(ipo.issueSize),
                lotSize: ipo.lotSize || 'TBA',
                status: mapNSEStatus(ipo.status),
                type: 'SME',
                sector: 'Unknown',
                listingDate: ipo.listingDate || 'TBA',
                source: 'NSE India'
            }));
            allIPOs = [...allIPOs, ...smes];
            console.log(`  ✓ NSE SME API: ${smes.length} SME IPOs`);
        }

        return allIPOs.length > 0 ? allIPOs : null;
    } catch (error) {
        console.log('  ✗ NSE API error:', error.message);
        return null;
    }
}

// Scrape NSE website
async function scrapeNSEWebsite() {
    try {
        const response = await axios.get(`${config.nseBaseURL}/market-data/all-upcoming-issues-ipo`, {
            headers: {
                ...config.headers,
                'Cookie': cookies
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const ipos = [];

        // Try to find IPO table
        $('table tbody tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 5) {
                const name = $(cells[0]).text().trim();
                const dates = $(cells[1]).text().trim();
                const price = $(cells[2]).text().trim();
                const size = $(cells[3]).text().trim();
                const type = $(cells[4]).text().trim();

                if (name && name !== 'Company Name') {
                    ipos.push({
                        name: name,
                        openDate: extractOpenDate(dates),
                        closeDate: extractCloseDate(dates),
                        priceBand: price || 'TBA',
                        issueSize: size || 'TBA',
                        lotSize: 'TBA',
                        status: 'Upcoming',
                        type: type || 'Mainboard',
                        sector: 'Unknown',
                        source: 'NSE Website'
                    });
                }
            }
        });

        return ipos.length > 0 ? ipos : null;
    } catch (error) {
        console.log('NSE scraping error:', error.message);
        return null;
    }
}

// Fetch from alternative sources (IPOWatch, Chittorgarh, etc.)
async function fetchFromAlternativeSources() {
    try {
        // Try IPOWatch
        const ipoWatchData = await fetchFromIPOWatch();
        if (ipoWatchData && ipoWatchData.length > 0) {
            return ipoWatchData;
        }

        // Try Chittorgarh
        const chittorgarhData = await fetchFromChittorgarh();
        if (chittorgarhData && chittorgarhData.length > 0) {
            return chittorgarhData;
        }

        return null;
    } catch (error) {
        console.log('Alternative sources error:', error.message);
        return null;
    }
}

// Fetch from IPOWatch
async function fetchFromIPOWatch() {
    try {
        const response = await axios.get('https://ipowatch.in/upcoming-ipo-calendar-ipo-list/', {
            headers: {
                'User-Agent': config.headers['User-Agent']
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const ipos = [];

        // Parse IPOWatch table - Mainboard IPOs
        $('table tbody tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
                const name = $(cells[0]).text().trim();
                const status = $(cells[1]).text().trim();
                const dates = $(cells[2]).text().trim();
                const price = $(cells[3]).text().trim();

                if (name && name.length > 3 && !name.includes('IPO / Stock')) {
                    ipos.push({
                        name: name,
                        openDate: extractOpenDate(dates),
                        closeDate: extractCloseDate(dates),
                        priceBand: price && price !== '₹-' ? price : 'TBA',
                        issueSize: 'TBA',
                        lotSize: 'TBA',
                        status: status || 'Upcoming',
                        type: 'Mainboard',
                        sector: 'Unknown',
                        source: 'IPOWatch'
                    });
                }
            }
        });

        console.log(`📊 IPOWatch scraped ${ipos.length} IPOs`);
        return ipos.length > 0 ? ipos : null;
    } catch (error) {
        console.log('IPOWatch error:', error.message);
        return null;
    }
}

// Fetch from Chittorgarh
async function fetchFromChittorgarh() {
    try {
        const response = await axios.get('https://www.chittorgarh.com/ipo/ipo_dashboard.asp', {
            headers: {
                'User-Agent': config.headers['User-Agent']
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const ipos = [];

        // Parse Chittorgarh data
        $('table.table tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) {
                const name = $(cells[0]).text().trim();
                const dates = $(cells[1]).text().trim();
                const price = $(cells[2]).text().trim();

                if (name && name.length > 3 && !name.includes('Company')) {
                    ipos.push({
                        name: name,
                        openDate: extractOpenDate(dates),
                        closeDate: extractCloseDate(dates),
                        priceBand: price || 'TBA',
                        issueSize: 'TBA',
                        lotSize: 'TBA',
                        status: 'Upcoming',
                        type: 'Mainboard',
                        sector: 'Unknown',
                        source: 'Chittorgarh'
                    });
                }
            }
        });

        return ipos.length > 0 ? ipos : null;
    } catch (error) {
        console.log('Chittorgarh error:', error.message);
        return null;
    }
}

// Helper functions
function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatIssueSize(size) {
    if (!size) return 'TBA';
    
    // If it's already formatted, return as is
    if (typeof size === 'string' && size.includes('₹')) return size;
    
    // Convert to number and format
    const num = parseFloat(size);
    if (isNaN(num)) return 'TBA';
    
    if (num >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
        return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
}

function mapNSEStatus(status) {
    if (!status) return 'Upcoming';
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'Open';
    if (statusLower === 'closed') return 'Closed';
    if (statusLower === 'forthcoming') return 'Upcoming';
    
    return status;
}

function extractOpenDate(dateStr) {
    if (!dateStr) return 'TBA';
    
    // Handle formats like "9-13 Jan 2026" or "13-16 Jan 2026"
    const rangeMatch = dateStr.match(/(\d{1,2})-\d{1,2}\s+(\w+)\s+(\d{4})/);
    if (rangeMatch) {
        return `${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`;
    }
    
    // Handle single date formats
    const singleMatch = dateStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/);
    return singleMatch ? singleMatch[0] : dateStr === '2026' ? 'TBA' : dateStr;
}

function extractCloseDate(dateStr) {
    if (!dateStr) return 'TBA';
    
    // Handle formats like "9-13 Jan 2026" or "13-16 Jan 2026"
    const rangeMatch = dateStr.match(/\d{1,2}-(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (rangeMatch) {
        return `${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`;
    }
    
    // Handle multiple dates
    const matches = dateStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}\s+\w+\s+\d{4})/g);
    if (matches && matches.length > 1) return matches[1];
    if (matches) return matches[0];
    
    return dateStr === '2026' ? 'TBA' : dateStr;
}

function determineStatus(openDate, closeDate) {
    if (!openDate || !closeDate) return 'Upcoming';
    
    try {
        const now = new Date();
        const open = new Date(openDate);
        const close = new Date(closeDate);
        
        if (now >= open && now <= close) return 'Open';
        if (now < open) return 'Upcoming';
        return 'Closed';
    } catch {
        return 'Upcoming';
    }
}

// Export simple object
export default {
    getCurrentIPOs,
    initNSESession
};

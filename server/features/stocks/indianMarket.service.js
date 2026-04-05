import axios from "axios";

const config = {
    apiKey: process.env.INDIAN_API_KEY,
    baseUrl: "https://stock.indianapi.in"
};

const POPULAR_NSE = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'ITC.NS', name: 'ITC Ltd' }
];

// Get trending Indian stocks for home page
async function getTrendingStocks() {
    try {
        console.log("Fetching trending Indian stocks via Yahoo Finance...");

        const promises = POPULAR_NSE.map(async ({ symbol, name }) => {
            try {
                const res = await axios.get(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
                    {
                        timeout: 5000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    }
                );
                const meta = res.data?.chart?.result?.[0]?.meta;
                if (!meta?.regularMarketPrice) return null;
                return {
                    name,
                    symbol: symbol.replace('.NS', ''),
                    price: parseFloat(meta.regularMarketPrice.toFixed(2)),
                    change: parseFloat((meta.regularMarketChangePercent || 0).toFixed(2)),
                    vol: formatVolume(meta.regularMarketVolume || 0)
                };
            } catch {
                return null;
            }
        });

        const results = (await Promise.all(promises)).filter(Boolean);

        if (results.length > 0) {
            console.log(`✅ Yahoo Finance returned ${results.length} Indian stocks`);
            return results;
        }

        // Last resort: static fallback
        return getStaticFallback();

    } catch (error) {
        console.error("getTrendingStocks error:", error.message);
        return getStaticFallback();
    }
}

function getStaticFallback() {
    return [
        { name: "Reliance Industries", symbol: "RELIANCE", price: 1350.00, change: 0.5, vol: "15.2Cr" },
        { name: "Tata Consultancy Services", symbol: "TCS", price: 3280.00, change: 1.2, vol: "8.9Cr" },
        { name: "HDFC Bank", symbol: "HDFCBANK", price: 1650.00, change: -0.3, vol: "12.1Cr" },
        { name: "Infosys", symbol: "INFY", price: 1480.00, change: 0.8, vol: "9.5Cr" },
        { name: "ICICI Bank", symbol: "ICICIBANK", price: 1100.00, change: 1.1, vol: "10.2Cr" },
        { name: "Bharti Airtel", symbol: "BHARTIARTL", price: 1750.00, change: 0.6, vol: "7.3Cr" }
    ];
}

// Get upcoming IPOs from Indian API
async function getUpcomingIPOs() {
    try {
        console.log("Fetching upcoming IPOs from Indian API...");
        
        const response = await axios.get(`${config.baseUrl}/upcoming-ipos`, {
            headers: {
                "X-Api-Key": config.apiKey
            }
        });

        if (response.data && response.data.length > 0) {
            return response.data.map(ipo => ({
                name: ipo.companyName || ipo.name,
                openDate: ipo.openDate || ipo.open_date,
                closeDate: ipo.closeDate || ipo.close_date,
                priceBand: ipo.priceBand || ipo.price_band || "TBA",
                issueSize: ipo.issueSize || ipo.issue_size || "TBA",
                type: ipo.category || ipo.type || "Mainboard",
                status: getIPOStatus(ipo.openDate, ipo.closeDate),
                lotSize: ipo.lotSize || ipo.lot_size || "TBA",
                listing: ipo.listingDate || ipo.listing_date || "TBA"
            }));
        }

        return [];

    } catch (error) {
        return [];
    }
}

// Helper to determine IPO status
function getIPOStatus(openDate, closeDate) {
    if (!openDate || !closeDate) return "Upcoming";
    
    const now = new Date();
    const open = new Date(openDate);
    const close = new Date(closeDate);

    if (now < open) return "Upcoming";
    if (now >= open && now <= close) return "Open";
    if (now > close) return "Closed";
    
    return "Upcoming";
}

// Format volume for display
function formatVolume(volume) {
    if (!volume) return "N/A";
    
    const vol = parseFloat(volume);
    if (vol >= 10000000) {
        return `${(vol / 10000000).toFixed(1)}Cr`;
    } else if (vol >= 100000) {
        return `${(vol / 100000).toFixed(1)}L`;
    } else if (vol >= 1000) {
        return `${(vol / 1000).toFixed(1)}K`;
    }
    return vol.toString();
}

// Export simple object with functions
export default {
    getTrendingStocks,
    getUpcomingIPOs
};

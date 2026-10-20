import axios from 'axios';

const INDIAN_API_KEY = process.env.INDIAN_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;

// NSE Top Gainers and Losers - REAL DATA ONLY
export const getTopMovers = async () => {
    try {
        // Try each real source; first one that answers wins
        const results = await Promise.allSettled([
            fetchFromIndianAPI(),
            fetchFromYahooNSE(),
            fetchFromAlphaVantage()
        ]);
        
        // Use the first successful result
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                console.log('✅ Successfully fetched REAL top movers data');
                return result.value;
            }
        }
        
        console.warn('⚠️ All top-mover sources failed');
        return { gainers: [], losers: [], unavailable: true };
    } catch (error) {
        console.error('❌ Error fetching top movers:', error.message);
        return { gainers: [], losers: [], unavailable: true };
    }
};

// Indian API - Real NSE Data
const fetchFromIndianAPI = async () => {
    try {
        console.log('🔄 Trying Indian API for real NSE data...');
        
        if (!INDIAN_API_KEY) {
            throw new Error('Indian API key not found');
        }
        
        // Try multiple Indian API endpoints
        const endpoints = [
            `https://api.indianapi.in/nse/top-gainers-losers?key=${INDIAN_API_KEY}`,
            `https://api.stockapi.in/v1/nse/gainers-losers?apikey=${INDIAN_API_KEY}`,
            'https://api.stockedge.com/Api/SecurityDashboardApi/GetTopGainersLosers/1/50'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🔄 Trying endpoint: ${endpoint.split('?')[0]}...`);
                
                const response = await axios.get(endpoint, {
                    headers: {
                        'X-API-Key': INDIAN_API_KEY,
                        'Authorization': `Bearer ${INDIAN_API_KEY}`,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    },
                    timeout: 8000
                });
                
                console.log('✅ Indian API response received:', response.status);
                
                // Try to parse different response formats
                if (response.data) {
                    // Format 1: Direct gainers/losers
                    if (response.data.gainers && response.data.losers) {
                        return parseGainersLosers(response.data.gainers, response.data.losers);
                    }
                    
                    // Format 2: Nested data
                    if (response.data.data && response.data.data.gainers) {
                        return parseGainersLosers(response.data.data.gainers, response.data.data.losers);
                    }
                    
                    // Format 3: Array format
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        return parseArrayData(response.data);
                    }
                    
                    // Format 4: Success wrapper
                    if (response.data.success && response.data.result) {
                        const result = response.data.result;
                        if (result.gainers && result.losers) {
                            return parseGainersLosers(result.gainers, result.losers);
                        }
                    }
                }
                
            } catch (endpointError) {
                console.log(`❌ Endpoint failed: ${endpointError.message}`);
                continue; // Try next endpoint
            }
        }
        
        throw new Error('All Indian API endpoints failed');
        
    } catch (error) {
        console.log('❌ Indian API failed:', error.message);
        throw error;
    }
};

// Yahoo Finance for NSE stocks
const fetchFromYahooNSE = async () => {
    try {
        console.log('🔄 Trying Yahoo Finance for NSE stocks...');
        
        // Popular NSE stocks to check
        const nseStocks = [
            'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
            'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
            'LT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'ULTRACEMCO.NS',
            'ASIANPAINT.NS', 'NESTLEIND.NS', 'TITAN.NS', 'WIPRO.NS',
            'ADANIENT.NS', 'JSWSTEEL.NS', 'COALINDIA.NS', 'ETERNAL.NS', 'PAYTM.NS', 'BAJFINANCE.NS', 'NTPC.NS', 'POWERGRID.NS', 'HCLTECH.NS', 'TMPV.NS'
        ];
        
        const stockData = [];
        
        // Fetch data for each stock (limit to avoid timeout)
        const promises = nseStocks.map(async (symbol) => {
            try {
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                    timeout: 4000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                const result = response.data.chart.result[0];
                const meta = result.meta;
                
                if (meta && meta.regularMarketPrice && meta.regularMarketChangePercent !== undefined) {
                    return {
                        symbol: symbol.replace('.NS', ''),
                        name: meta.longName || symbol.replace('.NS', ''),
                        price: meta.regularMarketPrice,
                        change: meta.regularMarketChangePercent,
                        volume: formatVolume(meta.regularMarketVolume)
                    };
                }
            } catch (err) {
                return null;
            }
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                stockData.push(result.value);
            }
        });
        
        if (stockData.length < 6) {
            throw new Error('Insufficient Yahoo data');
        }
        
        // Sort by change percentage
        stockData.sort((a, b) => b.change - a.change);
        
        console.log('✅ Yahoo Finance returned NSE data');
        // A gainer must actually be up and a loser actually down; on a broad sell-off there may be few gainers.
        return {
            gainers: stockData.filter(s => s.change > 0).slice(0, 5),
            losers: stockData.filter(s => s.change < 0).slice(-5).reverse()
        };
        
    } catch (error) {
        console.log('❌ Yahoo NSE API failed:', error.message);
        throw error;
    }
};

// Alpha Vantage API for real market data
const fetchFromAlphaVantage = async () => {
    try {
        console.log('🔄 Trying Alpha Vantage API for real market data...');
        
        const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
        if (!ALPHA_VANTAGE_KEY) {
            throw new Error('Alpha Vantage API key not found');
        }
        
        // Get top gainers/losers from Alpha Vantage
        const response = await axios.get(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_KEY}`, {
            timeout: 10000
        });
        
        if (response.data && response.data.top_gainers && response.data.top_losers) {
            // Use US market data as real market data (better than no data)
            const gainers = response.data.top_gainers
                .slice(0, 5)
                .map(stock => ({
                    symbol: stock.ticker,
                    name: stock.ticker,
                    price: parseFloat(stock.price),
                    change: parseFloat(stock.change_percentage.replace('%', '')),
                    volume: formatVolume(parseInt(stock.volume))
                }));
                
            const losers = response.data.top_losers
                .slice(0, 5)
                .map(stock => ({
                    symbol: stock.ticker,
                    name: stock.ticker,
                    price: parseFloat(stock.price),
                    change: parseFloat(stock.change_percentage.replace('%', '')),
                    volume: formatVolume(parseInt(stock.volume))
                }));
            
            if (gainers.length >= 3 && losers.length >= 3) {
                console.log('✅ Alpha Vantage API returned REAL market data (US stocks)');
                return { gainers, losers };
            }
        }
        
        throw new Error('Invalid Alpha Vantage response');
    } catch (error) {
        console.log('❌ Alpha Vantage API failed:', error.message);
        throw error;
    }
};

// Parse gainers and losers data
const parseGainersLosers = (gainers, losers) => {
    const parsedGainers = gainers.slice(0, 5).map(stock => ({
        symbol: stock.symbol || stock.tradingSymbol || stock.instrument_token,
        name: stock.companyName || stock.name || stock.tradingSymbol || stock.symbol,
        price: parseFloat(stock.lastPrice || stock.ltp || stock.price || stock.close),
        change: parseFloat(stock.pChange || stock.change_percent || stock.changePercent || stock.change),
        volume: formatVolume(stock.totalTradedVolume || stock.volume || stock.traded_volume)
    }));
    
    const parsedLosers = losers.slice(0, 5).map(stock => ({
        symbol: stock.symbol || stock.tradingSymbol || stock.instrument_token,
        name: stock.companyName || stock.name || stock.tradingSymbol || stock.symbol,
        price: parseFloat(stock.lastPrice || stock.ltp || stock.price || stock.close),
        change: parseFloat(stock.pChange || stock.change_percent || stock.changePercent || stock.change),
        volume: formatVolume(stock.totalTradedVolume || stock.volume || stock.traded_volume)
    }));
    
    if (parsedGainers.length >= 3 && parsedLosers.length >= 3) {
        console.log('✅ Indian API returned valid NSE data');
        return { gainers: parsedGainers, losers: parsedLosers };
    }
    
    throw new Error('Insufficient data from Indian API');
};

// Parse array data format
const parseArrayData = (data) => {
    const validStocks = data.filter(stock => 
        stock.price && stock.change !== undefined && stock.symbol
    );
    
    if (validStocks.length < 10) {
        throw new Error('Insufficient array data');
    }
    
    // Sort by change percentage
    validStocks.sort((a, b) => (b.change || 0) - (a.change || 0));
    
    const gainers = validStocks.filter(stock => (stock.change || 0) > 0).slice(0, 5);
    const losers = validStocks.filter(stock => (stock.change || 0) < 0).slice(-5).reverse();
    
    return parseGainersLosers(gainers, losers);
};

// Helper function to format volume
const formatVolume = (volume) => {
    if (!volume) return null;
    
    if (volume > 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume > 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
};

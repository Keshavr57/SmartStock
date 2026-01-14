import axios from 'axios';

// Simple state storage (no class needed)
const state = {
    io: null,
    subscribers: {}, // symbol -> array of socket IDs
    priceCache: {}, // symbol -> latest price data
    pollingIntervals: {}, // symbol -> interval ID
    isPolling: false
};

// Initialize with socket.io instance
function initialize(io) {
    state.io = io;
}

function subscribeToPrice(socket, symbol) {
    console.log(`Subscribing ${socket.id} to ${symbol} via NSE polling`);
    
    // Add socket to subscribers
    if (!state.subscribers[symbol]) {
        state.subscribers[symbol] = [];
    }
    if (!state.subscribers[symbol].includes(socket.id)) {
        state.subscribers[symbol].push(socket.id);
    }

    // Send cached price if available
    if (state.priceCache[symbol]) {
        socket.emit('price-update', {
            symbol: symbol,
            ...state.priceCache[symbol]
        });
    }

    // Start polling for this symbol if not already polling
    if (!state.pollingIntervals[symbol]) {
        startPolling(symbol);
    }
}

function unsubscribeFromPrice(socket, symbol) {
    if (state.subscribers[symbol]) {
        state.subscribers[symbol] = state.subscribers[symbol].filter(id => id !== socket.id);
        
        // Stop polling if no more subscribers
        if (state.subscribers[symbol].length === 0) {
            stopPolling(symbol);
        }
    }
}

function startPolling(symbol) {
    console.log(`🔄 Starting NSE polling for ${symbol}`);
    
    // Poll every 5 seconds (NSE free tier limit)
    const intervalId = setInterval(async () => {
        try {
            await fetchNSEPrice(symbol);
        } catch (error) {
            console.error(`Error polling NSE for ${symbol}:`, error.message);
        }
    }, 5000);
    
    state.pollingIntervals[symbol] = intervalId;
    
    // Fetch immediately
    fetchNSEPrice(symbol);
}

function stopPolling(symbol) {
    if (state.pollingIntervals[symbol]) {
        clearInterval(state.pollingIntervals[symbol]);
        delete state.pollingIntervals[symbol];
        delete state.subscribers[symbol];
        console.log(`⏹️ Stopped NSE polling for ${symbol}`);
    }
}

async function fetchNSEPrice(symbol) {
    try {
        // Clean symbol for NSE API
        const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
        
        // NSE India free API endpoints
        const nseUrls = [
            `https://www.nseindia.com/api/quote-equity?symbol=${cleanSymbol}`,
            `https://www.nseindia.com/api/quote-derivative?symbol=${cleanSymbol}`,
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
        ];

        // Try NSE first, then Yahoo as fallback
        let priceData = null;
        
        for (const url of nseUrls) {
            try {
                if (url.includes('nseindia.com')) {
                    priceData = await fetchFromNSE(url, cleanSymbol);
                } else {
                    priceData = await fetchFromYahoo(url, symbol);
                }
                
                if (priceData) break;
            } catch (error) {
                console.log(`⚠️ Failed to fetch from ${url}: ${error.message}`);
                continue;
            }
        }

        if (priceData) {
            // Cache the price data
            state.priceCache[symbol] = priceData;

            // Broadcast to all subscribers
            if (state.subscribers[symbol]) {
                state.subscribers[symbol].forEach(socketId => {
                    state.io.to(socketId).emit('price-update', {
                        symbol: symbol,
                        ...priceData
                    });
                });
            }
            
            console.log(`Updated price for ${symbol}: ₹${priceData.price}`);
        }

    } catch (error) {
        console.error(`Error fetching NSE price for ${symbol}:`, error.message);
    }
}

async function fetchFromNSE(url, symbol) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        });

        if (response.data && response.data.priceInfo) {
            const data = response.data.priceInfo;
            
            return {
                price: parseFloat(data.lastPrice || data.close),
                change: parseFloat(data.change),
                changePercent: parseFloat(data.pChange),
                volume: parseInt(data.totalTradedVolume),
                high: parseFloat(data.intraDayHighLow?.max || data.dayHigh),
                low: parseFloat(data.intraDayHighLow?.min || data.dayLow),
                open: parseFloat(data.open),
                timestamp: new Date()
            };
        }
    } catch (error) {
        throw new Error(`NSE API error: ${error.message}`);
    }
    
    return null;
}

async function fetchFromYahoo(url, symbol) {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.chart && response.data.chart.result) {
            const result = response.data.chart.result[0];
            const meta = result.meta;
            
            return {
                price: parseFloat(meta.regularMarketPrice),
                change: parseFloat(meta.regularMarketPrice - meta.previousClose),
                changePercent: parseFloat(((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100),
                volume: parseInt(meta.regularMarketVolume),
                high: parseFloat(meta.regularMarketDayHigh),
                low: parseFloat(meta.regularMarketDayLow),
                open: parseFloat(meta.regularMarketDayLow),
                timestamp: new Date()
            };
        }
    } catch (error) {
        throw new Error(`Yahoo API error: ${error.message}`);
    }
    
    return null;
}

function cleanup(socket) {
    // Remove socket from all subscriptions
    Object.keys(state.subscribers).forEach(symbol => {
        state.subscribers[symbol] = state.subscribers[symbol].filter(id => id !== socket.id);
        
        // Stop polling if no more subscribers
        if (state.subscribers[symbol].length === 0) {
            stopPolling(symbol);
        }
    });
}

// Export simple object with functions (no class)
export default function(io) {
    initialize(io);
    return {
        subscribeToPrice,
        unsubscribeFromPrice,
        cleanup
    };
}

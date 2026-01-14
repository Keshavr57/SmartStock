import fetch from 'node-fetch';

// Simple state storage - no class
const state = {
    io: null,
    connections: {}, // symbol -> interval ID
    subscribers: {}, // symbol -> array of socket IDs
    priceCache: {} // symbol -> latest price data
};

// Initialize with socket.io instance
function initialize(io) {
    state.io = io;
}

function subscribeToPrice(socket, symbol) {
    console.log(`📊 Subscribing ${socket.id} to ${symbol} via Yahoo polling`);
    
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

    // Create polling if not exists
    if (!state.connections[symbol]) {
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
    console.log(`🔄 Starting Yahoo polling for ${symbol}`);
    
    // Poll every 10 seconds
    const intervalId = setInterval(async () => {
        try {
            await fetchYahooPrice(symbol);
        } catch (error) {
            console.error(`❌ Error polling Yahoo for ${symbol}:`, error.message);
        }
    }, 10000);
    
    state.connections[symbol] = intervalId;
    
    // Fetch immediately
    fetchYahooPrice(symbol);
}

function stopPolling(symbol) {
    if (state.connections[symbol]) {
        clearInterval(state.connections[symbol]);
        delete state.connections[symbol];
        delete state.subscribers[symbol];
        console.log(`🔌 Stopped Yahoo polling for ${symbol}`);
    }
}

async function fetchYahooPrice(symbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            
            const priceData = {
                price: parseFloat(meta.regularMarketPrice || meta.previousClose),
                change: parseFloat(meta.regularMarketPrice - meta.previousClose),
                changePercent: parseFloat(((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100),
                volume: parseInt(meta.regularMarketVolume || 0),
                high: parseFloat(meta.regularMarketDayHigh || meta.regularMarketPrice),
                low: parseFloat(meta.regularMarketDayLow || meta.regularMarketPrice),
                open: parseFloat(meta.regularMarketDayLow || meta.regularMarketPrice),
                timestamp: new Date()
            };

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
            
            console.log(`✅ Updated Yahoo price for ${symbol}: ${priceData.price}`);
        }
    } catch (error) {
        console.error(`❌ Error fetching Yahoo price for ${symbol}:`, error.message);
    }
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

// Export factory function
export default function(io) {
    initialize(io);
    return {
        subscribeToPrice,
        unsubscribeFromPrice,
        cleanup
    };
}

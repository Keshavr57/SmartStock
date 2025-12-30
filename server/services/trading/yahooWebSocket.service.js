import WebSocket from 'ws';
import fetch from 'node-fetch';

class YahooWebSocketService {
    constructor(io) {
        this.io = io;
        this.connections = new Map(); // symbol -> WebSocket connection
        this.subscribers = new Map(); // symbol -> Set of socket IDs
        this.priceCache = new Map(); // symbol -> latest price data
        this.reconnectAttempts = new Map(); // symbol -> attempt count
    }

    subscribeToPrice(socket, symbol) {
        console.log(`📊 Subscribing ${socket.id} to ${symbol} via Yahoo WebSocket`);
        
        // Add socket to subscribers
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
        }
        this.subscribers.get(symbol).add(socket.id);

        // Send cached price if available
        if (this.priceCache.has(symbol)) {
            socket.emit('price-update', {
                symbol: symbol,
                ...this.priceCache.get(symbol)
            });
        }

        // Create WebSocket connection if not exists
        if (!this.connections.has(symbol)) {
            this.createYahooWebSocketConnection(symbol);
        }
    }

    unsubscribeFromPrice(socket, symbol) {
        if (this.subscribers.has(symbol)) {
            this.subscribers.get(symbol).delete(socket.id);
            
            // Close connection if no more subscribers
            if (this.subscribers.get(symbol).size === 0) {
                this.closeWebSocketConnection(symbol);
            }
        }
    }

    createYahooWebSocketConnection(symbol) {
        try {
            console.log(`🔄 Starting Yahoo polling for ${symbol} (WebSocket not available)`);
            
            // Yahoo Finance doesn't have a public WebSocket API
            // So we'll use polling instead but make it feel real-time
            const intervalId = setInterval(async () => {
                try {
                    await this.fetchYahooPrice(symbol);
                } catch (error) {
                    console.error(`❌ Error polling Yahoo for ${symbol}:`, error.message);
                }
            }, 10000); // Poll every 10 seconds
            
            // Store the interval ID as our "connection"
            this.connections.set(symbol, { intervalId, type: 'polling' });
            this.reconnectAttempts.set(symbol, 0);
            
            // Fetch immediately
            this.fetchYahooPrice(symbol);
            
        } catch (error) {
            console.error(`❌ Failed to create Yahoo connection for ${symbol}:`, error);
            this.handleReconnection(symbol);
        }
    }

    async fetchYahooPrice(symbol) {
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
                this.priceCache.set(symbol, priceData);

                // Broadcast to all subscribers
                if (this.subscribers.has(symbol)) {
                    this.subscribers.get(symbol).forEach(socketId => {
                        this.io.to(socketId).emit('price-update', {
                            symbol: symbol,
                            ...priceData
                        });
                    });
                }
                
                console.log(`✅ Updated Yahoo price for ${symbol}: $${priceData.price}`);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(`❌ Error fetching Yahoo price for ${symbol}:`, error.message);
        }
    }

    handleReconnection(symbol) {
        const attempts = this.reconnectAttempts.get(symbol) || 0;
        
        if (attempts < 3 && this.subscribers.has(symbol) && this.subscribers.get(symbol).size > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff
            
            console.log(`🔄 Reconnecting to Yahoo for ${symbol} in ${delay}ms (attempt ${attempts + 1})`);
            
            setTimeout(() => {
                this.reconnectAttempts.set(symbol, attempts + 1);
                this.createYahooWebSocketConnection(symbol);
            }, delay);
        }
    }

    closeWebSocketConnection(symbol) {
        if (this.connections.has(symbol)) {
            const connection = this.connections.get(symbol);
            if (connection.type === 'polling') {
                clearInterval(connection.intervalId);
            } else {
                connection.close();
            }
            this.connections.delete(symbol);
            this.subscribers.delete(symbol);
            this.reconnectAttempts.delete(symbol);
            console.log(`🔌 Closed Yahoo connection for ${symbol}`);
        }
    }

    cleanup(socket) {
        // Remove socket from all subscriptions
        this.subscribers.forEach((socketSet, symbol) => {
            socketSet.delete(socket.id);
            
            // Close connection if no more subscribers
            if (socketSet.size === 0) {
                this.closeWebSocketConnection(symbol);
            }
        });
    }
}

export default YahooWebSocketService;
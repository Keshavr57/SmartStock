import WebSocket from 'ws';
import axios from 'axios';

class NSEWebSocketService {
    constructor(io) {
        this.io = io;
        this.subscribers = new Map(); // symbol -> Set of socket IDs
        this.priceCache = new Map(); // symbol -> latest price data
        this.pollingIntervals = new Map(); // symbol -> interval ID
        this.isPolling = false;
    }

    subscribeToPrice(socket, symbol) {
        console.log(`Subscribing ${socket.id} to ${symbol} via NSE polling`);
        
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

        // Start polling for this symbol if not already polling
        if (!this.pollingIntervals.has(symbol)) {
            this.startPolling(symbol);
        }
    }

    unsubscribeFromPrice(socket, symbol) {
        if (this.subscribers.has(symbol)) {
            this.subscribers.get(symbol).delete(socket.id);
            
            // Stop polling if no more subscribers
            if (this.subscribers.get(symbol).size === 0) {
                this.stopPolling(symbol);
            }
        }
    }

    startPolling(symbol) {
        console.log(`🔄 Starting NSE polling for ${symbol}`);
        
        // Poll every 5 seconds (NSE free tier limit)
        const intervalId = setInterval(async () => {
            try {
                await this.fetchNSEPrice(symbol);
            } catch (error) {
                console.error(`❌ Error polling NSE for ${symbol}:`, error.message);
            }
        }, 5000);
        
        this.pollingIntervals.set(symbol, intervalId);
        
        // Fetch immediately
        this.fetchNSEPrice(symbol);
    }

    stopPolling(symbol) {
        if (this.pollingIntervals.has(symbol)) {
            clearInterval(this.pollingIntervals.get(symbol));
            this.pollingIntervals.delete(symbol);
            this.subscribers.delete(symbol);
            console.log(`⏹️ Stopped NSE polling for ${symbol}`);
        }
    }

    async fetchNSEPrice(symbol) {
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
                        priceData = await this.fetchFromNSE(url, cleanSymbol);
                    } else {
                        priceData = await this.fetchFromYahoo(url, symbol);
                    }
                    
                    if (priceData) break;
                } catch (error) {
                    console.log(`⚠️ Failed to fetch from ${url}: ${error.message}`);
                    continue;
                }
            }

            if (priceData) {
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
                
                console.log(`✅ Updated price for ${symbol}: ₹${priceData.price}`);
            }

        } catch (error) {
            console.error(`❌ Error fetching NSE price for ${symbol}:`, error.message);
        }
    }

    async fetchFromNSE(url, symbol) {
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

    async fetchFromYahoo(url, symbol) {
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

    cleanup(socket) {
        // Remove socket from all subscriptions
        this.subscribers.forEach((socketSet, symbol) => {
            socketSet.delete(socket.id);
            
            // Stop polling if no more subscribers
            if (socketSet.size === 0) {
                this.stopPolling(symbol);
            }
        });
    }
}

export default NSEWebSocketService;
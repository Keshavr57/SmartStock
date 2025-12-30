import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

class ChartService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache for real-time feel
    }

    // Get real-time chart data for stocks
    async getStockChart(symbol, period = '1d', interval = '5m') {
        const cacheKey = `${symbol}_${period}_${interval}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // Convert Indian symbols
            const yahooSymbol = this.convertToYahooSymbol(symbol);
            
            const data = await yahooFinance.chart(yahooSymbol, {
                period1: this.getPeriodStart(period),
                period2: Math.floor(Date.now() / 1000),
                interval: interval
            });

            if (!data || !data.quotes || data.quotes.length === 0) {
                return this.getMockChartData(symbol, period);
            }

            const chartData = {
                symbol: symbol,
                name: data.meta?.longName || symbol,
                currentPrice: data.meta?.regularMarketPrice || data.quotes[data.quotes.length - 1]?.close,
                previousClose: data.meta?.previousClose,
                change: 0,
                changePercent: 0,
                high: data.meta?.regularMarketDayHigh,
                low: data.meta?.regularMarketDayLow,
                volume: data.meta?.regularMarketVolume,
                marketCap: data.meta?.marketCap,
                pe: data.meta?.trailingPE,
                candles: data.quotes.map(quote => ({
                    time: quote.date.getTime(),
                    open: quote.open,
                    high: quote.high,
                    low: quote.low,
                    close: quote.close,
                    volume: quote.volume
                })).filter(candle => candle.open && candle.high && candle.low && candle.close),
                indicators: this.calculateTechnicalIndicators(data.quotes)
            };

            // Calculate change
            if (chartData.currentPrice && chartData.previousClose) {
                chartData.change = chartData.currentPrice - chartData.previousClose;
                chartData.changePercent = (chartData.change / chartData.previousClose) * 100;
            }

            this.cache.set(cacheKey, { data: chartData, timestamp: Date.now() });
            return chartData;

        } catch (error) {
            console.error(`Chart data error for ${symbol}:`, error.message);
            return this.getMockChartData(symbol, period);
        }
    }

    // Get crypto chart data
    async getCryptoChart(symbol, period = '1d') {
        const cacheKey = `crypto_${symbol}_${period}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const cryptoMap = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'ADA': 'cardano',
                'DOT': 'polkadot',
                'SOL': 'solana',
                'MATIC': 'polygon',
                'AVAX': 'avalanche-2',
                'LINK': 'chainlink'
            };

            const coinId = cryptoMap[symbol] || symbol.toLowerCase();
            const days = this.getCryptoPeriodDays(period);

            // Get price data
            const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
                params: {
                    vs_currency: 'inr',
                    days: days,
                    interval: days <= 1 ? 'hourly' : 'daily'
                },
                timeout: 10000
            });

            // Get current data
            const currentResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
                timeout: 5000
            });

            const prices = priceResponse.data.prices || [];
            const volumes = priceResponse.data.total_volumes || [];
            const current = currentResponse.data;

            const chartData = {
                symbol: symbol,
                name: current.name || symbol,
                currentPrice: current.market_data?.current_price?.usd || 0,
                previousClose: prices.length > 1 ? prices[prices.length - 2][1] : 0,
                change: 0,
                changePercent: current.market_data?.price_change_percentage_24h || 0,
                high: current.market_data?.high_24h?.usd || 0,
                low: current.market_data?.low_24h?.usd || 0,
                volume: current.market_data?.total_volume?.usd || 0,
                marketCap: current.market_data?.market_cap?.usd || 0,
                candles: prices.map((price, index) => ({
                    time: price[0],
                    close: price[1],
                    volume: volumes[index] ? volumes[index][1] : 0,
                    open: index > 0 ? prices[index - 1][1] : price[1],
                    high: price[1] * 1.02, // Approximate high
                    low: price[1] * 0.98   // Approximate low
                }))
            };

            chartData.change = chartData.currentPrice - chartData.previousClose;

            this.cache.set(cacheKey, { data: chartData, timestamp: Date.now() });
            return chartData;

        } catch (error) {
            console.error(`Crypto chart error for ${symbol}:`, error.message);
            return this.getMockCryptoChart(symbol, period);
        }
    }

    // Calculate technical indicators
    calculateTechnicalIndicators(quotes) {
        if (!quotes || quotes.length < 20) return {};

        const closes = quotes.map(q => q.close).filter(c => c);
        
        return {
            sma20: this.calculateSMA(closes, 20),
            sma50: this.calculateSMA(closes, 50),
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes)
        };
    }

    calculateSMA(prices, period) {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(prices) {
        if (prices.length < 26) return null;
        
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        
        return ema12 - ema26;
    }

    calculateEMA(prices, period) {
        if (prices.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }

    convertToYahooSymbol(symbol) {
        const symbolMap = {
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'INFY': 'INFY.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'SBIN': 'SBIN.NS',
            'LT': 'LT.NS',
            'WIPRO': 'WIPRO.NS',
            'MARUTI': 'MARUTI.NS'
        };
        
        return symbolMap[symbol] || (symbol.includes('.') ? symbol : `${symbol}.NS`);
    }

    getPeriodStart(period) {
        const now = Date.now();
        const periods = {
            '1d': 24 * 60 * 60 * 1000,
            '5d': 5 * 24 * 60 * 60 * 1000,
            '1mo': 30 * 24 * 60 * 60 * 1000,
            '3mo': 90 * 24 * 60 * 60 * 1000,
            '6mo': 180 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000,
            '5y': 5 * 365 * 24 * 60 * 60 * 1000
        };
        
        return Math.floor((now - (periods[period] || periods['1d'])) / 1000);
    }

    getCryptoPeriodDays(period) {
        const periodMap = {
            '1d': 1,
            '5d': 5,
            '1mo': 30,
            '3mo': 90,
            '6mo': 180,
            '1y': 365,
            '5y': 1825
        };
        
        return periodMap[period] || 1;
    }

    // Mock data for when APIs fail
    getMockChartData(symbol, period) {
        const basePrice = this.getBasePriceForSymbol(symbol);
        const candles = this.generateMockCandles(basePrice, period);
        
        return {
            symbol: symbol,
            name: this.getCompanyName(symbol),
            currentPrice: candles[candles.length - 1].close,
            previousClose: candles[0].close,
            change: candles[candles.length - 1].close - candles[0].close,
            changePercent: ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100,
            high: Math.max(...candles.map(c => c.high)),
            low: Math.min(...candles.map(c => c.low)),
            volume: candles.reduce((sum, c) => sum + c.volume, 0),
            marketCap: basePrice * 1000000000, // Mock market cap
            pe: 15 + Math.random() * 20,
            candles: candles,
            indicators: {
                sma20: basePrice * (0.98 + Math.random() * 0.04),
                sma50: basePrice * (0.96 + Math.random() * 0.08),
                rsi: 30 + Math.random() * 40,
                macd: -5 + Math.random() * 10
            }
        };
    }

    getMockCryptoChart(symbol, period) {
        const basePrice = this.getBaseCryptoPriceForSymbol(symbol);
        const candles = this.generateMockCandles(basePrice, period, true);
        
        return {
            symbol: symbol,
            name: this.getCryptoName(symbol),
            currentPrice: candles[candles.length - 1].close,
            previousClose: candles[0].close,
            change: candles[candles.length - 1].close - candles[0].close,
            changePercent: ((candles[candles.length - 1].close - candles[0].close) / candles[0].close) * 100,
            high: Math.max(...candles.map(c => c.high)),
            low: Math.min(...candles.map(c => c.low)),
            volume: candles.reduce((sum, c) => sum + c.volume, 0),
            marketCap: basePrice * 21000000, // Mock market cap
            candles: candles
        };
    }

    generateMockCandles(basePrice, period, isCrypto = false) {
        const intervals = this.getIntervalsForPeriod(period);
        const candles = [];
        let currentPrice = basePrice;
        const now = Date.now();
        
        for (let i = 0; i < intervals; i++) {
            const time = now - (intervals - i) * this.getIntervalMs(period);
            
            // Generate realistic price movement
            const volatility = isCrypto ? 0.05 : 0.02; // Crypto is more volatile
            const change = (Math.random() - 0.5) * volatility;
            const open = currentPrice;
            const close = currentPrice * (1 + change);
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = Math.floor(Math.random() * 1000000) + 100000;
            
            candles.push({
                time: time,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: volume
            });
            
            currentPrice = close;
        }
        
        return candles;
    }

    getIntervalsForPeriod(period) {
        const intervalMap = {
            '1d': 78,    // 5-minute intervals in a day
            '5d': 390,   // 5-minute intervals in 5 days
            '1mo': 120,  // 6-hour intervals in a month
            '3mo': 90,   // Daily intervals in 3 months
            '6mo': 180,  // Daily intervals in 6 months
            '1y': 365,   // Daily intervals in a year
            '5y': 260    // Weekly intervals in 5 years
        };
        
        return intervalMap[period] || 78;
    }

    getIntervalMs(period) {
        const intervalMap = {
            '1d': 5 * 60 * 1000,        // 5 minutes
            '5d': 5 * 60 * 1000,        // 5 minutes
            '1mo': 6 * 60 * 60 * 1000,  // 6 hours
            '3mo': 24 * 60 * 60 * 1000, // 1 day
            '6mo': 24 * 60 * 60 * 1000, // 1 day
            '1y': 24 * 60 * 60 * 1000,  // 1 day
            '5y': 7 * 24 * 60 * 60 * 1000 // 1 week
        };
        
        return intervalMap[period] || 5 * 60 * 1000;
    }

    getBasePriceForSymbol(symbol) {
        const prices = {
            'RELIANCE': 2850,
            'TCS': 3280,
            'HDFCBANK': 1742,
            'INFY': 1845,
            'ICICIBANK': 1285,
            'BHARTIARTL': 1598,
            'SBIN': 825,
            'LT': 3650,
            'WIPRO': 445,
            'MARUTI': 12500,
            'AAPL': 195,
            'GOOGL': 142,
            'MSFT': 415,
            'TSLA': 248
        };
        
        return prices[symbol] || 1000;
    }

    getBaseCryptoPriceForSymbol(symbol) {
        const prices = {
            'BTC': 97500,
            'ETH': 3420,
            'ADA': 0.89,
            'DOT': 7.2,
            'SOL': 185,
            'MATIC': 0.42,
            'AVAX': 38.5,
            'LINK': 22.8
        };
        
        return prices[symbol] || 100;
    }

    getCompanyName(symbol) {
        const names = {
            'RELIANCE': 'Reliance Industries Ltd.',
            'TCS': 'Tata Consultancy Services Ltd.',
            'HDFCBANK': 'HDFC Bank Ltd.',
            'INFY': 'Infosys Ltd.',
            'ICICIBANK': 'ICICI Bank Ltd.',
            'BHARTIARTL': 'Bharti Airtel Ltd.',
            'SBIN': 'State Bank of India',
            'LT': 'Larsen & Toubro Ltd.',
            'WIPRO': 'Wipro Ltd.',
            'MARUTI': 'Maruti Suzuki India Ltd.',
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla Inc.'
        };
        
        return names[symbol] || symbol;
    }

    getCryptoName(symbol) {
        const names = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'ADA': 'Cardano',
            'DOT': 'Polkadot',
            'SOL': 'Solana',
            'MATIC': 'Polygon',
            'AVAX': 'Avalanche',
            'LINK': 'Chainlink'
        };
        
        return names[symbol] || symbol;
    }

    // Get watchlist data
    async getWatchlistData(symbols) {
        const watchlistData = await Promise.all(
            symbols.map(async (symbolData) => {
                try {
                    const chartData = symbolData.type === 'crypto' 
                        ? await this.getCryptoChart(symbolData.symbol, '1d')
                        : await this.getStockChart(symbolData.symbol, '1d');
                    
                    return {
                        symbol: symbolData.symbol,
                        name: chartData.name,
                        type: symbolData.type,
                        currentPrice: chartData.currentPrice,
                        change: chartData.change,
                        changePercent: chartData.changePercent,
                        high: chartData.high,
                        low: chartData.low,
                        volume: chartData.volume
                    };
                } catch (error) {
                    console.error(`Watchlist error for ${symbolData.symbol}:`, error.message);
                    return null;
                }
            })
        );
        
        return watchlistData.filter(item => item !== null);
    }
}

export default new ChartService();
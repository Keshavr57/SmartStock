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
                return { symbol, error: 'No data available' };
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
            return { symbol, error: 'Chart data unavailable' };
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
            return { symbol, error: 'Crypto chart data unavailable' };
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
                    return null;
                }
            })
        );
        
        return watchlistData.filter(item => item !== null);
    }
}

export default new ChartService();
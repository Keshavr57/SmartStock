import axios from 'axios';

// Simple config and cache - no class
const cache = {};
const config = {
    cacheTimeout: 2 * 60 * 1000 // 2 minutes cache
};

// Get stock chart data
async function getStockChart(symbol, period = '1d', interval = '5m') {
    const cacheKey = `${symbol}_${period}_${interval}`;
    const cached = cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < config.cacheTimeout) {
        return cached.data;
    }

    try {
        console.log(`📈 Fetching chart data for ${symbol} (${period})`);
        
        const yahooSymbol = convertToYahooSymbol(symbol);
        let chartData = await getYahooChartData(yahooSymbol, period, interval);
        
        if (chartData && chartData.candles && chartData.candles.length > 0) {
            chartData.indicators = calculateTechnicalIndicators(chartData.candles);
            cache[cacheKey] = { data: chartData, timestamp: Date.now() };
            console.log(`✅ Chart data ready for ${symbol}: ${chartData.candles.length} candles`);
            return chartData;
        }
        
        return { symbol, error: 'Chart data unavailable' };

    } catch (error) {
        console.error(`Chart error for ${symbol}:`, error.message);
        return { symbol, error: 'Chart data unavailable' };
    }
}

// Get Yahoo Finance chart data
async function getYahooChartData(yahooSymbol, period, interval) {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
            params: {
                interval: interval,
                range: period
            },
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://finance.yahoo.com/'
            }
        });

        const result = response.data?.chart?.result?.[0];
        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
            return null;
        }

        const meta = result.meta;
        const quotes = result.indicators.quote[0];
        
        const candles = result.timestamp.map((time, index) => ({
            time: time * 1000,
            open: quotes.open[index],
            high: quotes.high[index],
            low: quotes.low[index],
            close: quotes.close[index],
            volume: quotes.volume[index]
        })).filter(candle => candle.open && candle.high && candle.low && candle.close);

        const currentPrice = meta.regularMarketPrice || candles[candles.length - 1]?.close;
        // previousClose is only present for 1d ranges; otherwise use the close before the range start.
        const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? null;
        const change = previousClose ? currentPrice - previousClose : null;
        const changePercent = previousClose ? (change / previousClose) * 100 : null;

        return {
            symbol: yahooSymbol,
            name: meta.longName || yahooSymbol,
            currentPrice,
            previousClose,
            change,
            changePercent,
            high: meta.regularMarketDayHigh,
            low: meta.regularMarketDayLow,
            volume: meta.regularMarketVolume,
            marketCap: meta.marketCap,
            pe: meta.trailingPE,
            candles
        };
    } catch (error) {
        console.log(`Yahoo Finance chart error for ${yahooSymbol}:`, error.message);
        return null;
    }
}

// Calculate technical indicators
function calculateTechnicalIndicators(candles) {
    if (!candles || candles.length < 20) return {};

    const closes = candles.map(item => item.close).filter(c => c !== null && c > 0);
    
    if (closes.length < 20) return {};
    
    return {
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        rsi: calculateRSI(closes, 14),
        macd: calculateMACD(closes),
        bollinger: calculateBollingerBands(closes, 20),
        support: calculateSupport(closes),
        resistance: calculateResistance(closes)
    };
}

function calculateBollingerBands(prices, period = 20) {
    if (prices.length < period) return null;
    
    const sma = calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
        upper: sma + (2 * stdDev),
        middle: sma,
        lower: sma - (2 * stdDev)
    };
}

function calculateSupport(prices) {
    if (prices.length < 10) return null;
    
    const recentPrices = prices.slice(-50);
    const lows = [];
    
    for (let i = 2; i < recentPrices.length - 2; i++) {
        if (recentPrices[i] < recentPrices[i-1] && 
            recentPrices[i] < recentPrices[i+1] &&
            recentPrices[i] < recentPrices[i-2] && 
            recentPrices[i] < recentPrices[i+2]) {
            lows.push(recentPrices[i]);
        }
    }
    
    return lows.length > 0 ? Math.max(...lows) : Math.min(...recentPrices);
}

function calculateResistance(prices) {
    if (prices.length < 10) return null;
    
    const recentPrices = prices.slice(-50);
    const highs = [];
    
    for (let i = 2; i < recentPrices.length - 2; i++) {
        if (recentPrices[i] > recentPrices[i-1] && 
            recentPrices[i] > recentPrices[i+1] &&
            recentPrices[i] > recentPrices[i-2] && 
            recentPrices[i] > recentPrices[i+2]) {
            highs.push(recentPrices[i]);
        }
    }
    
    return highs.length > 0 ? Math.min(...highs) : Math.max(...recentPrices);
}

function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateRSI(prices, period = 14) {
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

function calculateMACD(prices) {
    if (prices.length < 26) return null;
    
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    
    return ema12 - ema26;
}

function calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
}

function convertToYahooSymbol(symbol) {
    const symbolMap = {
        'RELIANCE': 'RELIANCE.NS', 'TCS': 'TCS.NS', 'HDFCBANK': 'HDFCBANK.NS',
        'INFY': 'INFY.NS', 'ICICIBANK': 'ICICIBANK.NS', 'BHARTIARTL': 'BHARTIARTL.NS',
        'SBIN': 'SBIN.NS', 'LT': 'LT.NS', 'WIPRO': 'WIPRO.NS', 'MARUTI': 'MARUTI.NS'
    };
    
    if (symbolMap[symbol]) return symbolMap[symbol];
    // Indices (^NSEI), crypto pairs (BTC-USD) and already-suffixed symbols pass through unchanged.
    if (symbol.startsWith('^') || symbol.includes('.') || symbol.includes('-')) return symbol;
    return `${symbol}.NS`;
}

// Get watchlist data
async function getWatchlistData(symbols) {
    const watchlistData = await Promise.all(
        symbols.map(async (symbolData) => {
            try {
                const chartData = await getStockChart(symbolData.symbol, '1d');
                
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

// Export simple object with functions
export default {
    getStockChart,
    getWatchlistData
};

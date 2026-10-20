import axios from 'axios';
import comprehensiveStockService from './stock.service.js';

// Live price lookup used for order execution and quotes.
// Never fabricates a price: returns null when no real source answers.

const CACHE_TTL_MS = 15 * 1000;
const cache = new Map();

const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100);

export function normalizeSymbol(raw) {
    const symbol = String(raw).trim().toUpperCase();
    if (symbol.startsWith('^') || symbol.includes('.') || symbol.includes('-')) return symbol;
    return `${symbol}.NS`;
}

async function fetchYahooQuote(symbol) {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
        params: { range: '1d', interval: '1d' },
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const meta = response.data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice || meta.regularMarketPrice <= 0) return null;

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
    const change = previousClose ? round2(price - previousClose) : null;
    return {
        symbol,
        name: meta.longName || meta.shortName || symbol.replace(/\.(NS|BO)$/, ''),
        price,
        previousClose,
        change,
        changePercent: previousClose ? round2(((price - previousClose) / previousClose) * 100) : null,
        dayHigh: meta.regularMarketDayHigh ?? null,
        dayLow: meta.regularMarketDayLow ?? null,
        volume: meta.regularMarketVolume ?? null,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
        asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
        source: 'yahoo'
    };
}

async function fetchFromComprehensiveService(symbol) {
    const data = await comprehensiveStockService.getComprehensiveStockData(symbol);
    const price = data?.lastTradedPrice;
    if (!price || price <= 0) return null;
    return {
        symbol,
        name: data.name || symbol.replace(/\.(NS|BO)$/, ''),
        price,
        previousClose: data.previousClose ?? null,
        change: round2(data.oneDayChange),
        changePercent: round2(data.oneDayChangePercent),
        dayHigh: data.dayHigh ?? null,
        dayLow: data.dayLow ?? null,
        volume: data.volume ?? null,
        fiftyTwoWeekHigh: data.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: data.fiftyTwoWeekLow ?? null,
        asOf: new Date().toISOString(),
        source: 'nse'
    };
}

export async function getLivePrice(rawSymbol) {
    const symbol = normalizeSymbol(rawSymbol);
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.quote;

    let quote = null;
    try {
        quote = await fetchYahooQuote(symbol);
    } catch (error) {
        console.warn(`Yahoo quote failed for ${symbol}: ${error.message}`);
    }
    if (!quote) {
        try {
            quote = await fetchFromComprehensiveService(symbol);
        } catch (error) {
            console.warn(`Fallback quote failed for ${symbol}: ${error.message}`);
        }
    }

    if (quote) cache.set(symbol, { quote, at: Date.now() });
    return quote;
}

export default { getLivePrice, normalizeSymbol };

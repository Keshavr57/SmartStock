import axios from 'axios';
import StockFundamentals from '../../models/StockFundamentals.js';
import { normalizeSymbol } from './price.service.js';

// Company fundamentals for any NSE/BSE stock.
// Primary source: Yahoo Finance quoteSummary (needs a cookie + crumb session since 2023).
// Gap filler: our seeded StockFundamentals collection (ROCE, promoter/FII holding that Yahoo lacks).
// Every value is real or null; nothing is estimated.

// Yahoo answers 429 to some browser UA strings from non-browser clients; this one is accepted.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SESSION_TTL_MS = 30 * 60 * 1000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MODULES = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,majorHoldersBreakdown';

let session = null; // { cookie, crumb, at }
const cache = new Map();

async function getSession(forceRefresh = false) {
    if (!forceRefresh && session && Date.now() - session.at < SESSION_TTL_MS) return session;
    // fc.yahoo.com answers 404 but sets the consent cookie the crumb endpoint needs.
    const cookieRes = await axios.get('https://fc.yahoo.com', {
        headers: { 'User-Agent': UA }, timeout: 8000, validateStatus: () => true, maxRedirects: 0
    });
    const cookie = (cookieRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    if (!cookie) throw new Error('Yahoo did not issue a session cookie');
    const crumbRes = await axios.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: { 'User-Agent': UA, Cookie: cookie }, timeout: 8000
    });
    if (typeof crumbRes.data !== 'string' || !crumbRes.data) throw new Error('Yahoo did not issue a crumb');
    session = { cookie, crumb: crumbRes.data, at: Date.now() };
    return session;
}

async function yahooGet(url, params) {
    for (let attempt = 0; attempt < 2; attempt++) {
        const s = await getSession(attempt > 0);
        try {
            const res = await axios.get(url, {
                params: { ...params, crumb: s.crumb },
                headers: { 'User-Agent': UA, Cookie: s.cookie },
                timeout: 12000
            });
            return res.data;
        } catch (error) {
            // An expired crumb returns 401; refresh the session once and retry.
            if (error.response?.status === 401 && attempt === 0) continue;
            throw error;
        }
    }
}

// Yahoo wraps numbers as { raw, fmt }.
const raw = (v) => (v && typeof v === 'object' ? (v.raw ?? null) : (v ?? null));
const pct = (v) => (raw(v) == null ? null : round(raw(v) * 100));
const round = (n, d = 2) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);

async function fetchAnnualBalanceSheet(symbol) {
    const now = Math.floor(Date.now() / 1000);
    const data = await yahooGet(
        `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}`,
        {
            type: 'annualTotalAssets,annualTotalLiabilitiesNetMinorityInterest,annualStockholdersEquity',
            period1: now - 5 * 365 * 86400,
            period2: now
        }
    ).catch(() => null);
    const latest = (type) => {
        const series = data?.timeseries?.result?.find(r => r.meta?.type?.[0] === type)?.[type];
        const last = series?.filter(Boolean).at(-1);
        return last?.reportedValue?.raw ?? null;
    };
    return {
        totalAssets: latest('annualTotalAssets'),
        totalLiabilities: latest('annualTotalLiabilitiesNetMinorityInterest'),
        shareholdersEquity: latest('annualStockholdersEquity')
    };
}

// Daily closes for return / moving-average / RSI calculations.
async function fetchDailyCloses(symbol) {
    const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
        params: { range: '5y', interval: '1d' },
        headers: { 'User-Agent': UA },
        timeout: 12000
    });
    const result = res.data?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    return (result?.timestamp || [])
        .map((t, i) => ({ time: t * 1000, close: closes[i] }))
        .filter(p => p.close != null);
}

function trailingReturn(series, days) {
    if (series.length < 2) return null;
    const last = series.at(-1);
    const target = last.time - days * 86400 * 1000;
    if (series[0].time > target + 7 * 86400 * 1000) return null; // not enough history (e.g. recent listing)
    const base = [...series].reverse().find(p => p.time <= target) || series[0];
    return round(((last.close - base.close) / base.close) * 100);
}

// Wilder's 14-day RSI.
function rsi(closes, period = 14) {
    if (closes.length <= period) return null;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i <= period; i++) {
        const d = closes[i] - closes[i - 1];
        if (d >= 0) gain += d; else loss -= d;
    }
    let avgGain = gain / period;
    let avgLoss = loss / period;
    for (let i = period + 1; i < closes.length; i++) {
        const d = closes[i] - closes[i - 1];
        avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    }
    if (avgLoss === 0) return 100;
    return round(100 - 100 / (1 + avgGain / avgLoss));
}

async function fetchSeeded(symbol) {
    const clean = symbol.replace(/\.(NS|BO)$/, '');
    return StockFundamentals.findOne({ $or: [{ nsSymbol: symbol }, { symbol: clean.replace(/[-&]/g, '') }] })
        .lean()
        .catch(() => null);
}

export async function getFundamentals(rawSymbol) {
    const symbol = normalizeSymbol(rawSymbol);
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

    const [summaryRes, balanceRes, historyRes, seededRes] = await Promise.allSettled([
        yahooGet(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}`, { modules: MODULES }),
        fetchAnnualBalanceSheet(symbol),
        fetchDailyCloses(symbol),
        fetchSeeded(symbol)
    ]);

    const r = summaryRes.status === 'fulfilled' ? summaryRes.value?.quoteSummary?.result?.[0] : null;
    if (summaryRes.status === 'rejected') console.warn(`Yahoo fundamentals failed for ${symbol}: ${summaryRes.reason?.message}`);
    const price = r?.price || {};
    const sd = r?.summaryDetail || {};
    const ks = r?.defaultKeyStatistics || {};
    const fd = r?.financialData || {};
    const ap = r?.assetProfile || {};
    const mh = r?.majorHoldersBreakdown || {};
    const bs = balanceRes.status === 'fulfilled' ? balanceRes.value : {};
    const history = historyRes.status === 'fulfilled' ? historyRes.value : [];
    const seeded = seededRes.status === 'fulfilled' ? seededRes.value : null;
    const closes = history.map(p => p.close);

    const sma = (n) => (closes.length >= n ? round(closes.slice(-n).reduce((a, b) => a + b, 0) / n) : null);
    const highLow = (days) => {
        const from = Date.now() - days * 86400 * 1000;
        const window = history.filter(p => p.time >= from).map(p => p.close);
        return window.length ? { high: round(Math.max(...window)), low: round(Math.min(...window)) } : { high: null, low: null };
    };
    const totalDebt = raw(fd.totalDebt);
    const equity = bs.shareholdersEquity;

    const data = {
        symbol,
        name: price.longName || price.shortName || seeded?.name || symbol.replace(/\.(NS|BO)$/, ''),
        sector: ap.sector || seeded?.sector || null,
        industry: ap.industry || seeded?.industry || null,
        description: ap.longBusinessSummary || null,
        website: ap.website || null,
        employees: ap.fullTimeEmployees ?? null,

        // Valuation
        marketCap: raw(price.marketCap) ?? raw(sd.marketCap),
        peRatio: round(raw(sd.trailingPE)) ?? seeded?.peRatio ?? null,
        forwardPE: round(raw(sd.forwardPE) ?? raw(ks.forwardPE)),
        pbRatio: round(raw(ks.priceToBook)) ?? seeded?.pbRatio ?? null,
        pegRatio: round(raw(ks.pegRatio)),
        evToEbitda: round(raw(ks.enterpriseToEbitda)),
        priceToSales: round(raw(sd.priceToSalesTrailing12Months)),
        eps: round(raw(ks.trailingEps)) ?? seeded?.eps ?? null,
        bookValue: round(raw(ks.bookValue)) ?? seeded?.bookValue ?? null,
        dividendYield: pct(sd.dividendYield) ?? seeded?.dividendYield ?? null,
        beta: round(raw(sd.beta) ?? raw(ks.beta)) ?? seeded?.beta ?? null,

        // Profitability (percent)
        roe: pct(fd.returnOnEquity) ?? seeded?.roe ?? null,
        roa: pct(fd.returnOnAssets),
        roce: seeded?.roce ?? null,
        profitMargin: pct(fd.profitMargins) ?? seeded?.profitMargin ?? null,
        operatingMargin: pct(fd.operatingMargins) ?? seeded?.operatingMargin ?? null,
        grossMargin: pct(fd.grossMargins) ?? seeded?.grossMargin ?? null,
        ebitdaMargin: pct(fd.ebitdaMargins),

        // Growth (percent, year over year)
        revenueGrowth: pct(fd.revenueGrowth) ?? seeded?.revenueGrowth ?? null,
        earningsGrowth: pct(fd.earningsGrowth) ?? seeded?.earningsGrowth ?? null,

        // Financials (₹)
        revenue: raw(fd.totalRevenue),
        ebitda: raw(fd.ebitda),
        netIncome: raw(ks.netIncomeToCommon),
        totalAssets: bs.totalAssets,
        totalLiabilities: bs.totalLiabilities,
        totalDebt,
        totalCash: raw(fd.totalCash),
        freeCashFlow: raw(fd.freeCashflow),
        operatingCashFlow: raw(fd.operatingCashflow),
        // Yahoo reports D/E as a percentage; prefer debt ÷ equity when both are known.
        debtToEquity: totalDebt != null && equity
            ? round(totalDebt / equity)
            : (raw(fd.debtToEquity) != null ? round(raw(fd.debtToEquity) / 100) : (seeded?.debtToEquity ?? null)),
        currentRatio: round(raw(fd.currentRatio)) ?? seeded?.currentRatio ?? null,

        // Ownership (percent)
        promoterHolding: seeded?.promoterHolding ?? pct(mh.insidersPercentHeld),
        institutionalHolding: pct(mh.institutionsPercentHeld),
        fiiHolding: seeded?.fiiHolding ?? null,

        // Analyst consensus
        recommendation: fd.recommendationKey && fd.recommendationKey !== 'none' ? fd.recommendationKey : null,
        targetMeanPrice: round(raw(fd.targetMeanPrice)),
        analystCount: raw(fd.numberOfAnalystOpinions),

        // Returns (percent) and technicals from real daily closes
        oneMonthReturn: trailingReturn(history, 30),
        threeMonthReturn: trailingReturn(history, 91),
        sixMonthReturn: trailingReturn(history, 182),
        oneYearReturn: trailingReturn(history, 365),
        threeYearReturn: trailingReturn(history, 3 * 365),
        fiveYearReturn: trailingReturn(history, 5 * 365 - 7),
        threeMonthHigh: highLow(91).high,
        threeMonthLow: highLow(91).low,
        fiftyDMA: sma(50),
        twoHundredDMA: sma(200),
        rsi: rsi(closes.slice(-250)),

        sources: [r && 'yahoo', seeded && 'smartstock-db'].filter(Boolean),
        asOf: new Date().toISOString()
    };

    // Only cache when the primary source answered, so a transient Yahoo failure is retried soon.
    if (r) cache.set(symbol, { data, at: Date.now() });
    return data;
}

export default { getFundamentals };

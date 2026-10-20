import axios from 'axios';
import { istDateKey } from '../../utils/marketHours.js';

// Event study on headlines (market-adjusted model, the standard short-window approach in finance research):
//   AR₁   = R_stock(t) − R_NIFTY(t)                        abnormal return on the reaction day t
//   CAR₃  = Σ_{k=0..2} [R_stock(t+k) − R_NIFTY(t+k)]       cumulative abnormal return over 3 trading days
//   ARₙₑₓₜ = abnormal return on t+1 only — the out-of-sample "prediction" window, since a headline published
//           during session t may simply be reporting that session's move (look-ahead bias).
// t is the first trading session that could react: the publish day if published before the 15:30 IST close,
// otherwise the next trading day. Market-wide news (no linked company) uses the raw NIFTY 50 return.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MARKET = '^NSEI';
const SERIES_TTL_MS = 6 * 60 * 60 * 1000;
const CLOSE_MINUTES_IST = 15 * 60 + 30;
const seriesCache = new Map();

// Daily closes keyed by IST date, oldest first.
export async function getDailySeries(symbol) {
    const cached = seriesCache.get(symbol);
    if (cached && Date.now() - cached.at < SERIES_TTL_MS) return cached.series;
    const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`, {
        params: { range: '1y', interval: '1d' },
        headers: { 'User-Agent': UA },
        timeout: 10000
    });
    const result = res.data?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const series = (result?.timestamp || [])
        .map((t, i) => ({ dateKey: istDateKey(new Date(t * 1000)), close: closes[i] }))
        .filter(p => p.close != null);
    seriesCache.set(symbol, { at: Date.now(), series });
    return series;
}

function istMinutes(date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date);
    return Number(parts.find(p => p.type === 'hour').value) * 60 + Number(parts.find(p => p.type === 'minute').value);
}

// Index of the reaction session in `series`, or -1 if it has not happened yet.
export function reactionIndex(series, publishedAt) {
    const publishKey = istDateKey(publishedAt);
    const afterClose = istMinutes(publishedAt) >= CLOSE_MINUTES_IST;
    return series.findIndex(p => (afterClose ? p.dateKey > publishKey : p.dateKey >= publishKey));
}

const pctReturn = (from, to) => (to / from - 1) * 100;
const round = (n) => Math.round(n * 100) / 100;

/**
 * Measured reaction of `symbol` (or the market when symbol is null) to news published at `publishedAt`.
 * Returns { status: 'pending' } until enough sessions have traded, or { status: 'done', ar1, car3, reactionDate }.
 */
export async function measureReaction(symbol, publishedAt) {
    const market = await getDailySeries(MARKET);
    const stock = symbol ? await getDailySeries(symbol) : null;

    const base = stock || market;
    const r = reactionIndex(base, publishedAt);
    if (r <= 0) return { status: r === 0 ? 'unavailable' : 'pending' }; // need the prior close as the base
    if (r + 2 >= base.length) return { status: 'pending' };

    const marketByDate = new Map(market.map(p => [p.dateKey, p.close]));
    const dailyAbnormal = [];
    for (let k = 0; k < 3; k++) {
        const prev = base[r + k - 1];
        const cur = base[r + k];
        const stockRet = pctReturn(prev.close, cur.close);
        if (!stock) {
            dailyAbnormal.push(stockRet);
            continue;
        }
        const mPrev = marketByDate.get(prev.dateKey);
        const mCur = marketByDate.get(cur.dateKey);
        if (mPrev == null || mCur == null) return { status: 'unavailable' };
        dailyAbnormal.push(stockRet - pctReturn(mPrev, mCur));
    }
    return {
        status: 'done',
        ar1: round(dailyAbnormal[0]),
        arNext: round(dailyAbnormal[1]),
        car3: round(dailyAbnormal.reduce((a, b) => a + b, 0)),
        reactionDate: base[r].dateKey
    };
}

/**
 * Aggregate statistics for one group of measured articles.
 * hitRate: share of articles whose realised AR₁ sign matched the predicted direction (neutral predictions excluded).
 * tStat: mean / (sd / √n) — |t| ≥ 2 means the average move is unlikely to be noise.
 */
export function summarize(rows, field = 'ar1') {
    const ar = rows.map(r => r[field]).filter(x => x != null);
    rows = rows.filter(r => r[field] != null);
    const n = ar.length;
    if (n === 0) return null;
    const mean = ar.reduce((a, b) => a + b, 0) / n;
    const sd = n > 1 ? Math.sqrt(ar.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
    const sorted = [...ar].sort((a, b) => a - b);
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const directional = rows.filter(r => r.predicted !== 0 && r[field] !== 0);
    const hits = directional.filter(r => Math.sign(r[field]) === r.predicted).length;
    return {
        n,
        meanAr1: round(mean),
        medianAr1: round(median),
        meanAbsAr1: round(ar.reduce((a, b) => a + Math.abs(b), 0) / n),
        meanCar3: round(rows.reduce((a, r) => a + (r.car3 ?? 0), 0) / n),
        meanArNext: rows.some(r => r.arNext != null)
            ? round(rows.reduce((a, r) => a + (r.arNext ?? 0), 0) / rows.filter(r => r.arNext != null).length)
            : null,
        sdAr1: round(sd),
        tStat: sd > 0 ? round(mean / (sd / Math.sqrt(n))) : null,
        hitRate: directional.length ? round((hits / directional.length) * 100) : null,
        upShare: round((ar.filter(x => x > 0).length / n) * 100)
    };
}

export default { measureReaction, summarize, getDailySeries, reactionIndex };

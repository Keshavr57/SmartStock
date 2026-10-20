import axios from 'axios';
import mongoose from 'mongoose';
import { istDateKey } from '../../utils/marketHours.js';

// IPO board built only from NSE's official public APIs (plus Yahoo for post-listing prices).
// Shows: open issues, upcoming issues, and issues that closed within the last CLOSED_WINDOW_DAYS.

const NSE_API = 'https://www.nseindia.com/api';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CLOSED_WINDOW_DAYS = 30;
const BOARD_TTL_MS = 10 * 60 * 1000;
const EQUITY_TYPES = new Set(['EQ', 'BE', 'SME']); // public-past-issues also lists bonds/debt (DEBT, N*, Y*...)
const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

let boardCache = { at: 0, board: null };
const detailCache = new Map(); // symbol -> { at, ttl, detail }

async function nseGet(path) {
    const res = await axios.get(`${NSE_API}${path}`, {
        timeout: 15000,
        headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo' }
    });
    return res.data;
}

// NSE dates look like "19-Oct-2026" or "16-OCT-2026"; returns the IST calendar day as YYYY-MM-DD.
export function parseNseDate(value) {
    const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(value || '').trim());
    if (!m) return null;
    const month = MONTHS[m[2].toUpperCase()];
    if (month === undefined) return null;
    return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// "Rs.665 to Rs.700" -> { min: 665, max: 700 }; "Rs.1000" -> { min: 1000, max: 1000 }
export function parsePriceBand(value) {
    const nums = String(value || '').replace(/,/g, '').match(/\d+(\.\d+)?/g)?.map(Number) || [];
    if (nums.length === 0) return null;
    return { min: Math.min(...nums), max: Math.max(...nums) };
}

const toNumber = (v) => {
    const n = Number(String(v ?? '').replace(/,/g, '').trim());
    return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null;
};
const round = (n, d = 2) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);
const addDays = (dateKey, days) => {
    const d = new Date(`${dateKey}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

export function statusFor(openDate, closeDate, todayKey) {
    if (openDate && openDate > todayKey) return 'upcoming';
    if (closeDate && closeDate < todayKey) return 'closed';
    return 'open';
}

// Subscription-based demand reading. QIB demand is the strongest institutional signal.
export function demandSignal(subscription) {
    const total = subscription?.total;
    if (total == null || total === 0) return null;
    const qib = subscription.qib ?? 0;
    if (total < 1) return { level: 'Undersubscribed', tone: 'negative' };
    if (total >= 50 || qib >= 75) return { level: 'Very strong', tone: 'positive' };
    if (total >= 10 || qib >= 20) return { level: 'Strong', tone: 'positive' };
    if (total >= 3) return { level: 'Moderate', tone: 'neutral' };
    return { level: 'Weak', tone: 'negative' };
}

function parseSubscription(activeCat) {
    const rows = activeCat?.dataList || [];
    const find = (pred) => toNumber(rows.find(pred)?.noOfTotalMeant);
    const sub = {
        qib: find(r => r.srNo === '1'),
        nii: find(r => r.srNo === '2'),
        retail: find(r => r.srNo === '3'),
        employee: find(r => r.srNo === '4'),
        total: find(r => r.category === 'Total')
    };
    for (const k of Object.keys(sub)) sub[k] = round(sub[k]);
    sub.updatedAt = activeCat?.updateTime?.replace(/^Updated as on\s*/i, '') || null;
    sub.sharesOffered = toNumber(rows.find(r => r.category === 'Total')?.noOfShareOffered) || null;
    // NSE reports 0.00 before bidding opens and for SME issues it does not publish; treat as unknown, not "0x".
    return sub.total ? sub : null;
}

function parseIssueInfo(dataList = []) {
    const get = (title) => dataList.find(x => (x.title || '').trim().toLowerCase().startsWith(title.toLowerCase()))?.value?.replace(/^"|"$/g, '').trim() || null;
    const bidLot = get('Bid Lot') || get('Lot Size'); // mainboard vs SME wording
    const issueSizeText = get('Issue Size');
    const sharesInText = issueSizeText?.match(/([\d,]{6,})\s*(?:equity\s*)?shares/i)?.[1];
    return {
        lotSize: bidLot ? toNumber(bidLot.match(/[\d,]+/)?.[0]) : null,
        sharesFromText: sharesInText ? toNumber(sharesInText) : null,
        faceValue: get('Face Value'),
        issueType: get('Issue Type'),
        issueSizeText,
        leadManagers: get('Book Running Lead Managers'),
        registrar: get('Name of the Registrar'),
        rhpUrl: get('Red Herring Prospectus') || get('Prospectus'),
        employeeDiscount: get('Discount')
    };
}

async function getIpoDetail(symbol, series, status) {
    const key = `${symbol}:${series}`;
    const cached = detailCache.get(key);
    if (cached && Date.now() - cached.at < cached.ttl) return cached.detail;
    try {
        const data = await nseGet(`/ipo-detail?symbol=${encodeURIComponent(symbol)}&series=${encodeURIComponent(series)}`);
        const detail = { ...parseIssueInfo(data?.issueInfo?.dataList), subscription: parseSubscription(data?.activeCat) };
        // Live issues change through the day; closed ones are final.
        const ttl = status === 'open' ? 10 * 60 * 1000 : status === 'upcoming' ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        detailCache.set(key, { at: Date.now(), ttl, detail });
        return detail;
    } catch (error) {
        console.warn(`NSE IPO detail failed for ${symbol}: ${error.message}`);
        return cached?.detail || null;
    }
}

// Listing-day open and latest price for an IPO that has listed.
async function getListingPerformance(symbol, issuePrice, listingDate) {
    if (!issuePrice || !listingDate) return null;
    try {
        const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS`, {
            params: { range: '3mo', interval: '1d' },
            headers: { 'User-Agent': UA },
            timeout: 8000
        });
        const result = res.data?.chart?.result?.[0];
        const quote = result?.indicators?.quote?.[0];
        const times = result?.timestamp || [];
        const idx = times.findIndex(t => istDateKey(new Date(t * 1000)) >= listingDate);
        if (idx < 0) return null;
        const listingOpen = quote.open[idx];
        const current = result.meta?.regularMarketPrice;
        if (!listingOpen || !current) return null;
        return {
            listingOpen: round(listingOpen),
            listingGainPercent: round(((listingOpen - issuePrice) / issuePrice) * 100),
            currentPrice: round(current),
            currentReturnPercent: round(((current - issuePrice) / issuePrice) * 100)
        };
    } catch {
        return null;
    }
}

async function buildBoard() {
    const todayKey = istDateKey(new Date());
    const closedSince = addDays(todayKey, -CLOSED_WINDOW_DAYS);

    const [currentRes, upcomingRes, pastRes] = await Promise.allSettled([
        nseGet('/ipo-current-issue'),
        nseGet('/all-upcoming-issues?category=ipo'),
        nseGet('/public-past-issues')
    ]);
    if ([currentRes, upcomingRes, pastRes].every(r => r.status === 'rejected')) {
        throw new Error(`NSE IPO APIs unavailable: ${currentRes.reason?.message}`);
    }
    const asList = (r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []);

    const bySymbol = new Map();
    const upsert = (symbol, patch) => bySymbol.set(symbol, { ...(bySymbol.get(symbol) || { symbol }), ...patch });

    for (const x of asList(upcomingRes)) {
        upsert(x.symbol, {
            name: x.companyName, series: x.series, openDate: parseNseDate(x.issueStartDate), closeDate: parseNseDate(x.issueEndDate),
            priceBand: parsePriceBand(x.issuePrice), sharesOffered: toNumber(x.issueSize)
        });
    }
    for (const x of asList(currentRes)) {
        upsert(x.symbol, {
            name: x.companyName, series: x.series, openDate: parseNseDate(x.issueStartDate), closeDate: parseNseDate(x.issueEndDate),
            priceBand: parsePriceBand(x.issuePrice), sharesOffered: toNumber(x.issueSize) ?? toNumber(x.noOfSharesOffered),
            totalSubscription: round(toNumber(x.noOfTime))
        });
    }
    for (const x of asList(pastRes)) {
        if (!EQUITY_TYPES.has(String(x.securityType).trim())) continue;
        const closeDate = parseNseDate(x.ipoEndDate);
        if (!closeDate || closeDate < closedSince) continue;
        const existing = bySymbol.get(x.symbol);
        upsert(x.symbol, {
            name: existing?.name || x.company,
            series: existing?.series || (x.securityType === 'SME' ? 'SME' : 'EQ'),
            openDate: existing?.openDate || parseNseDate(x.ipoStartDate),
            closeDate: existing?.closeDate || closeDate,
            priceBand: existing?.priceBand || parsePriceBand(x.priceRange),
            issuePrice: toNumber(x.issuePrice),
            listingDate: parseNseDate(x.listingDate)
        });
    }

    const ipos = [...bySymbol.values()]
        .map(ipo => ({ ...ipo, status: statusFor(ipo.openDate, ipo.closeDate, todayKey) }))
        .filter(ipo => ipo.status !== 'closed' || (ipo.closeDate && ipo.closeDate >= closedSince));

    const enriched = await Promise.all(ipos.map(async (ipo) => {
        const series = ipo.series === 'SME' ? 'SME' : 'EQ';
        const detail = await getIpoDetail(ipo.symbol, series, ipo.status);
        const subscription = detail?.subscription || (ipo.totalSubscription ? { total: ipo.totalSubscription } : null);
        const upper = ipo.priceBand?.max ?? null;
        const sharesOffered = ipo.sharesOffered ?? subscription?.sharesOffered ?? detail?.sharesFromText ?? null;
        const listed = ipo.listingDate && ipo.listingDate <= todayKey;
        const listing = listed ? await getListingPerformance(ipo.symbol, ipo.issuePrice || upper, ipo.listingDate) : null;
        return {
            symbol: ipo.symbol,
            name: ipo.name,
            type: series === 'SME' ? 'SME' : 'Mainboard',
            status: ipo.status,
            openDate: ipo.openDate,
            closeDate: ipo.closeDate,
            listingDate: ipo.listingDate || null,
            listed: Boolean(listed),
            priceBand: ipo.priceBand,
            issuePrice: ipo.issuePrice ?? null,
            lotSize: detail?.lotSize ?? null,
            minInvestment: detail?.lotSize && upper ? detail.lotSize * upper : null,
            sharesOffered,
            issueSizeCr: sharesOffered && upper ? round((sharesOffered * upper) / 1e7) : null,
            faceValue: detail?.faceValue ?? null,
            issueType: detail?.issueType ?? null,
            leadManagers: detail?.leadManagers ?? null,
            registrar: detail?.registrar ?? null,
            rhpUrl: detail?.rhpUrl ?? null,
            subscription,
            demand: demandSignal(subscription),
            listing
        };
    }));

    const order = { open: 0, upcoming: 1, closed: 2 };
    enriched.sort((a, b) => order[a.status] - order[b.status]
        || (a.status === 'closed' ? (b.closeDate || '').localeCompare(a.closeDate || '') : (a.openDate || '').localeCompare(b.openDate || '')));

    return {
        ipos: enriched,
        counts: {
            open: enriched.filter(i => i.status === 'open').length,
            upcoming: enriched.filter(i => i.status === 'upcoming').length,
            closed: enriched.filter(i => i.status === 'closed').length
        },
        closedWindowDays: CLOSED_WINDOW_DAYS,
        source: 'NSE India',
        lastUpdated: new Date().toISOString()
    };
}

const snapshots = () => mongoose.connection.db.collection('ipo_snapshots');

/**
 * Returns the IPO board. Live from NSE (cached 10 min). If NSE is unreachable (it sometimes blocks
 * cloud IPs), serves the last good snapshot saved in MongoDB and marks it as stale.
 */
export async function getIpoBoard({ forceRefresh = false } = {}) {
    if (!forceRefresh && boardCache.board && Date.now() - boardCache.at < BOARD_TTL_MS) return boardCache.board;
    try {
        const board = await buildBoard();
        boardCache = { at: Date.now(), board };
        if (mongoose.connection.readyState === 1) {
            snapshots().updateOne({ _id: 'latest' }, { $set: { board, savedAt: new Date() } }, { upsert: true })
                .catch(err => console.warn('Could not save IPO snapshot:', err.message));
        }
        return board;
    } catch (error) {
        console.error('IPO board refresh failed:', error.message);
        if (boardCache.board) return { ...boardCache.board, stale: true };
        if (mongoose.connection.readyState === 1) {
            const snap = await snapshots().findOne({ _id: 'latest' }).catch(() => null);
            if (snap?.board) return { ...snap.board, stale: true };
        }
        throw error;
    }
}

export default { getIpoBoard };

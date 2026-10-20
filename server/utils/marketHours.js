import axios from 'axios';

// NSE regular session: Mon–Fri, 09:15–15:30 IST.
const OPEN_MINUTES = 9 * 60 + 15;
const CLOSE_MINUTES = 15 * 60 + 30;
const SESSION_CACHE_MS = 60 * 1000;

// Returns the wall-clock parts of `date` in Asia/Kolkata, independent of server TZ.
function istParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23'
    }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type).value;
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return {
        weekday,
        minutes: Number(get('hour')) * 60 + Number(get('minute')),
        dateKey: `${get('year')}-${get('month')}-${get('day')}`
    };
}

export const istDateKey = (date = new Date()) => istParts(date).dateKey;

// Clock-only rule. Knows weekends but not exchange holidays; used only when the live session is unavailable.
function isWithinClockHours(date) {
    const { weekday, minutes } = istParts(date);
    return weekday >= 1 && weekday <= 5 && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
}

let sessionCache = { at: 0, session: null };

// Yahoo's NIFTY 50 metadata carries the exchange's current/last regular session. On a trading holiday it still
// points at the previous session, which is how holidays are detected without maintaining a holiday calendar.
async function fetchNseSession() {
    if (sessionCache.session && Date.now() - sessionCache.at < SESSION_CACHE_MS) return sessionCache.session;
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', {
        params: { range: '1d', interval: '1d' },
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const meta = response.data?.chart?.result?.[0]?.meta;
    const regular = meta?.currentTradingPeriod?.regular;
    if (!regular?.start || !regular?.end) throw new Error('No trading period in NSE metadata');
    const session = {
        start: new Date(regular.start * 1000),
        end: new Date(regular.end * 1000),
        lastTradeAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : null
    };
    sessionCache = { at: Date.now(), session };
    return session;
}

function describe(date, isOpen, reason) {
    const status = {
        open: 'Market Open (NSE/BSE)',
        weekend: 'Market Closed (Weekend)',
        holiday: 'Market Closed (Holiday)',
        'pre-market': 'Market Closed (Pre-Market)',
        'post-market': 'Market Closed (Post-Market)'
    }[reason];
    return {
        isOpen,
        reason,
        status,
        message: isOpen ? 'Trading is active' : 'Trading is closed',
        timezone: 'IST',
        currentTime: date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }),
        day: date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' }),
        timestamp: date.toISOString()
    };
}

function clockReason(date) {
    const { weekday, minutes } = istParts(date);
    if (weekday === 0 || weekday === 6) return 'weekend';
    if (minutes < OPEN_MINUTES) return 'pre-market';
    if (minutes >= CLOSE_MINUTES) return 'post-market';
    return 'open';
}

/**
 * Real NSE market status, holiday-aware. Every page and the order engine use this one function so the
 * dashboard and the trading screen can never disagree.
 */
export async function getMarketStatus(date = new Date()) {
    const reason = clockReason(date);
    if (reason === 'weekend') {
        return { ...describe(date, false, reason), source: 'clock' };
    }
    try {
        // Weekdays always consult the live session: a weekday evening may still be a holiday.
        const session = await fetchNseSession();
        const sessionIsToday = istDateKey(session.start) === istDateKey(date);
        if (!sessionIsToday) {
            // Before the open the session object still points at the previous day; that is pre-market, not a holiday,
            // unless the previous session is older than yesterday's trading day (checked once the open passes).
            if (reason === 'pre-market') return { ...describe(date, false, 'pre-market'), source: 'nse-session' };
            return { ...describe(date, false, 'holiday'), source: 'nse-session' };
        }
        if (reason !== 'open') return { ...describe(date, false, reason), source: 'nse-session' };
        const isOpen = date >= session.start && date < session.end;
        return { ...describe(date, isOpen, isOpen ? 'open' : 'post-market'), source: 'nse-session' };
    } catch (error) {
        console.warn(`Live market session unavailable, using clock rule: ${error.message}`);
        return { ...describe(date, isWithinClockHours(date), reason), source: 'clock' };
    }
}

export async function isMarketOpen(date = new Date()) {
    return (await getMarketStatus(date)).isOpen;
}

// Off by default so the paper-trading demo works outside market hours (orders fill at last traded price).
export function shouldEnforceMarketHours() {
    return process.env.ENFORCE_MARKET_HOURS === 'true';
}

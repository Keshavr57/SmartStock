import { INDIAN_STOCKS, SEARCH_ALIASES } from '../stocks/indianStocks.data.js';

// Maps a headline to the NSE companies it is about, using company names, common short names and
// unambiguous tickers. Longest match wins, so "HDFC Bank" is never read as "HDFC Life".

const STOP_SUFFIXES = /\b(limited|ltd\.?|corporation|corp\.?|company|co\.?|india|of india|industries|enterprises|\(.*?\))\b/gi;
// Tickers that are also ordinary words (or too short) are only matched through their company name.
const AMBIGUOUS_TICKERS = new Set(['LT', 'MM', 'NH', 'ITI', 'IOC', 'OIL', 'GAIL', 'PAGE', 'TRENT', 'HAVELLS', 'TITAN', 'CIPLA', 'DLF', 'ACC', 'UPL', 'BEL', 'IRB']);
const EXTRA_ALIASES = {
    'reliance industries': 'RELIANCE.NS', 'ril': 'RELIANCE.NS', 'mukesh ambani': 'RELIANCE.NS', 'jio': 'RELIANCE.NS',
    'tcs': 'TCS.NS', 'infosys': 'INFY.NS', 'wipro': 'WIPRO.NS', 'hcltech': 'HCLTECH.NS', 'hcl tech': 'HCLTECH.NS',
    'hdfc bank': 'HDFCBANK.NS', 'icici bank': 'ICICIBANK.NS', 'sbi': 'SBIN.NS', 'state bank': 'SBIN.NS', 'axis bank': 'AXISBANK.NS',
    'kotak bank': 'KOTAKBANK.NS', 'kotak mahindra bank': 'KOTAKBANK.NS', 'bajaj finance': 'BAJFINANCE.NS', 'airtel': 'BHARTIARTL.NS',
    'bharti airtel': 'BHARTIARTL.NS', 'l&t': 'LT.NS', 'larsen': 'LT.NS', 'larsen & toubro': 'LT.NS', 'itc': 'ITC.NS',
    'maruti': 'MARUTI.NS', 'maruti suzuki': 'MARUTI.NS', 'm&m': 'M&M.NS', 'mahindra & mahindra': 'M&M.NS', 'tata steel': 'TATASTEEL.NS',
    'tata power': 'TATAPOWER.NS', 'tata motors': 'TMPV.NS', 'adani enterprises': 'ADANIENT.NS', 'adani ports': 'ADANIPORTS.NS',
    'adani green': 'ADANIGREEN.NS', 'adani power': 'ADANIPOWER.NS', 'sun pharma': 'SUNPHARMA.NS', 'dr reddy': 'DRREDDY.NS',
    "dr reddy's": 'DRREDDY.NS', 'asian paints': 'ASIANPAINT.NS', 'hindustan unilever': 'HINDUNILVR.NS', 'hul': 'HINDUNILVR.NS',
    'nestle india': 'NESTLEIND.NS', 'ultratech': 'ULTRACEMCO.NS', 'zomato': 'ETERNAL.NS', 'eternal': 'ETERNAL.NS', 'paytm': 'PAYTM.NS',
    'nykaa': 'NYKAA.NS', 'irctc': 'IRCTC.NS', 'hal': 'HAL.NS', 'hindustan aeronautics': 'HAL.NS', 'bel ': 'BEL.NS',
    'bharat electronics': 'BEL.NS', 'ongc': 'ONGC.NS', 'coal india': 'COALINDIA.NS', 'ntpc': 'NTPC.NS', 'power grid': 'POWERGRID.NS',
    'vedanta': 'VEDL.NS', 'hindalco': 'HINDALCO.NS', 'jsw steel': 'JSWSTEEL.NS', 'titan': 'TITAN.NS', 'trent': 'TRENT.NS',
    'dmart': 'DMART.NS', 'avenue supermarts': 'DMART.NS', 'bajaj auto': 'BAJAJ-AUTO.NS', 'hero motocorp': 'HEROMOTOCO.NS',
    'eicher': 'EICHERMOT.NS', 'cipla': 'CIPLA.NS', 'lupin': 'LUPIN.NS', 'tech mahindra': 'TECHM.NS', 'indusind bank': 'INDUSINDBK.NS',
    'yes bank': 'YESBANK.NS', 'bank of baroda': 'BANKBARODA.NS', 'pnb': 'PNB.NS', 'punjab national bank': 'PNB.NS',
    'lic': 'LICI.NS', 'life insurance corporation': 'LICI.NS', 'dlf': 'DLF.NS', 'suzlon': 'SUZLON.NS', 'irfc': 'IRFC.NS'
};

function buildDictionary() {
    const dict = new Map();
    const add = (alias, symbol) => {
        const key = alias.toLowerCase().replace(/\s+/g, ' ').trim();
        if (key.length >= 3 && !dict.has(key)) dict.set(key, symbol);
    };
    for (const [alias, symbol] of Object.entries(EXTRA_ALIASES)) add(alias, symbol);
    for (const [alias, symbol] of Object.entries(SEARCH_ALIASES)) add(alias, symbol);
    for (const stock of INDIAN_STOCKS) {
        const short = stock.name.replace(STOP_SUFFIXES, ' ').replace(/\s+/g, ' ').trim();
        if (short.split(' ').length >= 2 || short.length >= 6) add(short, stock.symbol);
        const ticker = stock.symbol.replace(/\.(NS|BO)$/, '');
        if (ticker.length >= 4 && !AMBIGUOUS_TICKERS.has(ticker)) add(ticker, stock.symbol);
    }
    // Longest aliases first.
    return [...dict.entries()].sort((a, b) => b[0].length - a[0].length);
}

const DICTIONARY = buildDictionary();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = DICTIONARY.map(([alias, symbol]) => ({ symbol, re: new RegExp(`(^|[^a-z0-9&])${escape(alias)}([^a-z0-9&]|$)`, 'i') }));

export function linkEntities(text) {
    let remaining = ` ${String(text || '').toLowerCase()} `;
    const symbols = [];
    for (const { symbol, re } of PATTERNS) {
        if (re.test(remaining)) {
            if (!symbols.includes(symbol)) symbols.push(symbol);
            // Blank out the match so a shorter alias inside it cannot match again.
            remaining = remaining.replace(re, (m, pre, post) => `${pre}${' '.repeat(m.length - pre.length - post.length)}${post}`);
        }
    }
    return symbols.slice(0, 4);
}

export default { linkEntities };

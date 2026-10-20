import axios from 'axios';
import { INDIAN_STOCKS, SEARCH_ALIASES } from './indianStocks.data.js';

// The searchable universe: every equity listed on NSE, from NSE's own daily master file.
// Falls back to our curated list if NSE is unreachable.
const EQUITY_LIST_URL = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';
const REFRESH_MS = 24 * 60 * 60 * 1000;

const curatedBySymbol = new Map(INDIAN_STOCKS.map(s => [s.symbol, s]));
let universe = { at: 0, stocks: INDIAN_STOCKS.map(s => ({ symbol: s.symbol, name: s.name, sector: s.sector })) };
let loading = null;

function parseEquityCsv(csv) {
    return csv.split(/\r?\n/).slice(1)
        .map(line => line.split(','))
        .filter(cols => cols.length >= 3 && cols[0] && ['EQ', 'BE', 'BZ', 'SM', 'ST'].includes(cols[2].trim()))
        .map(([code, name]) => {
            const symbol = `${code.trim()}.NS`;
            return {
                symbol,
                name: curatedBySymbol.get(symbol)?.name || name.trim(),
                sector: curatedBySymbol.get(symbol)?.sector || null
            };
        });
}

async function refreshUniverse() {
    if (loading) return loading;
    loading = axios.get(EQUITY_LIST_URL, {
        timeout: 15000,
        responseType: 'text',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    }).then(res => {
        const stocks = parseEquityCsv(res.data);
        if (stocks.length > 500) universe = { at: Date.now(), stocks };
    }).catch(error => {
        console.warn(`NSE equity list unavailable, using curated list: ${error.message}`);
        universe.at = Date.now() - REFRESH_MS + 60 * 60 * 1000; // retry in an hour
    }).finally(() => { loading = null; });
    return loading;
}

async function getUniverse() {
    if (Date.now() - universe.at > REFRESH_MS) await refreshUniverse();
    return universe.stocks;
}

// Ranked search: alias > exact ticker > ticker prefix > name word prefix > substring.
export async function searchUniverse(rawQuery, limit = 10) {
    const query = String(rawQuery || '').trim().toLowerCase();
    if (!query) return [];
    const stocks = await getUniverse();

    const aliasSymbol = SEARCH_ALIASES[query];
    const scored = [];
    for (const stock of stocks) {
        const ticker = stock.symbol.replace(/\.NS$/, '').toLowerCase();
        const name = stock.name.toLowerCase();
        let score = 0;
        if (stock.symbol === aliasSymbol) score = 100;
        else if (ticker === query) score = 90;
        else if (ticker.startsWith(query)) score = 70;
        else if (name.split(/\s+/).some(w => w.startsWith(query))) score = 50;
        else if (ticker.includes(query) || name.includes(query)) score = 30;
        if (score > 0) {
            // Prefer well-known (curated) companies among equal matches.
            if (curatedBySymbol.has(stock.symbol)) score += 5;
            scored.push({ stock, score });
        }
    }
    return scored
        .sort((a, b) => b.score - a.score || a.stock.symbol.length - b.stock.symbol.length)
        .slice(0, limit)
        .map(s => s.stock);
}

export default { searchUniverse };

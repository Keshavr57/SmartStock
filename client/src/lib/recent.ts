// Recently viewed stocks, shown first in the ⌘K palette.
const RECENT_KEY = 'smartstock-recent-symbols'

export function rememberSymbol(symbol: string) {
    try {
        const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
        localStorage.setItem(RECENT_KEY, JSON.stringify([symbol, ...recent.filter(s => s !== symbol)].slice(0, 6)))
    } catch { /* storage unavailable */ }
}

export function readRecentSymbols(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

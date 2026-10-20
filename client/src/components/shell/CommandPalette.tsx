import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import { ticker } from '@/lib/market'
import { ALL_NAV_ITEMS } from './nav'
import { readRecentSymbols, rememberSymbol } from '@/lib/recent'

interface StockHit { symbol: string; name: string; sector?: string | null }
type Result =
    | { kind: 'page'; key: string; label: string; to: string; icon: (typeof ALL_NAV_ITEMS)[number]['icon'] }
    | { kind: 'stock'; key: string; symbol: string; name: string; sector?: string | null }

/** ⌘K / Ctrl+K: jump to any NSE stock or any page. Mounted only while open, so state starts fresh each time. */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [stocks, setStocks] = useState<StockHit[]>([])
    const [active, setActive] = useState(0)

    useEffect(() => {
        const q = query.trim()
        if (!q) return
        const id = setTimeout(async () => {
            try {
                const res = await api.get('/market/stocks/search', { params: { q, limit: 8 } })
                setStocks(res.data?.data ?? [])
                setActive(0)
            } catch { setStocks([]) }
        }, 150)
        return () => clearTimeout(id)
    }, [query])

    const results: Result[] = useMemo(() => {
        const q = query.trim().toLowerCase()
        const pages = ALL_NAV_ITEMS
            .filter(p => !q || p.label.toLowerCase().includes(q) || p.keywords?.includes(q))
            .map(p => ({ kind: 'page' as const, key: p.to, label: p.label, to: p.to, icon: p.icon }))
        const stockResults = (q ? stocks : readRecentSymbols().map(s => ({ symbol: s, name: '' })))
            .map(s => ({ kind: 'stock' as const, key: s.symbol, symbol: s.symbol, name: s.name, sector: (s as StockHit).sector }))
        return [...stockResults, ...pages]
    }, [query, stocks])

    const choose = (r: Result) => {
        if (r.kind === 'page') navigate(r.to)
        else {
            rememberSymbol(r.symbol)
            navigate(`/stock/${encodeURIComponent(r.symbol)}`)
        }
        onClose()
    }

    const firstPageIndex = results.findIndex(r => r.kind === 'page')
    const hasStocks = results.some(r => r.kind === 'stock')

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Search">
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                        ref={inputRef}
                        autoFocus
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            if (!e.target.value.trim()) setStocks([])
                        }}
                        onKeyDown={e => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
                            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
                            if (e.key === 'Enter' && results[active]) choose(results[active])
                            if (e.key === 'Escape') onClose()
                        }}
                        placeholder="Search any NSE stock or jump to a page"
                        className="flex-1 h-12 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                    />
                    <kbd className="hidden sm:inline text-[10px] font-medium text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">ESC</kbd>
                </div>
                <ul className="max-h-[50vh] overflow-y-auto py-1">
                    {results.map((r, i) => (
                        <li key={`${r.kind}-${r.key}`}>
                            {i === 0 && hasStocks && <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-zinc-400">{query.trim() ? 'Stocks' : 'Recent'}</p>}
                            {i === firstPageIndex && <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-zinc-400">Pages</p>}
                            <button
                                onMouseEnter={() => setActive(i)}
                                onClick={() => choose(r)}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${i === active ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                            >
                                {r.kind === 'page' ? (
                                    <>
                                        <r.icon className="w-4 h-4 text-zinc-500" />
                                        <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{r.label}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                                            {ticker(r.symbol).slice(0, 2)}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticker(r.symbol)}</span>
                                            {r.name && <span className="block text-xs text-zinc-500 truncate">{r.name}{r.sector ? ` · ${r.sector}` : ''}</span>}
                                        </span>
                                        <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                                    </>
                                )}
                                {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" />}
                            </button>
                        </li>
                    ))}
                    {results.length === 0 && <li className="px-4 py-6 text-sm text-center text-zinc-500">No matches for “{query}”.</li>}
                </ul>
            </div>
        </div>
    )
}

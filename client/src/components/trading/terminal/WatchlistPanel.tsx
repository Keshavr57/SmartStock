import { useEffect, useRef, useState } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { fetchQuotes, price, signedPct, ticker, trendClass, usePolling } from '@/lib/market'
import type { Quote } from '@/lib/market'

const DEFAULT_WATCHLIST = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'ETERNAL.NS']

interface SearchHit { symbol: string; name: string }

interface WatchlistPanelProps {
    selected: string
    onSelect: (symbol: string) => void
    live: boolean
}

// The user's saved watchlist (server-side), seeded with large caps until they add their own.
export default function WatchlistPanel({ selected, onSelect, live }: WatchlistPanelProps) {
    const [symbols, setSymbols] = useState<string[] | null>(null)
    const [query, setQuery] = useState('')
    const [hits, setHits] = useState<SearchHit[]>([])
    const [activeHit, setActiveHit] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        api.get('/trading/watchlist')
            .then(res => {
                const saved: string[] = (res.data?.data ?? []).map((w: { symbol: string }) => w.symbol)
                setSymbols(saved.length ? saved : DEFAULT_WATCHLIST)
            })
            .catch(() => setSymbols(DEFAULT_WATCHLIST))
    }, [])

    const { data: quotes } = usePolling<Quote[]>(() => fetchQuotes(symbols ?? []), live ? 15000 : 60000, [symbols?.join(',')])
    const quoteBySymbol = new Map((quotes ?? []).map(q => [q.symbol, q]))

    // "/" focuses search, as on most trading terminals.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        const q = query.trim()
        if (!q) return
        const id = setTimeout(async () => {
            try {
                const res = await api.get('/market/stocks/search', { params: { q, limit: 8 } })
                setHits(res.data?.data ?? [])
                setActiveHit(0)
            } catch { setHits([]) }
        }, 200)
        return () => clearTimeout(id)
    }, [query])

    const persist = async (next: string[], change: { add?: string; remove?: string }) => {
        setSymbols(next)
        try {
            // First edit turns the default list into the user's own saved list.
            if (symbols === DEFAULT_WATCHLIST || (symbols && symbols.every((s, i) => s === DEFAULT_WATCHLIST[i]))) {
                for (const s of next) await api.post('/trading/watchlist', { symbol: s })
            } else if (change.add) {
                await api.post('/trading/watchlist', { symbol: change.add })
            } else if (change.remove) {
                await api.delete(`/trading/watchlist/me/${encodeURIComponent(change.remove)}`)
            }
        } catch {
            // Local state still reflects the change; it will resync on next load.
        }
    }

    const choose = (hit: SearchHit) => {
        onSelect(hit.symbol)
        if (symbols && !symbols.includes(hit.symbol)) persist([hit.symbol, ...symbols], { add: hit.symbol })
        setQuery('')
        setHits([])
        inputRef.current?.blur()
    }

    return (
        <div className="flex flex-col h-full">
            <div className="relative p-3 border-b border-zinc-200 dark:border-zinc-800">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        if (!e.target.value.trim()) setHits([])
                    }}
                    onKeyDown={e => {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveHit(i => Math.min(i + 1, hits.length - 1)) }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveHit(i => Math.max(i - 1, 0)) }
                        if (e.key === 'Enter' && hits[activeHit]) choose(hits[activeHit])
                        if (e.key === 'Escape') { setQuery(''); inputRef.current?.blur() }
                    }}
                    placeholder="Search & add  ( / )"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#630ed4]/30"
                />
                {hits.length > 0 && (
                    <ul className="absolute left-3 right-3 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                        {hits.map((h, i) => (
                            <li key={h.symbol}>
                                <button
                                    onMouseEnter={() => setActiveHit(i)}
                                    onClick={() => choose(h)}
                                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left ${i === activeHit ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticker(h.symbol)}</span>
                                        <span className="block text-xs text-zinc-500 truncate">{h.name}</span>
                                    </span>
                                    {symbols?.includes(h.symbol) ? <span className="text-[11px] text-zinc-400">Added</span> : <Plus className="w-4 h-4 text-zinc-400 shrink-0" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="px-3 py-2 flex justify-between text-[11px] text-zinc-400">
                <span>Watchlist · {symbols?.length ?? 0}</span>
                <span>LTP / Change</span>
            </div>

            <ul className="flex-1 overflow-y-auto">
                {(symbols ?? []).map(s => {
                    const q = quoteBySymbol.get(s)
                    const isSelected = s === selected
                    return (
                        <li key={s} className="group relative">
                            <button
                                onClick={() => onSelect(s)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-l-2 transition-colors ${isSelected
                                    ? 'border-[#630ed4] bg-violet-50/70 dark:bg-violet-500/10'
                                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
                            >
                                <span className="min-w-0">
                                    <span className={`block text-sm font-medium truncate ${isSelected ? 'text-[#630ed4] dark:text-violet-300' : 'text-zinc-900 dark:text-zinc-100'}`}>{ticker(s)}</span>
                                    <span className="block text-[11px] text-zinc-400 truncate max-w-[120px]">{q?.name ?? ''}</span>
                                </span>
                                <span className="text-right tabular-nums">
                                    <span className="block text-sm text-zinc-900 dark:text-zinc-100">{price(q?.price)}</span>
                                    <span className={`block text-[11px] ${trendClass(q?.changePercent)}`}>{signedPct(q?.changePercent)}</span>
                                </span>
                            </button>
                            <button
                                onClick={() => persist(symbols!.filter(x => x !== s), { remove: s })}
                                title="Remove from watchlist"
                                className="absolute right-1 top-1 p-1 rounded opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 hover:bg-white dark:hover:bg-zinc-900"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

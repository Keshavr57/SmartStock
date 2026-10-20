import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Star, ExternalLink, Globe, Users } from 'lucide-react'
import { api } from '@/lib/api'
import {
    fetchMarketStatus, fetchPositions, fetchQuote, price, rupees, signedPct, signedRupees, ticker, trendClass, usePolling, volume
} from '@/lib/market'
import type { MarketStatus, Position, Quote } from '@/lib/market'
import { Badge, Button, Delta, DeltaPill, Page, Panel, PanelHeader, Skeleton } from '@/components/ds'
import PriceChart from '@/components/trading/terminal/PriceChart'
import { rememberSymbol } from '@/lib/recent'

type Fundamentals = Record<string, number | string | null | string[]>

interface StockNews {
    id: string
    title: string
    link: string
    source: string
    publishedAt: string
    sentiment: 'positive' | 'negative' | 'neutral'
    event: { label: string } | null
    reaction: { ar1: number } | null
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const fixed = (v: unknown, d = 2) => (num(v) == null ? '—' : (v as number).toFixed(d))
const pct = (v: unknown) => (num(v) == null ? '—' : `${(v as number).toFixed(2)}%`)
const crore = (v: unknown) => {
    const n = num(v)
    if (n == null) return '—'
    if (Math.abs(n) >= 1e12) return `₹${(n / 1e12).toFixed(2)} L Cr`
    return `₹${(n / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
}

function KeyValue({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0" title={hint}>
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{value}</dd>
        </div>
    )
}

function Bar({ label, value }: { label: string; value: number | null }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">{label}</span>
                <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{value == null ? '—' : `${value.toFixed(1)}%`}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
            </div>
        </div>
    )
}

const RECOMMENDATION_LABEL: Record<string, string> = {
    strong_buy: 'Strong buy', buy: 'Buy', hold: 'Hold', underperform: 'Underperform', sell: 'Sell'
}

// Keyed by symbol so every piece of state starts fresh when navigating between stocks.
export default function StockRoute() {
    const { symbol: raw = 'RELIANCE.NS' } = useParams()
    const upper = decodeURIComponent(raw).toUpperCase()
    const symbol = upper.includes('.') ? upper : `${upper}.NS`
    return <StockPage key={symbol} symbol={symbol} />
}

function StockPage({ symbol }: { symbol: string }) {
    const navigate = useNavigate()

    const { data: market } = usePolling<MarketStatus>(fetchMarketStatus, 60000)
    const live = Boolean(market?.isOpen)
    const { data: quote } = usePolling<Quote | null>(() => fetchQuote(symbol), live ? 10000 : 60000, [symbol, live])
    const { data: positions } = usePolling<Position[]>(fetchPositions, 60000)
    const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null)
    const [news, setNews] = useState<StockNews[] | null>(null)
    const [watching, setWatching] = useState<boolean | null>(null)

    useEffect(() => {
        rememberSymbol(symbol)
        let cancelled = false
        api.get(`/fundamentals/${encodeURIComponent(symbol)}`)
            .then(res => { if (!cancelled) setFundamentals(res.data?.fundamentals ?? {}) })
            .catch(() => { if (!cancelled) setFundamentals({}) })
        api.get(`/news/symbol/${encodeURIComponent(symbol)}`)
            .then(res => { if (!cancelled) setNews(res.data?.data ?? []) })
            .catch(() => { if (!cancelled) setNews([]) })
        api.get('/trading/watchlist')
            .then(res => { if (!cancelled) setWatching((res.data?.data ?? []).some((w: { symbol: string }) => w.symbol === symbol)) })
            .catch(() => { if (!cancelled) setWatching(false) })
        return () => { cancelled = true }
    }, [symbol])

    const toggleWatch = async () => {
        const next = !watching
        setWatching(next)
        try {
            if (next) await api.post('/trading/watchlist', { symbol })
            else await api.delete(`/trading/watchlist/me/${encodeURIComponent(symbol)}`)
        } catch { setWatching(!next) }
    }

    const q = quote?.symbol === symbol ? quote : null
    const f = fundamentals || {}
    const position = positions?.find(p => p.symbol === symbol) ?? null
    const target = num(f.targetMeanPrice)
    const upside = target && q?.price ? ((target - q.price) / q.price) * 100 : null
    const returns: [string, unknown][] = [
        ['1M', f.oneMonthReturn], ['3M', f.threeMonthReturn], ['6M', f.sixMonthReturn],
        ['1Y', f.oneYearReturn], ['3Y', f.threeYearReturn], ['5Y', f.fiveYearReturn]
    ]
    const trade = (side: 'BUY' | 'SELL') => navigate(`/virtual-trading?symbol=${encodeURIComponent(symbol)}&side=${side}`)

    return (
        <Page>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold tracking-tight">{q?.name || (typeof f.name === 'string' ? f.name : ticker(symbol))}</h1>
                        <Badge>NSE: {ticker(symbol)}</Badge>
                        {typeof f.sector === 'string' && <Badge tone="brand">{f.sector}</Badge>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        {q ? (
                            <>
                                <span className="text-3xl font-semibold tabular-nums">{rupees(q.price)}</span>
                                <span className={`text-sm font-medium tabular-nums ${trendClass(q.change)}`}>{signedRupees(q.change)} ({signedPct(q.changePercent)})</span>
                                <span className="text-xs text-zinc-500">
                                    {market?.isOpen ? 'Live' : 'At close'} · {q.asOf ? new Date(q.asOf).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </>
                        ) : <Skeleton className="h-9 w-56" />}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={toggleWatch} disabled={watching == null}>
                        <Star className={`w-4 h-4 ${watching ? 'fill-amber-400 text-amber-400' : ''}`} /> {watching ? 'Watching' : 'Watchlist'}
                    </Button>
                    <Button variant="buy" onClick={() => trade('BUY')} className="min-w-[84px]">Buy</Button>
                    <Button variant="sell" onClick={() => trade('SELL')} className="min-w-[84px]" disabled={!position}>Sell</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
                <div className="space-y-4 min-w-0">
                    <Panel className="overflow-hidden">
                        <div className="h-[440px]">
                            <PriceChart symbol={symbol} previousClose={q?.previousClose} live={live} />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Performance" subtitle="Price return over each period" />
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                            {returns.map(([label, v]) => (
                                <div key={label} className="bg-white dark:bg-zinc-900 px-4 py-3">
                                    <p className="text-xs text-zinc-500">{label}</p>
                                    {fundamentals ? <Delta value={num(v)} className="text-sm font-semibold" /> : <Skeleton className="h-5 w-14 mt-1" />}
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Key statistics" subtitle="Fundamentals from Yahoo Finance and SmartStock's dataset" />
                        {fundamentals ? (
                            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-8 px-4 pb-3">
                                <div>
                                    <KeyValue label="Market cap" value={crore(f.marketCap)} />
                                    <KeyValue label="P/E (TTM)" value={fixed(f.peRatio)} />
                                    <KeyValue label="Forward P/E" value={fixed(f.forwardPE)} />
                                    <KeyValue label="P/B" value={fixed(f.pbRatio)} />
                                    <KeyValue label="EPS (TTM)" value={num(f.eps) == null ? '—' : rupees(f.eps as number)} />
                                </div>
                                <div>
                                    <KeyValue label="ROE" value={pct(f.roe)} />
                                    <KeyValue label="ROCE" value={pct(f.roce)} />
                                    <KeyValue label="Net margin" value={pct(f.profitMargin)} />
                                    <KeyValue label="Revenue growth" value={pct(f.revenueGrowth)} hint="Year over year" />
                                    <KeyValue label="Debt / equity" value={fixed(f.debtToEquity)} />
                                </div>
                                <div>
                                    <KeyValue label="Dividend yield" value={pct(f.dividendYield)} />
                                    <KeyValue label="Beta" value={fixed(f.beta)} hint="Volatility relative to the market" />
                                    <KeyValue label="RSI (14)" value={fixed(f.rsi, 1)} hint="Above 70 overbought, below 30 oversold" />
                                    <KeyValue label="52W high" value={price(q?.fiftyTwoWeekHigh)} />
                                    <KeyValue label="52W low" value={price(q?.fiftyTwoWeekLow)} />
                                </div>
                            </dl>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6 px-4 pb-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>
                        )}
                        <p className="px-4 pb-3 text-xs text-zinc-400">Day volume {volume(q?.volume)} · Previous close {price(q?.previousClose)}</p>
                    </Panel>

                    {typeof f.description === 'string' && f.description && (
                        <Panel>
                            <PanelHeader title={`About ${ticker(symbol)}`} subtitle={typeof f.industry === 'string' ? f.industry : undefined} />
                            <p className="px-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-6">{f.description}</p>
                            <div className="px-4 py-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                                {typeof f.website === 'string' && f.website && (
                                    <a href={f.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600"><Globe className="w-3.5 h-3.5" /> {f.website.replace(/^https?:\/\//, '')}</a>
                                )}
                                {num(f.employees) != null && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(f.employees as number).toLocaleString('en-IN')} employees</span>}
                            </div>
                        </Panel>
                    )}
                </div>

                <aside className="space-y-4">
                    {position && (
                        <Panel>
                            <PanelHeader title="Your position" action={<Link to="/portfolio" className="text-xs text-brand-600 dark:text-brand-300 hover:underline">Portfolio</Link>} />
                            <dl className="px-4 pb-3">
                                <KeyValue label="Quantity" value={String(position.quantity)} />
                                <KeyValue label="Avg. price" value={rupees(position.avgPrice)} />
                                <KeyValue label="Current value" value={rupees(position.currentValue)} />
                                <div className="flex items-baseline justify-between py-2">
                                    <dt className="text-sm text-zinc-500">P&amp;L</dt>
                                    <dd className={`text-sm font-semibold tabular-nums ${trendClass(position.pnl)}`}>{signedRupees(position.pnl)} ({signedPct(position.pnlPercent)})</dd>
                                </div>
                            </dl>
                        </Panel>
                    )}

                    <Panel>
                        <PanelHeader title="Analyst consensus" subtitle={num(f.analystCount) ? `${f.analystCount} analysts` : undefined} />
                        <div className="px-4 pb-4">
                            {typeof f.recommendation === 'string' ? (
                                <>
                                    <p className="text-lg font-semibold">{RECOMMENDATION_LABEL[f.recommendation] ?? f.recommendation}</p>
                                    {target && (
                                        <p className="text-sm text-zinc-500 mt-1 tabular-nums">
                                            Mean target {rupees(target)} · <span className={trendClass(upside)}>{signedPct(upside)} {upside != null && upside >= 0 ? 'upside' : 'downside'}</span>
                                        </p>
                                    )}
                                </>
                            ) : <p className="text-sm text-zinc-500">{fundamentals ? 'No analyst coverage reported.' : 'Loading…'}</p>}
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Shareholding" />
                        <div className="px-4 pb-4 space-y-3">
                            <Bar label="Promoters / insiders" value={num(f.promoterHolding)} />
                            <Bar label="Institutions" value={num(f.institutionalHolding)} />
                            <Bar label="Foreign institutions (FII)" value={num(f.fiiHolding)} />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Recent news" action={<Link to="/news" className="text-xs text-brand-600 dark:text-brand-300 hover:underline">All news</Link>} />
                        <ul className="pb-2">
                            {news == null && [0, 1, 2].map(i => <li key={i} className="px-4 py-2"><Skeleton className="h-10" /></li>)}
                            {news?.length === 0 && <li className="px-4 pb-3 text-sm text-zinc-500">No recent headlines tracked for {ticker(symbol)}.</li>}
                            {news?.slice(0, 6).map(n => (
                                <li key={n.id}>
                                    <a href={n.link} target="_blank" rel="noreferrer" className="group block px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <p className="text-sm leading-snug text-zinc-800 dark:text-zinc-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 line-clamp-2">{n.title}</p>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                                            <span className={`w-1.5 h-1.5 rounded-full ${n.sentiment === 'positive' ? 'bg-emerald-500' : n.sentiment === 'negative' ? 'bg-rose-500' : 'bg-zinc-400'}`} />
                                            <span>{n.source}</span>
                                            <span>· {new Date(n.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            {n.reaction && <span>· reaction <DeltaPill value={n.reaction.ar1} className="!text-[10px] !px-1 !py-0" /></span>}
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                        </p>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </aside>
            </div>
        </Page>
    )
}

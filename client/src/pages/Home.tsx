import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CandlestickChart, Rocket } from 'lucide-react'
import { api } from '@/lib/api'
import {
    fetchAccount, fetchMarketStatus, fetchPositions, fetchQuotes, price, rupees, signedPct, signedRupees, ticker, trendClass, usePolling
} from '@/lib/market'
import type { AccountSummary, MarketStatus, Position, Quote } from '@/lib/market'
import { Badge, Button, Delta, DeltaPill, EmptyState, Page, Panel, PanelHeader, Segmented, Skeleton, Sparkline, tableCell, tableHead } from '@/components/ds'

const INDICES = [
    { symbol: '^NSEI', label: 'NIFTY 50' },
    { symbol: '^NSEBANK', label: 'NIFTY BANK' },
    { symbol: '^BSESN', label: 'SENSEX' },
    { symbol: '^CNXIT', label: 'NIFTY IT' }
]

interface Mover { symbol: string; name: string; price: number; change: number }
interface NewsItem { id: string; title: string; link: string; source: string; publishedAt: string; sentiment: string; symbols: string[] }
interface Ipo { symbol: string; name: string; status: string; type: string; openDate: string | null; closeDate: string | null; priceBand: { min: number; max: number } | null; subscription: { total: number | null } | null }

const greeting = () => {
    const hour = Number(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }))
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}
const firstName = () => {
    try { return (JSON.parse(localStorage.getItem('user') || '{}').name || '').split(' ')[0] } catch { return '' }
}
const shortDate = (key: string | null) => key ? new Date(`${key}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'
const timeAgo = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 60) return `${Math.max(mins, 1)}m`
    if (mins < 1440) return `${Math.round(mins / 60)}h`
    return `${Math.round(mins / 1440)}d`
}

function IndexCard({ symbol, label, quote }: { symbol: string; label: string; quote?: Quote }) {
    const [series, setSeries] = useState<number[]>([])
    useEffect(() => {
        api.get(`/trading/chart/${encodeURIComponent(symbol)}`, { params: { timeframe: '1D' } })
            .then(res => setSeries((res.data?.data?.candles ?? []).map((c: { close: number }) => c.close)))
            .catch(() => setSeries([]))
    }, [symbol])
    return (
        <Panel className="p-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-medium text-zinc-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{quote ? price(quote.price) : <Skeleton className="h-6 w-24" />}</p>
                    <p className="text-xs tabular-nums mt-0.5">
                        <span className={trendClass(quote?.change)}>{signedRupees(quote?.change).replace('₹', '')}</span>{' '}
                        <span className={trendClass(quote?.changePercent)}>({signedPct(quote?.changePercent)})</span>
                    </p>
                </div>
                <Sparkline values={series} width={88} height={40} className="mt-1" />
            </div>
        </Panel>
    )
}

export default function Home() {
    const navigate = useNavigate()
    const { data: market } = usePolling<MarketStatus>(fetchMarketStatus, 60000)
    const live = Boolean(market?.isOpen)
    const { data: account } = usePolling<AccountSummary>(fetchAccount, 30000)
    const { data: positions } = usePolling<Position[]>(fetchPositions, 30000)
    const { data: indices } = usePolling<Quote[]>(() => fetchQuotes(INDICES.map(i => i.symbol)), live ? 20000 : 120000, [live])
    const { data: movers } = usePolling<{ gainers: Mover[]; losers: Mover[] }>(
        async () => (await api.get('/market/top-movers')).data.data, live ? 60000 : 300000, [live])
    const [moverTab, setMoverTab] = useState<'gainers' | 'losers'>('gainers')
    const [news, setNews] = useState<NewsItem[] | null>(null)
    const [ipos, setIpos] = useState<Ipo[] | null>(null)

    useEffect(() => {
        api.get('/news/trending', { timeout: 20000 }).then(res => setNews(res.data?.data ?? [])).catch(() => setNews([]))
        api.get('/ipo', { timeout: 30000 }).then(res => setIpos(res.data?.data?.ipos ?? [])).catch(() => setIpos([]))
    }, [])

    const cashShare = account && account.totalValue > 0 ? (account.availableBalance / account.totalValue) * 100 : 100
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })
    const activeIpos = (ipos ?? []).filter(i => i.status !== 'closed').slice(0, 4)
    const moverRows = (movers?.[moverTab] ?? []).slice(0, 5)

    return (
        <Page>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{greeting()}{firstName() ? `, ${firstName()}` : ''}</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {today} · <span className={live ? 'text-emerald-600 dark:text-emerald-400' : ''}>{market?.status ?? 'Checking market…'}</span>
                    </p>
                </div>
                <Button variant="primary" onClick={() => navigate('/virtual-trading')}>
                    <CandlestickChart className="w-4 h-4" /> Open trading
                </Button>
            </div>

            {/* Account + indices */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-4 mb-4">
                <Panel className="p-5">
                    <p className="text-xs font-medium text-zinc-500">Account value</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{account ? rupees(account.totalValue) : <Skeleton className="h-9 w-48" />}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-zinc-500">Today's P&amp;L</p>
                            <p className="mt-0.5 text-sm font-semibold"><Delta value={account?.dayPnL} kind="rupees" /> <Delta value={account?.dayPnLPercent} className="text-xs font-normal" /></p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Total P&amp;L</p>
                            <p className="mt-0.5 text-sm font-semibold"><Delta value={account?.totalPnL} kind="rupees" /> <Delta value={account?.totalPnLPercent} className="text-xs font-normal" /></p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <div className="bg-brand-500" style={{ width: `${100 - cashShare}%` }} />
                        </div>
                        <div className="mt-2 flex justify-between text-xs tabular-nums">
                            <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2 h-2 rounded-full bg-brand-500" />Invested {rupees(account?.currentValue)}</span>
                            <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />Cash {rupees(account?.availableBalance)}</span>
                        </div>
                    </div>
                </Panel>
                <div className="grid grid-cols-2 gap-4">
                    {INDICES.map(i => <IndexCard key={i.symbol} {...i} quote={indices?.find(q => q.symbol === i.symbol)} />)}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                <div className="space-y-4 min-w-0">
                    <Panel>
                        <PanelHeader
                            title="Holdings"
                            subtitle={positions ? `${positions.length} ${positions.length === 1 ? 'stock' : 'stocks'}` : undefined}
                            action={<Link to="/portfolio" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">View portfolio</Link>}
                        />
                        {positions && positions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-y border-zinc-100 dark:border-zinc-800">
                                        <th className={tableHead}>Stock</th><th className={tableHead}>Qty</th><th className={tableHead}>LTP</th>
                                        <th className={tableHead}>Value</th><th className={tableHead}>P&amp;L</th><th className={tableHead}>Day</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {positions.slice(0, 6).map(p => (
                                            <tr key={p.symbol} onClick={() => navigate(`/stock/${p.symbol}`)} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                <td className={tableCell}>
                                                    <span className="font-medium">{ticker(p.symbol)}</span>
                                                    <span className="block text-xs text-zinc-500 truncate max-w-[180px]">{p.name}</span>
                                                </td>
                                                <td className={tableCell}>{p.quantity}</td>
                                                <td className={tableCell}>{price(p.currentPrice)}</td>
                                                <td className={tableCell}>{rupees(p.currentValue)}</td>
                                                <td className={tableCell}><Delta value={p.pnl} kind="rupees" /><span className="block text-xs"><Delta value={p.pnlPercent} /></span></td>
                                                <td className={tableCell}><Delta value={p.dayPnL} kind="rupees" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : positions ? (
                            <EmptyState
                                icon={<CandlestickChart className="w-6 h-6" />}
                                title="No holdings yet"
                                description="You have ₹1,00,000 of virtual cash. Buy your first stock to start building a portfolio."
                                action={<Button variant="primary" onClick={() => navigate('/virtual-trading')}>Start trading</Button>}
                            />
                        ) : <div className="p-4 space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>}
                    </Panel>

                    <Panel>
                        <PanelHeader
                            title="Top movers"
                            subtitle="Large-cap NSE stocks, last session"
                            action={<Segmented value={moverTab} onChange={setMoverTab} options={[{ value: 'gainers', label: 'Gainers' }, { value: 'losers', label: 'Losers' }]} />}
                        />
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                            {!movers && [0, 1, 2, 3, 4].map(i => <li key={i} className="px-4 py-3"><Skeleton className="h-6" /></li>)}
                            {movers && moverRows.length === 0 && <li className="px-4 py-6 text-sm text-center text-zinc-500">Market movers are unavailable right now.</li>}
                            {moverRows.map(m => (
                                <li key={m.symbol}>
                                    <Link to={`/stock/${m.symbol}.NS`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium">{m.symbol}</span>
                                            <span className="block text-xs text-zinc-500 truncate">{m.name}</span>
                                        </span>
                                        <span className="flex items-center gap-3 text-sm tabular-nums">
                                            <span>{price(m.price)}</span>
                                            <DeltaPill value={m.change} className="min-w-[64px] justify-center" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>

                <div className="space-y-4 min-w-0">
                    <Panel>
                        <PanelHeader title="Market news" action={<Link to="/news" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">All news</Link>} />
                        <ul className="pb-2">
                            {!news && [0, 1, 2, 3].map(i => <li key={i} className="px-4 py-2"><Skeleton className="h-10" /></li>)}
                            {news?.length === 0 && <li className="px-4 pb-4 text-sm text-zinc-500">News feeds are unavailable right now.</li>}
                            {news?.slice(0, 6).map(n => (
                                <li key={n.id}>
                                    <a href={n.link} target="_blank" rel="noreferrer" className="block px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <p className="text-sm leading-snug line-clamp-2">{n.title}</p>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                            <span className={`w-1.5 h-1.5 rounded-full ${n.sentiment === 'positive' ? 'bg-emerald-500' : n.sentiment === 'negative' ? 'bg-rose-500' : 'bg-zinc-400'}`} />
                                            {n.source} · {timeAgo(n.publishedAt)}
                                            {n.symbols[0] && <Badge className="ml-1">{ticker(n.symbols[0])}</Badge>}
                                        </p>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <Panel>
                        <PanelHeader title="IPO calendar" subtitle="Open and upcoming on NSE" action={<Link to="/ipos" className="text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline">All IPOs</Link>} />
                        <ul className="pb-2">
                            {!ipos && [0, 1].map(i => <li key={i} className="px-4 py-2"><Skeleton className="h-10" /></li>)}
                            {ipos && activeIpos.length === 0 && (
                                <li className="px-4 pb-4 text-sm text-zinc-500 flex items-center gap-2"><Rocket className="w-4 h-4" /> No IPOs open or scheduled right now.</li>
                            )}
                            {activeIpos.map(i => (
                                <li key={i.symbol}>
                                    <Link to="/ipos" className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-medium truncate">{i.name}</span>
                                            <span className="block text-xs text-zinc-500 tabular-nums">
                                                {shortDate(i.openDate)} – {shortDate(i.closeDate)}{i.priceBand ? ` · ₹${i.priceBand.min}–${i.priceBand.max}` : ''}
                                            </span>
                                        </span>
                                        <Badge tone={i.status === 'open' ? 'up' : 'brand'}>{i.status === 'open' ? 'Open' : 'Upcoming'}</Badge>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <Link to="/ipos" className="flex items-center justify-center gap-1 border-t border-zinc-100 dark:border-zinc-800 py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                            Recently listed & closed IPOs <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </Panel>
                </div>
            </div>
        </Page>
    )
}

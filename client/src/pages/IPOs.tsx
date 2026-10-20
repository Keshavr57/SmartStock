import { useState, useEffect, useMemo } from "react"
import { Button, Page, PageHeader } from '@/components/ds'
import { RefreshCw, Calendar, AlertTriangle, FileText, TrendingUp, TrendingDown, Users } from "lucide-react"
import { getIpoBoard } from "../lib/api"

interface Subscription {
    qib: number | null
    nii: number | null
    retail: number | null
    employee: number | null
    total: number | null
    updatedAt: string | null
}

interface Ipo {
    symbol: string
    name: string
    type: 'Mainboard' | 'SME'
    status: 'open' | 'upcoming' | 'closed'
    openDate: string | null
    closeDate: string | null
    listingDate: string | null
    listed: boolean
    priceBand: { min: number; max: number } | null
    issuePrice: number | null
    lotSize: number | null
    minInvestment: number | null
    issueSizeCr: number | null
    faceValue: string | null
    issueType: string | null
    leadManagers: string | null
    registrar: string | null
    rhpUrl: string | null
    subscription: Subscription | null
    demand: { level: string; tone: 'positive' | 'neutral' | 'negative' } | null
    listing: { listingOpen: number; listingGainPercent: number; currentPrice: number; currentReturnPercent: number } | null
}

interface Board {
    ipos: Ipo[]
    counts: { open: number; upcoming: number; closed: number }
    closedWindowDays: number
    lastUpdated: string
    stale?: boolean
}

type StatusFilter = 'all' | 'open' | 'upcoming' | 'closed'
type TypeFilter = 'all' | 'Mainboard' | 'SME'

const formatDate = (key: string | null) =>
    key ? new Date(`${key}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'
const formatINR = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')}`)
const formatTimes = (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}x`)

const STATUS_STYLE: Record<Ipo['status'], string> = {
    open: 'bg-green-500/10 text-green-600',
    upcoming: 'bg-brand-600/10 text-brand-600 dark:text-brand-300',
    closed: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'
}
const DEMAND_STYLE = { positive: 'text-green-600', neutral: 'text-amber-600', negative: 'text-red-500' }

function SubscriptionBars({ sub }: { sub: Subscription }) {
    const rows = [
        { label: 'QIB', value: sub.qib },
        { label: 'NII (HNI)', value: sub.nii },
        { label: 'Retail', value: sub.retail },
        { label: 'Employee', value: sub.employee }
    ].filter(r => r.value != null)
    const max = Math.max(...rows.map(r => r.value as number), 1)
    return (
        <div className="space-y-1.5">
            {rows.map(r => (
                <div key={r.label} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-bold text-zinc-500 shrink-0">{r.label}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        {/* Log scale so 300x and 3x are both visible. */}
                        <div className="h-full bg-brand-600 rounded-full"
                            style={{ width: `${Math.max(4, (Math.log10((r.value as number) + 1) / Math.log10(max + 1)) * 100)}%` }} />
                    </div>
                    <span className="w-16 text-right font-semibold text-zinc-800 dark:text-white">{formatTimes(r.value)}</span>
                </div>
            ))}
        </div>
    )
}

export default function IPOs() {
    const [board, setBoard] = useState<Board | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

    const load = async (refresh = false) => {
        setLoading(true)
        setError(null)
        try {
            const res = await getIpoBoard(refresh)
            if (res.status === 'success') setBoard(res.data)
            else setError(res.message || 'IPO data unavailable')
        } catch {
            setError('IPO data is temporarily unavailable from NSE. Please try again shortly.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => (board?.ipos || []).filter(ipo =>
        (statusFilter === 'all' || ipo.status === statusFilter) && (typeFilter === 'all' || ipo.type === typeFilter)
    ), [board, statusFilter, typeFilter])

    const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All IPOs', count: board?.ipos.length ?? 0 },
        { key: 'open', label: 'Open Now', count: board?.counts.open ?? 0 },
        { key: 'upcoming', label: 'Upcoming', count: board?.counts.upcoming ?? 0 },
        { key: 'closed', label: `Closed (${board?.closedWindowDays ?? 30}d)`, count: board?.counts.closed ?? 0 }
    ]

    return (
        <Page>
            <PageHeader
                title="IPOs"
                description={<>Official NSE data{board?.lastUpdated && ` · updated ${new Date(board.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}{board?.stale && ' · showing last saved snapshot'}</>}
                actions={<Button size="sm" onClick={() => load(true)} disabled={loading}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>}
            />
            <div className="space-y-4">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statusTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`text-left p-6 rounded-xl shadow-sm border transition-all text-sm font-semibold ${statusFilter === tab.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-brand-600/50'}`}
                        >
                            <div className="text-3xl mb-2">{loading && !board ? '…' : tab.count}</div>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    {(['all', 'Mainboard', 'SME'] as TypeFilter[]).map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${typeFilter === t ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-700'}`}>
                            {t === 'all' ? 'All types' : t}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading && !board ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 animate-pulse">
                                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-4" />
                                <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded" />
                            </div>
                        ))
                    ) : error && !board ? (
                        <div className="col-span-full py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-300 font-bold">{error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center text-center">
                            <Calendar className="h-12 w-12 text-zinc-300 mb-4" />
                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">No IPOs here right now</h3>
                            <p className="text-zinc-500 font-medium">Try another filter.</p>
                        </div>
                    ) : filtered.map(ipo => (
                        <article key={ipo.symbol} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-brand-600/30 transition-colors">
                            <div className="flex justify-between items-start gap-4 mb-6">
                                <div className="min-w-0">
                                    <h3 className="text-xl font-semibold text-zinc-800 dark:text-white leading-tight">{ipo.name}</h3>
                                    <p className="text-xs font-bold text-zinc-400 mt-1">
                                        {ipo.symbol} · {ipo.type}{ipo.issueType ? ` · ${ipo.issueType}` : ''}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLE[ipo.status]}`}>
                                        {ipo.status}
                                    </span>
                                    {ipo.demand && (
                                        <span className={`text-[11px] font-semibold ${DEMAND_STYLE[ipo.demand.tone]}`}>
                                            {ipo.demand.level} demand
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 bg-zinc-50/60 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 mb-1">Price Band</p>
                                    <p className="font-semibold text-zinc-800 dark:text-white text-sm">
                                        {ipo.priceBand ? (ipo.priceBand.min === ipo.priceBand.max ? formatINR(ipo.priceBand.max) : `₹${ipo.priceBand.min}–${ipo.priceBand.max}`) : 'TBA'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 mb-1">Lot Size</p>
                                    <p className="font-semibold text-zinc-800 dark:text-white text-sm">{ipo.lotSize ? `${ipo.lotSize} shares` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 mb-1">Min. Investment</p>
                                    <p className="font-semibold text-zinc-800 dark:text-white text-sm">{formatINR(ipo.minInvestment)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 mb-1">Issue Size</p>
                                    <p className="font-semibold text-zinc-800 dark:text-white text-sm">
                                        {ipo.issueSizeCr != null ? `₹${ipo.issueSizeCr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr` : '—'}
                                    </p>
                                </div>
                            </div>

                            {ipo.subscription ? (
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> Subscribed {formatTimes(ipo.subscription.total)} overall
                                        </p>
                                        {ipo.subscription.updatedAt && <span className="text-[11px] font-bold text-zinc-400">as of {ipo.subscription.updatedAt}</span>}
                                    </div>
                                    <SubscriptionBars sub={ipo.subscription} />
                                </div>
                            ) : (
                                <p className="mb-5 text-xs font-bold text-zinc-400">
                                    {ipo.status === 'upcoming' ? `Bidding opens ${formatDate(ipo.openDate)}` : 'Category-wise subscription not published by NSE for this issue'}
                                </p>
                            )}

                            {ipo.listing && (
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    {[
                                        { label: 'Listing gain', value: ipo.listing.listingGainPercent, sub: `Opened at ${formatINR(ipo.listing.listingOpen)}` },
                                        { label: 'Return now', value: ipo.listing.currentReturnPercent, sub: `Trading at ${formatINR(ipo.listing.currentPrice)}` }
                                    ].map(item => (
                                        <div key={item.label} className={`p-3 rounded-xl ${item.value >= 0 ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                                            <p className="text-[11px] font-bold text-zinc-500">{item.label}</p>
                                            <p className={`font-semibold flex items-center gap-1 ${item.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {item.value >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
                                            </p>
                                            <p className="text-[11px] font-bold text-zinc-400">{item.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs font-bold text-zinc-500 flex flex-wrap justify-between items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 rounded-xl">
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(ipo.openDate)} – {formatDate(ipo.closeDate)}</span>
                                <span className="flex items-center gap-3">
                                    {ipo.listingDate && <span>Listing: {formatDate(ipo.listingDate)}</span>}
                                    {ipo.rhpUrl && (
                                        <a href={ipo.rhpUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline">
                                            <FileText className="w-3.5 h-3.5" /> RHP
                                        </a>
                                    )}
                                </span>
                            </div>
                            {(ipo.leadManagers || ipo.registrar) && (
                                <p className="mt-3 text-[11px] text-zinc-400 font-medium truncate">
                                    {ipo.leadManagers && <>Lead managers: {ipo.leadManagers.split(/\n|,/)[0]}{ipo.leadManagers.includes(',') ? ' & others' : ''}</>}
                                    {ipo.registrar && <> · Registrar: {ipo.registrar}</>}
                                </p>
                            )}
                        </article>
                    ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                        <p className="text-amber-700/80 dark:text-amber-300/80 text-sm font-medium leading-relaxed">
                            Issue details and subscription figures are from NSE; listing performance uses NSE prices via Yahoo Finance.
                            "Demand" is derived only from subscription multiples (QIB demand weighs most) and is not a recommendation.
                            Read the RHP and consult a SEBI-registered advisor before applying.
                        </p>
                    </div>
                </div>
            </div>
        </Page>
    )
}

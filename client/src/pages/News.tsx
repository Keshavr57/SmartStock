import { useState, useEffect, useMemo } from "react"
import { Page, PageHeader } from '@/components/ds'
import { getTrendingNews, getNewsAnalytics } from "../lib/api"
import { ExternalLink, Clock, Newspaper, RefreshCw, Search, FlaskConical, ChevronDown, ChevronUp } from "lucide-react"

interface HistoryStats {
    basis: 'event' | 'sentiment'
    n: number
    meanAr1: number
    meanArNext: number | null
    meanCar3: number
    meanAbsAr1: number
    tStat: number | null
    hitRate: number | null
    upShare: number
}

interface NewsItem {
    id: string
    title: string
    summary: string
    link: string
    source: string
    publishedAt: string
    symbols: string[]
    scope: 'company' | 'market'
    sentiment: 'positive' | 'negative' | 'neutral'
    sentimentScore: number
    confidence: number
    event: { type: string; label: string; direction: number; macro: boolean } | null
    evidence: { term: string; weight: number }[]
    impact: { level: 'high' | 'medium' | 'low'; expectedMovePercent: number; history: HistoryStats | null }
    reaction: { ar1: number; car3: number; reactionDate: string } | null
}

interface Accuracy { evaluated: number; accuracy: number | null; baseline: number | null }
interface Analytics {
    sampleSize: number
    model: { sameSession: Accuracy; nextSession: Accuracy } | null
    events: ({ type: string; label: string; n: number; meanAr1: number; meanArNext: number | null; meanCar3: number; tStat: number | null; hitRate: number | null })[]
    methodology: string
}

const SENTIMENT_STYLE = {
    positive: 'bg-green-500 text-white',
    negative: 'bg-red-500 text-white',
    neutral: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
}
const IMPACT_STYLE = {
    high: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    low: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
}
const signed = (n: number | null | undefined, digits = 2) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`)
const tone = (n: number | null | undefined) => (n == null ? '' : n >= 0 ? 'text-green-600' : 'text-red-500')

const timeAgo = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 60) return `${Math.max(mins, 1)}m ago`
    if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function HistoryLine({ history, event }: { history: HistoryStats | null; event: NewsItem['event'] }) {
    if (!history) {
        return <p className="text-[11px] font-bold text-zinc-400">Not enough similar past news yet to measure an effect.</p>
    }
    const what = history.basis === 'event' && event ? `"${event.label}" news` : 'news with this tone'
    const significant = history.tStat != null && Math.abs(history.tStat) >= 2
    return (
        <div className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">Past effect of {what}</span> (n={history.n}
            {significant ? ', statistically significant' : ', not significant'}):{' '}
            same day <span className={`font-semibold ${tone(history.meanAr1)}`}>{signed(history.meanAr1)}</span> vs NIFTY
            {history.meanArNext != null && <>, next day <span className={`font-semibold ${tone(history.meanArNext)}`}>{signed(history.meanArNext)}</span></>}
            {history.hitRate != null && <> · moved in the tagged direction {history.hitRate.toFixed(0)}% of the time</>}
        </div>
    )
}

function ModelPanel({ analytics }: { analytics: Analytics }) {
    const [open, setOpen] = useState(false)
    const same = analytics.model?.sameSession
    const next = analytics.model?.nextSession
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                    <FlaskConical className="w-6 h-6 text-brand-600 shrink-0 mt-1" />
                    <div>
                        <h2 className="font-semibold text-zinc-800 dark:text-white">How accurate are these tags?</h2>
                        <p className="text-xs font-medium text-zinc-500 max-w-xl mt-1">
                            Every headline is stored and its real price reaction measured afterwards (stock return minus NIFTY 50 return).
                            Backtested on {analytics.sampleSize.toLocaleString('en-IN')} headlines.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-xl px-4 py-3">
                        <p className="text-[11px] font-semibold text-zinc-500">Tag vs same-day move</p>
                        <p className="text-2xl font-semibold text-green-600">{same?.accuracy != null ? `${same.accuracy}%` : '—'}</p>
                        <p className="text-[11px] font-bold text-zinc-400">baseline {same?.baseline ?? '—'}% · n={same?.evaluated ?? 0}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl px-4 py-3">
                        <p className="text-[11px] font-semibold text-zinc-500">Predicts next day</p>
                        <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">{next?.accuracy != null ? `${next.accuracy}%` : '—'}</p>
                        <p className="text-[11px] font-bold text-zinc-400">baseline {next?.baseline ?? '—'}% · n={next?.evaluated ?? 0}</p>
                    </div>
                </div>
            </div>
            <p className="text-[11px] font-medium text-zinc-500 mt-4">
                Reading this honestly: the tags describe how the market reacts to a headline well, but they do not give an edge
                for the following day; news is largely priced in within the same session, consistent with efficient markets.
            </p>
            <button onClick={() => setOpen(!open)} className="mt-3 text-xs font-semibold text-brand-600 flex items-center gap-1">
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Event-type study
            </button>
            {open && (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-[11px] text-zinc-400">
                                <th className="py-2 pr-4">Event type</th><th className="py-2 pr-4 text-right">Headlines</th>
                                <th className="py-2 pr-4 text-right">Same day</th><th className="py-2 pr-4 text-right">Next day</th>
                                <th className="py-2 pr-4 text-right">3 days</th><th className="py-2 pr-4 text-right">t-stat</th>
                                <th className="py-2 text-right">Hit rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                            {analytics.events.filter(e => e.n >= 5).map(e => (
                                <tr key={e.type} className="font-bold text-zinc-700 dark:text-zinc-200">
                                    <td className="py-2 pr-4">{e.label}</td>
                                    <td className="py-2 pr-4 text-right">{e.n}</td>
                                    <td className={`py-2 pr-4 text-right ${tone(e.meanAr1)}`}>{signed(e.meanAr1)}</td>
                                    <td className={`py-2 pr-4 text-right ${tone(e.meanArNext)}`}>{signed(e.meanArNext)}</td>
                                    <td className={`py-2 pr-4 text-right ${tone(e.meanCar3)}`}>{signed(e.meanCar3)}</td>
                                    <td className={`py-2 pr-4 text-right ${e.tStat != null && Math.abs(e.tStat) >= 2 ? 'text-brand-600' : 'text-zinc-400'}`}>{e.tStat?.toFixed(2) ?? '—'}</td>
                                    <td className="py-2 text-right">{e.hitRate != null ? `${e.hitRate.toFixed(0)}%` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-[11px] text-zinc-400 mt-3">{analytics.methodology} |t| ≥ 2 (highlighted) means the average move is unlikely to be chance.</p>
                </div>
            )}
        </div>
    )
}

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sentimentFilter, setSentimentFilter] = useState<'all' | NewsItem['sentiment']>('all')
    const [impactFilter, setImpactFilter] = useState<'all' | NewsItem['impact']['level']>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const load = async () => {
        setError(null)
        try {
            const [newsRes, analyticsRes] = await Promise.allSettled([getTrendingNews(), getNewsAnalytics()])
            if (newsRes.status === 'fulfilled' && newsRes.value.status === 'success') setNews(newsRes.value.data)
            else setError('News feeds are temporarily unavailable.')
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.status === 'success') setAnalytics(analyticsRes.value.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await load()
        setRefreshing(false)
    }

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return news.filter(item =>
            (sentimentFilter === 'all' || item.sentiment === sentimentFilter) &&
            (impactFilter === 'all' || item.impact.level === impactFilter) &&
            (!q || item.title.toLowerCase().includes(q) || item.source.toLowerCase().includes(q) ||
                item.symbols.some(s => s.toLowerCase().includes(q)))
        )
    }, [news, sentimentFilter, impactFilter, searchQuery])

    const chip = (active: boolean) =>
        `px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${active ? 'bg-brand-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-brand-600/50'}`

    return (
        <Page>
            <PageHeader title="News" description="Indian market headlines tagged for sentiment and event type, with how similar news has moved prices before." />
            <div className="space-y-4">

                {analytics && analytics.sampleSize > 0 && <ModelPanel analytics={analytics} />}

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search headline, source or ticker…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-600 font-medium"
                        />
                    </div>
                    <button onClick={handleRefresh} disabled={refreshing}
                        className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-600 hover:border-brand-600 hover:text-brand-600 flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['all', 'positive', 'negative', 'neutral'] as const).map(s => (
                        <button key={s} onClick={() => setSentimentFilter(s)} className={chip(sentimentFilter === s)}>{s === 'all' ? 'All tones' : s}</button>
                    ))}
                    <span className="w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
                    {(['all', 'high', 'medium', 'low'] as const).map(i => (
                        <button key={i} onClick={() => setImpactFilter(i)} className={chip(impactFilter === i)}>{i === 'all' ? 'Any impact' : `${i} impact`}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 animate-pulse">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4" />
                                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded mb-3" />
                                <div className="h-16 bg-zinc-100 dark:bg-zinc-900 rounded mt-6" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center text-center">
                        <Newspaper className="h-14 w-14 text-zinc-300 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">{error || 'No news matches these filters'}</h3>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(item => (
                            <article key={item.id} className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 hover: transition-all flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full truncate max-w-[60%]">{item.source}</span>
                                    <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(item.publishedAt)}</span>
                                </div>

                                <div className="flex gap-2 mb-3 flex-wrap items-center">
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${SENTIMENT_STYLE[item.sentiment]}`}>
                                        {item.sentiment} {item.sentimentScore >= 0 ? '+' : ''}{item.sentimentScore.toFixed(2)}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${IMPACT_STYLE[item.impact.level]}`}>
                                        {item.impact.level} impact · ~{item.impact.expectedMovePercent.toFixed(1)}%
                                    </span>
                                    {item.event && (
                                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                            {item.event.label}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-base font-semibold text-zinc-800 dark:text-white mb-3 leading-snug">{item.title}</h3>

                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {item.symbols.length > 0
                                        ? item.symbols.map(s => <span key={s} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-600/10 text-brand-600 dark:text-brand-300">{s.replace('.NS', '')}</span>)
                                        : <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">Market-wide</span>}
                                    <span className="text-[11px] font-bold text-zinc-400 ml-auto">confidence {(item.confidence * 100).toFixed(0)}%</span>
                                </div>

                                {item.evidence.length > 0 && (
                                    <p className="text-[11px] text-zinc-400 mb-3">
                                        Signals: {item.evidence.slice(0, 5).map((e, i) => (
                                            <span key={i} className={e.weight >= 0 ? 'text-green-600' : 'text-red-500'}>{i > 0 && ', '}{e.term}</span>
                                        ))}
                                    </p>
                                )}

                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3 mb-4">
                                    <HistoryLine history={item.impact.history} event={item.event} />
                                    {item.reaction && (
                                        <p className="text-[11px] font-bold mt-1.5 text-zinc-600 dark:text-zinc-300">
                                            Actual reaction ({item.reaction.reactionDate}): <span className={tone(item.reaction.ar1)}>{signed(item.reaction.ar1)}</span> that day,{' '}
                                            <span className={tone(item.reaction.car3)}>{signed(item.reaction.car3)}</span> over 3 days vs NIFTY
                                        </p>
                                    )}
                                </div>

                                <a href={item.link} target="_blank" rel="noopener noreferrer"
                                    className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-300">
                                    Read article <ExternalLink className="w-4 h-4" />
                                </a>
                            </article>
                        ))}
                    </div>
                )}

                <p className="text-xs text-zinc-400 font-medium">
                    Headlines from Economic Times, Mint, Business Standard, Bloomberg and Google News. Tags are produced by SmartStock's
                    finance-lexicon + event model; past effects are measured, not predicted. Educational use only.
                </p>
            </div>
        </Page>
    )
}

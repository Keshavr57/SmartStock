import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    TrendingUp, CandlestickChart, LineChart, Newspaper, Rocket, Sparkles, Wallet, ArrowRight, Moon, Sun, ChevronDown
} from 'lucide-react'
import { api } from '@/lib/api'
import { fetchMarketStatus, fetchQuotes, price, signedPct, ticker, trendClass, usePolling } from '@/lib/market'
import type { MarketStatus, Quote } from '@/lib/market'
import { useTheme } from '@/lib/theme'
import { Sparkline } from '@/components/ds'

const PREVIEW_STOCKS = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS']

const FEATURES = [
    { icon: Wallet, title: 'Paper trading with ₹1,00,000', body: 'Buy and sell any NSE stock at real prices with virtual cash. Track fills, charges, realised and day P&L like a real broker account.' },
    { icon: CandlestickChart, title: 'A real trading screen', body: 'Candlestick charts with volume, a live watchlist and an order ticket that shows charges before you place the trade.' },
    { icon: LineChart, title: 'Research any of 2,600+ stocks', body: 'Valuation, profitability, ownership, analyst targets and returns for every NSE-listed company, side by side in Compare.' },
    { icon: Newspaper, title: 'News with measured impact', body: 'Headlines tagged for sentiment and event type, with how similar news has actually moved prices in the past.' },
    { icon: Rocket, title: 'IPO tracker from NSE', body: 'Open, upcoming and recently listed IPOs with lot size, subscription by investor category and listing-day returns.' },
    { icon: Sparkles, title: 'AI advisor in Hinglish', body: 'Ask about a stock, an IPO or a concept and get a plain-language answer. Educational, never a tip.' }
]

const STEPS = [
    { title: 'Create a free account', body: 'Sign up with email or Google. You start with ₹1,00,000 of virtual cash.' },
    { title: 'Research and place trades', body: 'Look up a company, read the news, then buy or sell at the live NSE price.' },
    { title: 'Learn from the results', body: 'Watch your P&L, review your orders and work through the lessons as you go.' }
]

const FAQ = [
    { q: 'Is any real money involved?', a: 'No. SmartStock is a paper-trading platform. All cash and trades are virtual; nothing is ever sent to an exchange or a broker.' },
    { q: 'Where does the market data come from?', a: 'Prices, charts and fundamentals come from NSE via Yahoo Finance; IPO data comes from NSE\'s public APIs; news comes from Indian business publications. Quotes may be slightly delayed.' },
    { q: 'Can I trade when the market is closed?', a: 'Yes. Outside NSE hours (9:15 AM – 3:30 PM IST, weekdays) orders fill at the last traded price, so you can practise any time.' },
    { q: 'Is the AI advisor giving investment advice?', a: 'No. Its answers are educational. Always do your own research and consult a SEBI-registered adviser before investing real money.' }
]

interface Accuracy { accuracy: number | null; baseline: number | null; evaluated: number }

export default function Landing({ onLogin: _onLogin }: { onLogin: () => void }) {
    const { isDark, toggle } = useTheme()
    const { data: market } = usePolling<MarketStatus>(fetchMarketStatus, 120000)
    const { data: quotes } = usePolling<Quote[]>(() => fetchQuotes(['^NSEI', ...PREVIEW_STOCKS]), 60000)
    const [nifty, setNifty] = useState<number[]>([])
    const [model, setModel] = useState<{ sampleSize: number; sameSession: Accuracy } | null>(null)

    useEffect(() => {
        api.get('/trading/chart/%5ENSEI', { params: { timeframe: '1D' } })
            .then(res => setNifty((res.data?.data?.candles ?? []).map((c: { close: number }) => c.close)))
            .catch(() => {})
        api.get('/news/analytics')
            .then(res => {
                const d = res.data?.data
                if (d?.model?.sameSession) setModel({ sampleSize: d.sampleSize, sameSession: d.model.sameSession })
            })
            .catch(() => {})
    }, [])

    const index = quotes?.find(q => q.symbol === '^NSEI')

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200/70 dark:border-zinc-800">
                <div className="mx-auto max-w-6xl px-5 h-14 flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><TrendingUp className="w-4 h-4" strokeWidth={2.5} /></span>
                        <span className="font-semibold">SmartStock</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
                        <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Features</a>
                        <a href="#how" className="hover:text-zinc-900 dark:hover:text-zinc-100">How it works</a>
                        <a href="#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">FAQ</a>
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        <button onClick={toggle} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Toggle theme">
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <Link to="/login" className="h-9 px-3 inline-flex items-center rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Log in</Link>
                        <Link to="/signup" className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white">Sign up free</Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
                    <div>
                        <p className="inline-flex items-center gap-2 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-full">
                            <span className={`w-1.5 h-1.5 rounded-full ${market?.isOpen ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            {market ? (market.isOpen ? 'NSE is open now' : market.status) : 'Live NSE data'}
                        </p>
                        <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
                            Learn to invest in Indian stocks with real prices and zero risk.
                        </h1>
                        <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
                            SmartStock gives you ₹1,00,000 of virtual cash, a real trading screen and research tools for every NSE stock,
                            so you can practise before you put real money in.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link to="/signup" className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium">
                                Create free account <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/login" className="h-11 px-5 inline-flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                Log in
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-zinc-500">No card, no broker account, no real money.</p>
                    </div>

                    {/* Live market preview: real data, not a mock-up */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs text-zinc-500">NIFTY 50</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums">{price(index?.price)}</p>
                                    <p className={`text-sm tabular-nums ${trendClass(index?.changePercent)}`}>{signedPct(index?.changePercent)} today</p>
                                </div>
                                <Sparkline values={nifty} width={180} height={64} />
                            </div>
                        </div>
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {PREVIEW_STOCKS.map(s => {
                                const q = quotes?.find(x => x.symbol === s)
                                return (
                                    <li key={s} className="flex items-center justify-between px-5 py-3">
                                        <span>
                                            <span className="block text-sm font-medium">{ticker(s)}</span>
                                            <span className="block text-xs text-zinc-500 truncate max-w-[220px]">{q?.name ?? ''}</span>
                                        </span>
                                        <span className="text-right tabular-nums">
                                            <span className="block text-sm">{price(q?.price)}</span>
                                            <span className={`block text-xs ${trendClass(q?.changePercent)}`}>{signedPct(q?.changePercent)}</span>
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                        <p className="px-5 py-2.5 text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40">Live from NSE via Yahoo Finance</p>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                    <div className="mx-auto max-w-6xl px-5 py-20">
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight max-w-2xl">Everything you need to learn the market, in one place.</h2>
                        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            {FEATURES.map(f => (
                                <div key={f.title} className="bg-white dark:bg-zinc-900 p-6">
                                    <f.icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
                                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section id="how" className="mx-auto max-w-6xl px-5 py-20 grid lg:grid-cols-[1fr_1.4fr] gap-12">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h2>
                        <p className="mt-3 text-zinc-600 dark:text-zinc-400">Three steps from sign-up to your first trade.</p>
                    </div>
                    <ol className="space-y-6">
                        {STEPS.map((s, i) => (
                            <li key={s.title} className="flex gap-4">
                                <span className="w-8 h-8 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-sm font-medium tabular-nums">{i + 1}</span>
                                <div>
                                    <h3 className="font-semibold">{s.title}</h3>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Transparency: real, live numbers from the news model */}
                {model && model.sameSession.accuracy != null && (
                    <section className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white">
                        <div className="mx-auto max-w-6xl px-5 py-16 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight">We measure our own tools, and show you the numbers.</h2>
                                <p className="mt-3 text-zinc-400 leading-relaxed">
                                    Every news headline is stored and its real price reaction measured afterwards. Our sentiment tags match the
                                    direction of the same-day move {model.sameSession.accuracy}% of the time, against a {model.sameSession.baseline}% baseline,
                                    and we tell you plainly that they don't predict the next day.
                                </p>
                            </div>
                            <dl className="grid grid-cols-2 gap-6">
                                <div><dt className="text-xs text-zinc-500">Headlines backtested</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{model.sampleSize.toLocaleString('en-IN')}</dd></div>
                                <div><dt className="text-xs text-zinc-500">Tag accuracy (same day)</dt><dd className="mt-1 text-3xl font-semibold tabular-nums">{model.sameSession.accuracy}%</dd></div>
                            </dl>
                        </div>
                    </section>
                )}

                {/* FAQ */}
                <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Questions</h2>
                    <div className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
                        {FAQ.map(f => (
                            <details key={f.q} className="group py-4">
                                <summary className="flex items-center justify-between cursor-pointer list-none font-medium">
                                    {f.q}
                                    <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
                            </details>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <Link to="/signup" className="h-11 px-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium">
                            Start practising <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-zinc-200 dark:border-zinc-800">
                <div className="mx-auto max-w-6xl px-5 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
                    <span>© {new Date().getFullYear()} SmartStock · An educational paper-trading project</span>
                    <span>Not investment advice. Market data may be delayed.</span>
                </div>
            </footer>
        </div>
    )
}

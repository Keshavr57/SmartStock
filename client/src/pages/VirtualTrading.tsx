import { useSearchParams } from 'react-router-dom'
import PriceChart from '../components/trading/terminal/PriceChart'
import OrderTicket from '../components/trading/terminal/OrderTicket'
import WatchlistPanel from '../components/trading/terminal/WatchlistPanel'
import BlotterPanel from '../components/trading/terminal/BlotterPanel'
import {
    fetchAccount, fetchMarketStatus, fetchOrders, fetchPositions, fetchQuote,
    price, rupees, signedPct, signedRupees, ticker, trendClass, usePolling, volume
} from '@/lib/market'
import type { AccountSummary, MarketStatus, Order, Position, Quote } from '@/lib/market'

// Where `value` sits between `low` and `high`, as a percentage for range bars.
const rangePosition = (value?: number | null, low?: number | null, high?: number | null) =>
    value != null && low != null && high != null && high > low ? Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100)) : null

function RangeBar({ label, low, high, value }: { label: string; low?: number | null; high?: number | null; value?: number | null }) {
    const pos = rangePosition(value, low, high)
    return (
        <div className="min-w-0">
            <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
            <div className="flex items-center gap-2 text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                <span>{price(low)}</span>
                <div className="relative flex-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 min-w-[48px]">
                    {pos != null && <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" style={{ left: `${pos}%` }} />}
                </div>
                <span>{price(high)}</span>
            </div>
        </div>
    )
}

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] text-zinc-500">{label}</p>
            <p className={`text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100 truncate ${className}`}>{value}</p>
        </div>
    )
}

const panel = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl'

export default function VirtualTrading() {
    const [params, setParams] = useSearchParams()
    const symbol = (params.get('symbol') || 'RELIANCE.NS').toUpperCase()
    const initialSide = params.get('side') === 'SELL' ? 'SELL' : 'BUY'
    const selectSymbol = (s: string) => setParams({ symbol: s }, { replace: true })

    const { data: market } = usePolling<MarketStatus>(fetchMarketStatus, 60000)
    const live = Boolean(market?.isOpen)
    const { data: quote, refresh: refreshQuote } = usePolling<Quote | null>(() => fetchQuote(symbol), live ? 10000 : 60000, [symbol, live])
    const { data: account, refresh: refreshAccount } = usePolling<AccountSummary>(fetchAccount, 30000)
    const { data: positions, refresh: refreshPositions } = usePolling<Position[]>(fetchPositions, 30000)
    const { data: orders, refresh: refreshOrders } = usePolling<Order[]>(fetchOrders, 60000)

    const position = positions?.find(p => p.symbol === symbol) ?? null
    const onFilled = () => {
        refreshAccount()
        refreshPositions()
        refreshOrders()
        refreshQuote()
    }

    const quoteForSymbol = quote?.symbol === symbol ? quote : null
    const chg = quoteForSymbol?.change ?? null

    const watchlist = <WatchlistPanel selected={symbol} onSelect={selectSymbol} live={live} />

    return (
        <section className="p-3 md:p-4 space-y-3" id="virtual-trading">
            {/* Account summary (market status and indices live in the top bar) */}
            <div className={`${panel} flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3`}>
                <Stat label="Account value" value={rupees(account?.totalValue)} />
                <Stat label="Cash" value={rupees(account?.availableBalance)} />
                <Stat label="Invested" value={rupees(account?.totalInvested)} />
                <Stat label="Today's P&L" value={account ? signedRupees(account.dayPnL) : '—'} className={trendClass(account?.dayPnL)} />
                <Stat label="Total P&L" value={account ? `${signedRupees(account.totalPnL)} (${signedPct(account.totalPnLPercent)})` : '—'} className={trendClass(account?.totalPnL)} />
                {market && !market.isOpen && (
                    <span className="ml-auto text-xs text-zinc-500">{market.status} · paper orders fill at the last traded price</span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[260px_minmax(0,1fr)_320px] gap-3 items-start">
                {/* Watchlist column on wide screens; below 2xl it moves into the bottom panel */}
                <aside className={`${panel} hidden 2xl:flex flex-col overflow-hidden sticky top-[4.25rem] h-[calc(100vh-5.25rem)]`}>
                    {watchlist}
                </aside>

                {/* Instrument + chart + blotter */}
                <div className="space-y-3 min-w-0">
                    <div className={`${panel} overflow-hidden`}>
                        <div className="px-4 pt-4 pb-3 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{ticker(symbol)}</h1>
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">NSE</span>
                                </div>
                                <p className="text-xs text-zinc-500 truncate">{quoteForSymbol?.name ?? ' '}</p>
                            </div>
                            <div className="flex items-baseline gap-3 tabular-nums">
                                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{rupees(quoteForSymbol?.price)}</span>
                                <span className={`text-sm font-medium ${trendClass(chg)}`}>
                                    {chg == null ? '—' : `${signedRupees(chg)} (${signedPct(quoteForSymbol?.changePercent)})`}
                                </span>
                            </div>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-2 min-[1400px]:grid-cols-4 gap-x-6 gap-y-3 border-b border-zinc-200 dark:border-zinc-800">
                            <Stat label="Prev. close" value={price(quoteForSymbol?.previousClose)} />
                            <Stat label="Volume" value={volume(quoteForSymbol?.volume)} />
                            <RangeBar label="Day range" low={quoteForSymbol?.dayLow} high={quoteForSymbol?.dayHigh} value={quoteForSymbol?.price} />
                            <RangeBar label="52-week range" low={quoteForSymbol?.fiftyTwoWeekLow} high={quoteForSymbol?.fiftyTwoWeekHigh} value={quoteForSymbol?.price} />
                        </div>
                        <div className="h-[460px] md:h-[520px]">
                            <PriceChart symbol={symbol} previousClose={quoteForSymbol?.previousClose} live={live} />
                        </div>
                    </div>

                    <div className={`${panel} overflow-hidden`}>
                        <BlotterPanel
                            positions={positions}
                            orders={orders}
                            onSelect={selectSymbol}
                            extraTab={{ label: 'Watchlist', content: watchlist }}
                        />
                    </div>
                </div>

                {/* Order ticket */}
                <aside className={`${panel} lg:sticky lg:top-[4.25rem]`}>
                    <OrderTicket
                        key={`${symbol}-${initialSide}`}
                        initialSide={initialSide}
                        symbol={symbol}
                        quote={quoteForSymbol}
                        position={position}
                        cash={account?.availableBalance ?? null}
                        market={market}
                        onFilled={onFilled}
                    />
                </aside>
            </div>

            <p className="text-[11px] text-zinc-400 px-1">
                Paper trading with ₹1,00,000 virtual cash. Prices from NSE via Yahoo Finance; delayed quotes may differ slightly from exchange terminals.
                Charts by <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">TradingView</a>.
            </p>
        </section>
    )
}

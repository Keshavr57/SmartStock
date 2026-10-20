import { useEffect, useState } from 'react'
import { Minus, Plus, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import type { Quote, Position, MarketStatus } from '@/lib/market'
import { rupees, signedRupees, signedPct, ticker, trendClass } from '@/lib/market'

const FEE_RATE = 0.001 // mirrors the server's 0.1% brokerage
const QUICK_QTY = [1, 5, 10, 25]

interface OrderTicketProps {
    symbol: string
    quote: Quote | null
    position: Position | null
    cash: number | null
    market: MarketStatus | null
    onFilled: () => void
    initialSide?: 'BUY' | 'SELL'
}

type Result = { kind: 'success' | 'error'; text: string }

export default function OrderTicket({ symbol, quote, position, cash, market, onFilled, initialSide = 'BUY' }: OrderTicketProps) {
    const [side, setSide] = useState<'BUY' | 'SELL'>(initialSide)
    const [qty, setQty] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<Result | null>(null)

    // Reset the ticket when switching instruments.
    useEffect(() => {
        setQty(1)
        setResult(null)
    }, [symbol])

    // Keyboard shortcuts, as on broker terminals: B = buy, S = sell (ignored while typing).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return
            if (e.key === 'b' || e.key === 'B') setSide('BUY')
            if (e.key === 's' || e.key === 'S') setSide('SELL')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const ltp = quote?.price ?? null
    const held = position?.quantity ?? 0
    const orderValue = ltp ? ltp * qty : 0
    const fees = orderValue * FEE_RATE
    const total = side === 'BUY' ? orderValue + fees : orderValue - fees
    const maxQty = side === 'BUY'
        ? (ltp && cash ? Math.floor(cash / (ltp * (1 + FEE_RATE))) : 0)
        : held

    const problem = !ltp ? 'Live price unavailable'
        : side === 'BUY' && cash != null && total > cash ? `Needs ${rupees(total)}, you have ${rupees(cash)}`
        : side === 'SELL' && qty > held ? (held ? `You hold only ${held} shares` : `You don't hold ${ticker(symbol)}`)
        : null

    const setQuantity = (n: number) => setQty(Math.max(1, Math.min(100000, Math.floor(n) || 1)))

    const submit = async () => {
        if (problem) return
        setSubmitting(true)
        setResult(null)
        try {
            const res = await api.post('/trading/order', { symbol, side, quantity: qty, orderType: 'MARKET' })
            const tx = res.data.data.transaction
            setResult({
                kind: 'success',
                text: `${side === 'BUY' ? 'Bought' : 'Sold'} ${tx.quantity} ${ticker(symbol)} @ ${rupees(tx.price)}${tx.realizedPnL != null ? ` · P&L ${signedRupees(tx.realizedPnL)}` : ''}`
            })
            onFilled()
        } catch (error) {
            const message = isAxiosError(error) ? error.response?.data?.message : null
            setResult({ kind: 'error', text: message || 'Order failed. Please try again.' })
        } finally {
            setSubmitting(false)
        }
    }

    const buy = side === 'BUY'
    const accent = buy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-2 p-1 m-3 mb-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                {(['BUY', 'SELL'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setSide(s)}
                        className={`py-2 text-sm font-semibold rounded-md transition-colors ${side === s
                            ? (s === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm')
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
                    >
                        {s === 'BUY' ? 'Buy' : 'Sell'}
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4">
                <div className="flex items-baseline justify-between">
                    <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{ticker(symbol)}</p>
                        <p className="text-xs text-zinc-500">NSE · Delivery</p>
                    </div>
                    <div className="text-right tabular-nums">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{rupees(ltp)}</p>
                        <p className={`text-xs ${trendClass(quote?.changePercent)}`}>{signedPct(quote?.changePercent)}</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="order-qty" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Quantity</label>
                        <button
                            onClick={() => maxQty > 0 && setQuantity(maxQty)}
                            disabled={maxQty < 1}
                            className="text-xs font-medium text-[#630ed4] dark:text-violet-400 hover:underline disabled:text-zinc-400 disabled:no-underline"
                        >
                            Max {maxQty > 0 ? maxQty.toLocaleString('en-IN') : 0}
                        </button>
                    </div>
                    <div className="flex items-stretch rounded-lg border border-zinc-300 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-[#630ed4]/30 focus-within:border-[#630ed4] overflow-hidden">
                        <button onClick={() => setQuantity(qty - 1)} className="px-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800" aria-label="Decrease">
                            <Minus className="w-4 h-4" />
                        </button>
                        <input
                            id="order-qty"
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => setQuantity(Number(e.target.value))}
                            onKeyDown={e => { if (e.key === 'Enter') submit() }}
                            className="flex-1 min-w-0 py-2 text-center font-semibold tabular-nums bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={() => setQuantity(qty + 1)} className="px-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800" aria-label="Increase">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                        {QUICK_QTY.map(n => (
                            <button
                                key={n}
                                onClick={() => setQuantity(n)}
                                className={`flex-1 py-1 text-xs rounded-md border tabular-nums ${qty === n
                                    ? 'border-[#630ed4] text-[#630ed4] dark:border-violet-400 dark:text-violet-400'
                                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-[#630ed4] dark:border-violet-400 px-3 py-2">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Market</p>
                        <p className="text-zinc-500">At live price</p>
                    </div>
                    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-400" title="Limit orders are coming soon">
                        <p className="font-semibold">Limit</p>
                        <p>Coming soon</p>
                    </div>
                </div>

                <dl className="text-sm space-y-1.5 tabular-nums">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <dt>Order value</dt><dd>{rupees(orderValue)}</dd>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                        <dt>Brokerage (0.1%)</dt><dd>{rupees(fees)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold text-zinc-900 dark:text-zinc-100 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                        <dt>{buy ? 'You pay' : 'You receive'}</dt><dd>{rupees(total)}</dd>
                    </div>
                </dl>

                {problem && ltp && (
                    <p className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" /> {problem}
                    </p>
                )}

                <button
                    onClick={submit}
                    disabled={submitting || Boolean(problem)}
                    className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${accent}`}
                >
                    {submitting ? 'Placing order…' : `${buy ? 'Buy' : 'Sell'} ${qty.toLocaleString('en-IN')} ${ticker(symbol)}`}
                </button>

                {result && (
                    <p className={`flex items-start gap-1.5 text-xs ${result.kind === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {result.kind === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />}
                        {result.text}
                    </p>
                )}

                <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
                    <span>Available cash</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{rupees(cash)}</span>
                </div>

                {market && !market.isOpen && (
                    <p className="flex items-start gap-1.5 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-2.5">
                        <Info className="w-3.5 h-3.5 mt-px shrink-0" />
                        {market.status}. Paper orders fill instantly at the last traded price.
                    </p>
                )}
            </div>

            {position && (
                <div className="mx-4 mb-4 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-xs tabular-nums">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Your position</p>
                    <div className="grid grid-cols-2 gap-y-1.5">
                        <span className="text-zinc-500">Qty</span><span className="text-right text-zinc-800 dark:text-zinc-200">{position.quantity}</span>
                        <span className="text-zinc-500">Avg. price</span><span className="text-right text-zinc-800 dark:text-zinc-200">{rupees(position.avgPrice)}</span>
                        <span className="text-zinc-500">Invested</span><span className="text-right text-zinc-800 dark:text-zinc-200">{rupees(position.invested)}</span>
                        <span className="text-zinc-500">P&amp;L</span>
                        <span className={`text-right font-medium ${trendClass(position.pnl)}`}>{signedRupees(position.pnl)} ({signedPct(position.pnlPercent)})</span>
                    </div>
                </div>
            )}

            <p className="px-4 pb-4 text-[11px] text-zinc-400">Shortcuts: <kbd className="font-sans">B</kbd> buy · <kbd className="font-sans">S</kbd> sell · <kbd className="font-sans">Enter</kbd> place</p>
        </div>
    )
}

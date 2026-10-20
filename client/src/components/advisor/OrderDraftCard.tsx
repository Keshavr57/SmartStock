import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { rupees, ticker } from '@/lib/market'
import type { OrderDraft } from '@/lib/advisor'

// The agent can only propose; the order is placed here, by the user, against the trading API.
export default function OrderDraftCard({ draft }: { draft: OrderDraft }) {
    const [state, setState] = useState<'idle' | 'placing' | 'filled' | 'dismissed' | 'error'>('idle')
    const [result, setResult] = useState('')
    const buy = draft.side === 'BUY'

    const confirm = async () => {
        setState('placing')
        try {
            const res = await api.post('/trading/order', { symbol: draft.symbol, side: draft.side, quantity: draft.quantity, orderType: 'MARKET' })
            const tx = res.data.data.transaction
            setResult(`${buy ? 'Bought' : 'Sold'} ${tx.quantity} ${ticker(tx.symbol)} at ${rupees(tx.price)} · total ${rupees(Math.abs(tx.netAmount))}`)
            setState('filled')
        } catch (error) {
            setResult((isAxiosError(error) && error.response?.data?.message) || 'Order failed')
            setState('error')
        }
    }

    if (state === 'dismissed') {
        return <p className="text-xs text-zinc-500 mt-3">Order draft dismissed.</p>
    }

    return (
        <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden max-w-md">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${buy ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>{draft.side}</span>
                    {draft.quantity} × {ticker(draft.symbol)}
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Needs your confirmation</span>
            </div>
            <dl className="px-4 py-3 grid grid-cols-2 gap-y-1.5 text-sm tabular-nums">
                <dt className="text-zinc-500">Est. price</dt><dd className="text-right">{rupees(draft.estimated_price)}</dd>
                <dt className="text-zinc-500">Order value</dt><dd className="text-right">{rupees(draft.estimated_value)}</dd>
                <dt className="text-zinc-500">Charges (0.1%)</dt><dd className="text-right">{rupees(draft.estimated_charges)}</dd>
                <dt className="font-medium">{buy ? 'You pay' : 'You receive'}</dt><dd className="text-right font-semibold">{rupees(draft.estimated_total)}</dd>
                <dt className="text-zinc-500 text-xs">{buy ? 'Cash available' : 'Shares held'}</dt>
                <dd className="text-right text-xs text-zinc-500">{buy ? rupees(draft.cash_available) : draft.shares_held}</dd>
                {draft.cash_after_order != null && <>
                    <dt className="text-zinc-500 text-xs">Cash after order</dt>
                    <dd className="text-right text-xs text-zinc-500">{rupees(draft.cash_after_order)}</dd>
                </>}
            </dl>
            {draft.warnings.length > 0 && (
                <ul className="px-4 pb-3 space-y-1">
                    {draft.warnings.map(w => (
                        <li key={w} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />{w}</li>
                    ))}
                </ul>
            )}
            <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800">
                {state === 'filled' ? (
                    <p className="flex items-start gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{result}. <Link to="/portfolio" className="underline">View portfolio</Link></span>
                    </p>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={confirm}
                            disabled={!draft.executable || state === 'placing'}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-40 ${buy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                        >
                            {state === 'placing' ? 'Placing…' : `Confirm ${buy ? 'buy' : 'sell'}`}
                        </button>
                        <button onClick={() => setState('dismissed')} className="h-8 px-3 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800">Dismiss</button>
                        <Link to={`/virtual-trading?symbol=${draft.symbol}&side=${draft.side}`} className="ml-auto text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Open in Trade</Link>
                    </div>
                )}
                {state === 'error' && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{result}</p>}
                <p className="mt-2 text-[11px] text-zinc-400">Paper trade with virtual money. The final price is the live price when you confirm.</p>
            </div>
        </div>
    )
}

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Order, Position } from '@/lib/market'
import { price, rupees, signedPct, signedRupees, ticker, trendClass } from '@/lib/market'

interface BlotterPanelProps {
    positions: Position[] | null
    orders: Order[] | null
    onSelect: (symbol: string) => void
    extraTab?: { label: string; content: ReactNode }
}

const th = 'px-3 py-2 font-medium text-zinc-500 text-right first:text-left whitespace-nowrap'
const td = 'px-3 py-2.5 text-right first:text-left whitespace-nowrap tabular-nums'

export default function BlotterPanel({ positions, orders, onSelect, extraTab }: BlotterPanelProps) {
    const [tab, setTab] = useState<'positions' | 'orders' | 'extra'>('positions')

    const totals = (positions ?? []).reduce((acc, p) => ({
        invested: acc.invested + p.invested,
        current: acc.current + (p.currentValue ?? p.invested),
        day: acc.day + (p.dayPnL ?? 0)
    }), { invested: 0, current: 0, day: 0 })
    const totalPnL = totals.current - totals.invested

    const tabs = [
        { id: 'positions' as const, label: `Positions${positions ? ` (${positions.length})` : ''}` },
        { id: 'orders' as const, label: `Orders${orders ? ` (${orders.length})` : ''}` },
        ...(extraTab ? [{ id: 'extra' as const, label: extraTab.label }] : [])
    ]

    return (
        <div>
            <div className="flex gap-1 px-3 border-b border-zinc-200 dark:border-zinc-800">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id
                            ? 'border-[#630ed4] text-zinc-900 dark:text-zinc-100'
                            : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'} ${t.id === 'extra' ? '2xl:hidden' : ''}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'positions' && (
                positions && positions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs">
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className={th}>Instrument</th><th className={th}>Qty</th><th className={th}>Avg.</th>
                                    <th className={th}>LTP</th><th className={th}>Cur. value</th><th className={th}>P&amp;L</th>
                                    <th className={th}>Net chg.</th><th className={th}>Day P&amp;L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {positions.map(p => (
                                    <tr key={p.symbol} onClick={() => onSelect(p.symbol)} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className={`${td} font-medium text-zinc-900 dark:text-zinc-100`}>{ticker(p.symbol)}</td>
                                        <td className={td}>{p.quantity}</td>
                                        <td className={td}>{price(p.avgPrice)}</td>
                                        <td className={td}>{price(p.currentPrice)}</td>
                                        <td className={td}>{rupees(p.currentValue)}</td>
                                        <td className={`${td} font-medium ${trendClass(p.pnl)}`}>{signedRupees(p.pnl)}</td>
                                        <td className={`${td} ${trendClass(p.pnlPercent)}`}>{signedPct(p.pnlPercent)}</td>
                                        <td className={`${td} ${trendClass(p.dayPnL)}`}>{signedRupees(p.dayPnL)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-zinc-200 dark:border-zinc-700 text-sm">
                                <tr>
                                    <td className={`${td} text-zinc-500`} colSpan={4}>Total</td>
                                    <td className={td}>{rupees(totals.current)}</td>
                                    <td className={`${td} font-semibold ${trendClass(totalPnL)}`}>{signedRupees(totalPnL)}</td>
                                    <td className={`${td} ${trendClass(totalPnL)}`}>{totals.invested ? signedPct((totalPnL / totals.invested) * 100) : '—'}</td>
                                    <td className={`${td} ${trendClass(totals.day)}`}>{signedRupees(totals.day)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <Empty text={positions ? "You don't hold any stocks yet. Place a buy order to open a position." : 'Loading positions…'} />
                )
            )}

            {tab === 'orders' && (
                orders && orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs">
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className={th}>Time</th><th className={th}>Type</th><th className={th}>Instrument</th>
                                    <th className={th}>Qty</th><th className={th}>Price</th><th className={th}>Value</th>
                                    <th className={th}>Charges</th><th className={th}>Realised P&amp;L</th><th className={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {orders.map(o => (
                                    <tr key={o.orderId} onClick={() => onSelect(o.symbol)} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className={`${td} text-zinc-500`}>
                                            {new Date(o.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </td>
                                        <td className={td}>
                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${o.type === 'BUY'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>{o.type}</span>
                                        </td>
                                        <td className={`${td} font-medium text-zinc-900 dark:text-zinc-100`}>{ticker(o.symbol)}</td>
                                        <td className={td}>{o.quantity}</td>
                                        <td className={td}>{price(o.price)}</td>
                                        <td className={td}>{rupees(o.totalAmount)}</td>
                                        <td className={`${td} text-zinc-500`}>{rupees(o.fees)}</td>
                                        <td className={`${td} ${trendClass(o.realizedPnL)}`}>{o.realizedPnL == null ? '—' : signedRupees(o.realizedPnL)}</td>
                                        <td className={`${td} text-emerald-700 dark:text-emerald-400 text-xs`}>Executed</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty text={orders ? 'No orders yet.' : 'Loading orders…'} />
                )
            )}

            {tab === 'extra' && extraTab && <div className="2xl:hidden h-[420px]">{extraTab.content}</div>}
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-500">{text}</p>
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { fetchAccount, fetchOrders, fetchPositions, price, rupees, ticker, usePolling } from '@/lib/market'
import type { AccountSummary, Order, Position } from '@/lib/market'
import { Button, Delta, EmptyState, Page, PageHeader, Panel, PanelHeader, Segmented, Skeleton, Stat, Tabs, tableCell, tableHead } from '@/components/ds'

type SectorPosition = Position & { sector?: string }

const PALETTE = ['#630ed4', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b']

// SVG donut: one arc per slice, cash shown last in neutral grey.
function Donut({ slices, size = 168 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
    const total = slices.reduce((a, s) => a + s.value, 0) || 1
    const r = size / 2 - 12
    const c = 2 * Math.PI * r
    // Each arc starts where the previous ones end.
    const arcs = slices.map((s, i) => ({
        ...s,
        len: (s.value / total) * c,
        start: slices.slice(0, i).reduce((a, p) => a + (p.value / total) * c, 0)
    }))
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="18" className="stroke-zinc-100 dark:stroke-zinc-800" />
            {arcs.map(a => (
                <circle key={a.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={a.color} strokeWidth="18"
                    strokeDasharray={`${Math.max(a.len - 1.5, 0)} ${c}`} strokeDashoffset={-a.start} />
            ))}
        </svg>
    )
}

export default function Portfolio() {
    const navigate = useNavigate()
    const { data: account, refresh: refreshAccount } = usePolling<AccountSummary>(fetchAccount, 30000)
    const { data: positions, refresh: refreshPositions } = usePolling<SectorPosition[]>(fetchPositions as () => Promise<SectorPosition[]>, 30000)
    const { data: orders, refresh: refreshOrders } = usePolling<Order[]>(fetchOrders, 60000)
    const [tab, setTab] = useState<'holdings' | 'orders'>('holdings')
    const [allocBy, setAllocBy] = useState<'stock' | 'sector'>('sector')
    const [orderFilter, setOrderFilter] = useState<'all' | 'BUY' | 'SELL'>('all')
    const [resetting, setResetting] = useState(false)

    const realized = (orders ?? []).reduce((a, o) => a + (o.realizedPnL ?? 0), 0)
    const holdingsValue = (positions ?? []).reduce((a, p) => a + (p.currentValue ?? p.invested), 0)

    const slices = useMemo(() => {
        const groups = new Map<string, number>()
        for (const p of positions ?? []) {
            const key = allocBy === 'stock' ? ticker(p.symbol) : (p.sector || 'Other')
            groups.set(key, (groups.get(key) ?? 0) + (p.currentValue ?? p.invested))
        }
        const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 7)
        const rest = sorted.slice(7).reduce((a, [, v]) => a + v, 0)
        const list = top.map(([label, value], i) => ({ label, value, color: PALETTE[i] }))
        if (rest > 0) list.push({ label: 'Others', value: rest, color: PALETTE[7] })
        if (account?.availableBalance) list.push({ label: 'Cash', value: account.availableBalance, color: '#d4d4d8' })
        return list
    }, [positions, allocBy, account?.availableBalance])
    const sliceTotal = slices.reduce((a, s) => a + s.value, 0) || 1

    const resetAccount = async () => {
        if (!window.confirm('Reset your paper-trading account? All holdings and order history will be cleared and cash reset to ₹1,00,000.')) return
        setResetting(true)
        try {
            await api.post('/trading/reset-portfolio')
            refreshAccount(); refreshPositions(); refreshOrders()
        } finally {
            setResetting(false)
        }
    }

    const filteredOrders = (orders ?? []).filter(o => orderFilter === 'all' || o.type === orderFilter)

    return (
        <Page>
            <PageHeader
                title="Portfolio"
                description="Your paper-trading holdings, allocation and order history."
                actions={<Button variant="ghost" size="sm" onClick={resetAccount} disabled={resetting}><RotateCcw className="w-3.5 h-3.5" /> Reset account</Button>}
            />

            <Panel className="p-5 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
                    <Stat label="Account value" value={account ? rupees(account.totalValue) : <Skeleton className="h-6 w-28" />} />
                    <Stat label="Holdings value" value={rupees(holdingsValue)} sub={`Invested ${rupees(account?.totalInvested)}`} />
                    <Stat label="Unrealised P&L" value={<Delta value={account?.totalPnL} kind="rupees" />} sub={<Delta value={account?.totalPnLPercent} />} />
                    <Stat label="Realised P&L" value={<Delta value={orders ? realized : null} kind="rupees" />} sub="From closed trades" />
                    <Stat label="Today's P&L" value={<Delta value={account?.dayPnL} kind="rupees" />} sub={<Delta value={account?.dayPnLPercent} />} />
                    <Stat label="Cash" value={rupees(account?.availableBalance)} sub="Available to invest" />
                </div>
            </Panel>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
                <Panel className="min-w-0">
                    <Tabs
                        className="px-2"
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            { value: 'holdings', label: `Holdings${positions ? ` (${positions.length})` : ''}` },
                            { value: 'orders', label: `Orders${orders ? ` (${orders.length})` : ''}` }
                        ]}
                    />
                    {tab === 'holdings' && (
                        positions == null ? <div className="p-4 space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
                        : positions.length === 0 ? (
                            <EmptyState icon={<Briefcase className="w-6 h-6" />} title="No holdings yet"
                                description="Buy stocks from the Trade screen and they'll appear here with live P&L."
                                action={<Button variant="primary" onClick={() => navigate('/virtual-trading')}>Go to Trade</Button>} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
                                        <th className={tableHead}>Stock</th><th className={tableHead}>Qty</th><th className={tableHead}>Avg. cost</th>
                                        <th className={tableHead}>LTP</th><th className={tableHead}>Current value</th><th className={tableHead}>P&amp;L</th>
                                        <th className={tableHead}>Day</th><th className={tableHead}>Weight</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {positions.map(p => (
                                            <tr key={p.symbol} onClick={() => navigate(`/stock/${p.symbol}`)} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                <td className={tableCell}>
                                                    <span className="font-medium">{ticker(p.symbol)}</span>
                                                    <span className="block text-xs text-zinc-500">{p.sector}</span>
                                                </td>
                                                <td className={tableCell}>{p.quantity}</td>
                                                <td className={tableCell}>{price(p.avgPrice)}</td>
                                                <td className={tableCell}>{price(p.currentPrice)}</td>
                                                <td className={tableCell}>{rupees(p.currentValue)}</td>
                                                <td className={tableCell}><Delta value={p.pnl} kind="rupees" /><span className="block text-xs"><Delta value={p.pnlPercent} /></span></td>
                                                <td className={tableCell}><Delta value={p.dayPnL} kind="rupees" /></td>
                                                <td className={tableCell}>{holdingsValue ? `${(((p.currentValue ?? p.invested) / holdingsValue) * 100).toFixed(1)}%` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                    {tab === 'orders' && (
                        <>
                            <div className="px-4 pt-3">
                                <Segmented value={orderFilter} onChange={setOrderFilter} options={[{ value: 'all', label: 'All' }, { value: 'BUY', label: 'Buys' }, { value: 'SELL', label: 'Sells' }]} />
                            </div>
                            {filteredOrders.length === 0 ? <EmptyState title="No orders" description="Orders you place on the Trade screen are listed here." /> : (
                                <div className="overflow-x-auto mt-2">
                                    <table className="w-full">
                                        <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
                                            <th className={tableHead}>Date</th><th className={tableHead}>Stock</th><th className={tableHead}>Side</th>
                                            <th className={tableHead}>Qty</th><th className={tableHead}>Price</th><th className={tableHead}>Value</th>
                                            <th className={tableHead}>Charges</th><th className={tableHead}>Realised P&amp;L</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {filteredOrders.map(o => (
                                                <tr key={o.orderId} onClick={() => navigate(`/stock/${o.symbol}`)} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                    <td className={`${tableCell} text-zinc-500`}>{new Date(o.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                                    <td className={`${tableCell} font-medium`}>{ticker(o.symbol)}</td>
                                                    <td className={tableCell}>
                                                        <span className={o.type === 'BUY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{o.type === 'BUY' ? 'Buy' : 'Sell'}</span>
                                                    </td>
                                                    <td className={tableCell}>{o.quantity}</td>
                                                    <td className={tableCell}>{price(o.price)}</td>
                                                    <td className={tableCell}>{rupees(o.totalAmount)}</td>
                                                    <td className={`${tableCell} text-zinc-500`}>{rupees(o.fees)}</td>
                                                    <td className={tableCell}>{o.realizedPnL == null ? <span className="text-zinc-400">—</span> : <Delta value={o.realizedPnL} kind="rupees" />}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </Panel>

                <Panel>
                    <PanelHeader title="Allocation" subtitle="Share of account value"
                        action={<Segmented value={allocBy} onChange={setAllocBy} options={[{ value: 'sector', label: 'Sector' }, { value: 'stock', label: 'Stock' }]} />} />
                    <div className="px-4 pb-4">
                        <div className="relative flex justify-center py-2">
                            <Donut slices={slices} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs text-zinc-500">Invested</span>
                                <span className="text-lg font-semibold tabular-nums">
                                    {account?.totalValue ? `${((holdingsValue / account.totalValue) * 100).toFixed(1)}%` : '—'}
                                </span>
                            </div>
                        </div>
                        <ul className="mt-3 space-y-2">
                            {slices.map(s => (
                                <li key={s.label} className="flex items-center gap-2 text-sm">
                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                                    <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{s.label}</span>
                                    <span className="tabular-nums text-zinc-500">{rupees(s.value, true)}</span>
                                    <span className="w-12 text-right tabular-nums font-medium">{((s.value / sliceTotal) * 100).toFixed(1)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Panel>
            </div>
        </Page>
    )
}

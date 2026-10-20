import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

export interface Quote {
    symbol: string
    name?: string
    price: number | null
    change?: number | null
    changePercent?: number | null
    previousClose?: number | null
    dayHigh?: number | null
    dayLow?: number | null
    volume?: number | null
    fiftyTwoWeekHigh?: number | null
    fiftyTwoWeekLow?: number | null
    asOf?: string
}

export interface MarketStatus {
    isOpen: boolean
    status: string
    reason?: string
}

export interface AccountSummary {
    totalValue: number
    availableBalance: number
    totalInvested: number
    currentValue: number
    totalPnL: number
    totalPnLPercent: number
    dayPnL: number
    dayPnLPercent: number
    holdingsCount: number
    transactionsCount: number
}

export interface Position {
    symbol: string
    name: string
    quantity: number
    avgPrice: number
    currentPrice: number | null
    previousClose: number | null
    invested: number
    currentValue: number | null
    pnl: number | null
    pnlPercent: number | null
    dayPnL: number | null
}

export interface Order {
    orderId: string
    type: 'BUY' | 'SELL'
    symbol: string
    name?: string
    quantity: number
    price: number
    totalAmount: number
    fees: number
    realizedPnL: number | null
    timestamp: string
    status: string
}

// ---------- formatting ----------

const inrFormatter = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const ticker = (symbol: string) => symbol.replace(/\.(NS|BO)$/, '').replace(/^\^/, '')
export const price = (n: number | null | undefined) => (n == null ? '—' : inrFormatter.format(n))
export const rupees = (n: number | null | undefined, whole = false) =>
    n == null ? '—' : `₹${(whole ? inrWhole : inrFormatter).format(n)}`
export const signedRupees = (n: number | null | undefined) =>
    n == null ? '—' : `${n >= 0 ? '+' : '−'}₹${inrFormatter.format(Math.abs(n))}`
export const signedPct = (n: number | null | undefined) =>
    n == null ? '—' : `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`
export const volume = (n: number | null | undefined) => {
    if (n == null) return '—'
    if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`
    if (n >= 1e5) return `${(n / 1e5).toFixed(2)} L`
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`
    return String(n)
}
export const trendClass = (n: number | null | undefined) =>
    n == null || n === 0 ? 'text-zinc-500' : n > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'

// ---------- data hooks ----------

/** Polls `fetcher` every `intervalMs`; keeps the last good value on transient failures. */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number, deps: unknown[] = []) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const refresh = useCallback(async () => {
        try {
            setData(await fetcherRef.current())
        } catch {
            // keep last good data
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        refresh()
        const id = setInterval(refresh, intervalMs)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intervalMs, refresh, ...deps])

    return { data, loading, refresh }
}

export const fetchQuote = async (symbol: string): Promise<Quote | null> => {
    const res = await api.get(`/trading/quote/${encodeURIComponent(symbol)}`)
    return res.data?.status === 'success' ? res.data.data : null
}

export const fetchQuotes = async (symbols: string[]): Promise<Quote[]> => {
    if (symbols.length === 0) return []
    const res = await api.get('/trading/quotes', { params: { symbols: symbols.join(',') } })
    return res.data?.data ?? []
}

export const fetchMarketStatus = async (): Promise<MarketStatus> => (await api.get('/trading/market-status')).data.data
export const fetchAccount = async (): Promise<AccountSummary> => (await api.get('/trading/portfolio')).data.data
export const fetchPositions = async (): Promise<Position[]> => (await api.get('/trading/holdings')).data.data
export const fetchOrders = async (): Promise<Order[]> => (await api.get('/trading/transactions', { params: { limit: 50 } })).data.data

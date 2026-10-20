import { useEffect, useMemo, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, UTCTimestamp, Time, MouseEventParams } from 'lightweight-charts'
import { CandlestickChart, LineChart, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { price, volume, trendClass } from '@/lib/market'

interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number | null }

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'] as const
type Timeframe = typeof TIMEFRAMES[number]
const INTRADAY: Timeframe[] = ['1D', '5D']

const UP = '#059669'
const DOWN = '#e11d48'
const IST_OFFSET_S = 19800

// Intraday bars: epoch seconds shifted to IST (the library renders UTC). Daily bars: the IST trading date.
function toTime(ms: number, intraday: boolean): Time {
    if (intraday) return (Math.floor(ms / 1000) + IST_OFFSET_S) as UTCTimestamp
    return new Date(ms + IST_OFFSET_S * 1000).toISOString().slice(0, 10) as Time
}

function useDarkMode() {
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
    useEffect(() => {
        const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])
    return dark
}

interface PriceChartProps {
    symbol: string
    previousClose?: number | null
    live: boolean // market open: refresh intraday bars every 30s
}

export default function PriceChart({ symbol, previousClose, live }: PriceChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
    const dark = useDarkMode()

    const [timeframe, setTimeframe] = useState<Timeframe>('1D')
    const [style, setStyle] = useState<'candles' | 'area'>('candles')
    const [candles, setCandles] = useState<Candle[]>([])
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [hovered, setHovered] = useState<Candle | null>(null)
    const intraday = INTRADAY.includes(timeframe)

    // ---- data ----
    useEffect(() => {
        let cancelled = false
        const load = async (background: boolean) => {
            if (!background) setStatus('loading')
            try {
                const res = await api.get(`/trading/chart/${encodeURIComponent(symbol)}`, { params: { timeframe } })
                const data: Candle[] = res.data?.data?.candles ?? []
                if (cancelled) return
                if (data.length) {
                    setCandles(data)
                    setStatus('ready')
                } else if (!background) setStatus('error')
            } catch {
                if (!cancelled && !background) setStatus('error')
            }
        }
        load(false)
        const id = live && timeframe === '1D' ? setInterval(() => load(true), 30000) : undefined
        return () => {
            cancelled = true
            if (id) clearInterval(id)
        }
    }, [symbol, timeframe, live])

    // ---- chart instance (re-created on theme change) ----
    useEffect(() => {
        if (!containerRef.current) return
        const text = dark ? '#a1a1aa' : '#71717a'
        const grid = dark ? '#27272a' : '#f4f4f5'
        const chart = createChart(containerRef.current, {
            autoSize: true,
            // TradingView attribution is shown as a text credit on the page instead of the in-chart logo.
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: text, fontSize: 11, fontFamily: 'inherit', attributionLogo: false },
            grid: { vertLines: { color: grid }, horzLines: { color: grid } },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: dark ? '#52525b' : '#a1a1aa', labelBackgroundColor: '#630ed4' },
                horzLine: { color: dark ? '#52525b' : '#a1a1aa', labelBackgroundColor: '#630ed4' }
            },
            rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.25 } },
            timeScale: { borderVisible: false, rightOffset: 4, minBarSpacing: 2, fixLeftEdge: true, lockVisibleTimeRangeOnResize: true },
            localization: { priceFormatter: (p: number) => price(p) }
        })
        chartRef.current = chart
        return () => {
            chart.remove()
            chartRef.current = null
            priceSeriesRef.current = null
            volumeSeriesRef.current = null
        }
    }, [dark])

    const byTime = useMemo(() => new Map(candles.map(c => [String(toTime(c.time, intraday)), c])), [candles, intraday])

    // ---- series ----
    useEffect(() => {
        const chart = chartRef.current
        if (!chart || candles.length === 0) return
        if (priceSeriesRef.current) chart.removeSeries(priceSeriesRef.current)
        if (volumeSeriesRef.current) chart.removeSeries(volumeSeriesRef.current)

        chart.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } })
        const rising = candles[candles.length - 1].close >= candles[0].open

        if (style === 'candles') {
            const series = chart.addCandlestickSeries({
                upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
                priceLineVisible: true, lastValueVisible: true
            })
            series.setData(candles.map(c => ({ time: toTime(c.time, intraday), open: c.open, high: c.high, low: c.low, close: c.close })))
            priceSeriesRef.current = series
        } else {
            const color = rising ? UP : DOWN
            const series = chart.addAreaSeries({ lineColor: color, topColor: `${color}30`, bottomColor: `${color}00`, lineWidth: 2 })
            series.setData(candles.map(c => ({ time: toTime(c.time, intraday), value: c.close })))
            priceSeriesRef.current = series
        }

        if (timeframe === '1D' && previousClose) {
            priceSeriesRef.current.createPriceLine({
                price: previousClose, color: dark ? '#71717a' : '#a1a1aa', lineWidth: 1, lineStyle: LineStyle.Dashed,
                axisLabelVisible: true, title: 'Prev close'
            })
        }

        const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false })
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
        vol.setData(candles.filter(c => c.volume != null).map(c => ({
            time: toTime(c.time, intraday), value: c.volume as number, color: c.close >= c.open ? `${UP}40` : `${DOWN}40`
        })))
        volumeSeriesRef.current = vol
        chart.timeScale().fitContent()
    }, [candles, style, intraday, timeframe, previousClose, dark])

    // ---- crosshair legend ----
    useEffect(() => {
        const chart = chartRef.current
        if (!chart) return
        const onMove = (param: MouseEventParams) => {
            setHovered(param.time ? byTime.get(String(param.time)) ?? null : null)
        }
        chart.subscribeCrosshairMove(onMove)
        return () => chart.unsubscribeCrosshairMove(onMove)
    }, [byTime, dark])

    const shown = hovered ?? candles[candles.length - 1] ?? null
    const shownIndex = shown ? candles.indexOf(shown) : -1
    const prevClose = shownIndex > 0 ? candles[shownIndex - 1].close : timeframe === '1D' ? previousClose ?? null : null
    const shownChange = shown && prevClose ? ((shown.close - prevClose) / prevClose) * 100 : null

    // While the market is closed the 1D view shows the most recent completed session; say which one.
    const sessionNote = !live && timeframe === '1D' && candles.length > 0
        ? new Date(candles[candles.length - 1].time).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })
        : null

    const timeLabel = shown
        ? new Date(shown.time).toLocaleString('en-IN', intraday
            ? { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }
            : { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })
        : ''

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center">
                    {TIMEFRAMES.map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${timeframe === tf
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    {sessionNote && status === 'ready' && (
                        <span className="hidden sm:inline text-[11px] text-amber-700 dark:text-amber-400 mr-2">Last session · {sessionNote}</span>
                    )}
                    <button
                        onClick={() => setStyle('candles')}
                        title="Candles"
                        className={`p-1.5 rounded-md ${style === 'candles' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <CandlestickChart className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setStyle('area')}
                        title="Line"
                        className={`p-1.5 rounded-md ${style === 'area' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <LineChart className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 min-h-[320px]">
                {shown && status === 'ready' && (
                    <div className="absolute top-2 left-3 right-20 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums pointer-events-none">
                        <span className="text-zinc-500">{timeLabel}</span>
                        <span className="text-zinc-500">O <b className="font-medium text-zinc-800 dark:text-zinc-200">{price(shown.open)}</b></span>
                        <span className="text-zinc-500">H <b className="font-medium text-zinc-800 dark:text-zinc-200">{price(shown.high)}</b></span>
                        <span className="text-zinc-500">L <b className="font-medium text-zinc-800 dark:text-zinc-200">{price(shown.low)}</b></span>
                        <span className="text-zinc-500">C <b className="font-medium text-zinc-800 dark:text-zinc-200">{price(shown.close)}</b></span>
                        {shownChange != null && <span className={`font-medium ${trendClass(shownChange)}`}>{shownChange >= 0 ? '+' : ''}{shownChange.toFixed(2)}%</span>}
                        <span className="text-zinc-500">Vol <b className="font-medium text-zinc-800 dark:text-zinc-200">{volume(shown.volume)}</b></span>
                    </div>
                )}
                <div ref={containerRef} className="absolute inset-0" />
                {status === 'loading' && candles.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400 gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Loading chart
                    </div>
                )}
                {status === 'error' && candles.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
                        Chart data is unavailable for this symbol right now.
                    </div>
                )}
            </div>
        </div>
    )
}

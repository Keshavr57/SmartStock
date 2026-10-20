import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import type { UTCTimestamp } from 'lightweight-charts'
import { API_CONFIG } from '@/lib/config'

export type HistoryRange = '1M' | '6M' | '1Y' | '5Y'

interface Candle {
  time: number
  close: number
}

interface PriceHistoryChartProps {
  symbol: string
  range: HistoryRange
  height?: number
  onStats?: (stats: { periodReturn: number; high: number; low: number } | null) => void
}

const UP = '#16a34a'
const DOWN = '#dc2626'
const IST_OFFSET_S = 19800

// Real daily/weekly closes for one stock, drawn with TradingView's lightweight-charts.
export default function PriceHistoryChart({ symbol, range, height = 220, onStats }: PriceHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetch(`${API_CONFIG.BASE_URL}/trading/chart/${symbol}?timeframe=${range}`)
      .then(r => r.json())
      .then(res => {
        if (cancelled) return
        const data: Candle[] = res?.data?.candles || []
        if (res.status === 'success' && data.length > 1) {
          setCandles(data)
          setStatus('ready')
          const closes = data.map(c => c.close)
          onStats?.({
            periodReturn: ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100,
            high: Math.max(...closes),
            low: Math.min(...closes)
          })
        } else {
          setStatus('error')
          onStats?.(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error')
          onStats?.(null)
        }
      })
    return () => { cancelled = true }
    // onStats is a notification callback; re-fetching when its identity changes is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, range])

  useEffect(() => {
    if (!containerRef.current || candles.length < 2) return
    const up = candles[candles.length - 1].close >= candles[0].close
    const color = up ? UP : DOWN
    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#71717a', fontSize: 11 },
      grid: { vertLines: { visible: false }, horzLines: { color: '#f4f4f5' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: range === '1M' },
      localization: { priceFormatter: (p: number) => `₹${p.toFixed(2)}` },
      handleScroll: false,
      handleScale: false
    })
    const series = chart.addAreaSeries({ lineColor: color, topColor: `${color}33`, bottomColor: `${color}05`, lineWidth: 2 })
    series.setData(candles.map(c => ({ time: (Math.floor(c.time / 1000) + IST_OFFSET_S) as UTCTimestamp, value: c.close })))
    chart.timeScale().fitContent()

    const resize = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width) chart.applyOptions({ width })
    })
    resize.observe(containerRef.current)
    return () => {
      resize.disconnect()
      chart.remove()
    }
  }, [candles, height, range])

  return (
    <div className="relative" style={{ height }}>
      <div ref={containerRef} className={status === 'ready' ? '' : 'invisible'} />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-400">
          Price history unavailable
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Page, PageHeader } from '@/components/ds'
import { X } from 'lucide-react'
import { getComprehensiveComparison } from '../lib/api'
import { cn } from '../lib/utils'
import PriceHistoryChart from '@/components/PriceHistoryChart'
import type { HistoryRange } from '@/components/PriceHistoryChart'
import ComprehensiveComparisonTable from '@/components/ComprehensiveComparisonTable'
import StockRecommendationEngine from '@/components/StockRecommendationEngine'
import StockSearchAutocomplete from '@/components/StockSearchAutocomplete'

export default function Compare() {
    const [selectedAssets, setSelectedAssets] = useState<string[]>(['RELIANCE.NS', 'TCS.NS'])
    const [comprehensiveData, setComprehensiveData] = useState<any[]>([])
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false)
    const [range, setRange] = useState<HistoryRange>('1Y')
    const [periodStats, setPeriodStats] = useState<Record<string, { periodReturn: number; high: number; low: number } | null>>({})

    useEffect(() => {
        if (selectedAssets.length === 0) {
            setComprehensiveData([])
            return
        }
        let cancelled = false
        setComprehensiveLoading(true)
        getComprehensiveComparison(selectedAssets)
            .then(res => { if (!cancelled && res.success) setComprehensiveData(res.comparison) })
            .catch(() => { if (!cancelled) setComprehensiveData([]) })
            .finally(() => { if (!cancelled) setComprehensiveLoading(false) })
        return () => { cancelled = true }
    }, [selectedAssets])

    const dataFor = (symbol: string) => comprehensiveData.find((d: any) => d.symbol === symbol)

    const removeAsset = (symbol: string) => {
        setSelectedAssets(selectedAssets.filter(a => a !== symbol))
    }

    const addAsset = (symbol: string) => {
        let sym = symbol.trim().toUpperCase()
        // Auto-add .NS for Indian stocks if missing
        if (sym.length >= 3 && !sym.includes('.')) {
            sym = `${sym}.NS`
        }
        if (sym && selectedAssets.length < 3 && !selectedAssets.includes(sym)) {
            setSelectedAssets([...selectedAssets, sym])
        }
    }

    const formatNum = (v: number | null | undefined, digits = 2) => (typeof v === 'number' ? v.toFixed(digits) : 'N/A')
    const RANGES: HistoryRange[] = ['1M', '6M', '1Y', '5Y']

    return (
        <Page>
            <PageHeader title="Compare" description="Put up to three NSE stocks side by side: price history, valuation, profitability and ownership." />
            <div className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedAssets.map((asset) => {
                        const assetData = dataFor(asset);
                        const change = assetData?.oneDayChangePercent || 0;
                        const isBest = comprehensiveData.length > 1 && change === Math.max(...comprehensiveData.map((d: any) => d?.oneDayChangePercent || 0));
                        return (
                            <div key={asset} className={`relative bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border flex justify-between items-center group transition-shadow hover: ${isBest ? 'border-green-400 dark:border-green-600 ring-1 ring-green-400/30' : 'border-zinc-100 dark:border-zinc-800'}`}>
                                {isBest && (
                                    <span className="absolute -top-2.5 left-4 bg-green-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">Best</span>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{asset.replace('.NS', '')}</h3>
                                    <p className="text-[11px] font-bold text-zinc-400">NSE</p>
                                    {assetData && (
                                        <p className={`text-xs font-semibold mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(2)}% today
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => removeAsset(asset)}
                                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-700">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                    
                    {selectedAssets.length < 3 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center justify-center min-h-[104px]">
                            <StockSearchAutocomplete
                                onSelectStock={addAsset}
                                selectedSymbols={selectedAssets}
                                maxSelection={3}
                            />
                        </div>
                    )}
                </div>

                {selectedAssets.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Price Performance</h3>
                                <p className="text-xs font-bold text-zinc-400">Real closing prices from NSE via Yahoo Finance</p>
                            </div>
                            <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                                {RANGES.map(r => (
                                    <button key={r} onClick={() => setRange(r)}
                                        className={cn('px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                                            range === r ? 'bg-brand-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white')}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={cn('grid grid-cols-1 gap-6', selectedAssets.length === 2 && 'md:grid-cols-2', selectedAssets.length === 3 && 'md:grid-cols-3')}>
                            {selectedAssets.map(asset => {
                                const d = dataFor(asset)
                                const stats = periodStats[asset]
                                return (
                                    <div key={asset} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold text-zinc-900 dark:text-white">{asset.replace('.NS', '')}</h4>
                                                <p className="text-[11px] font-bold text-zinc-400 truncate max-w-[180px]">{d?.name || ''}</p>
                                            </div>
                                            {stats && (
                                                <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg',
                                                    stats.periodReturn >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500')}>
                                                    {stats.periodReturn >= 0 ? '+' : ''}{stats.periodReturn.toFixed(2)}% · {range}
                                                </span>
                                            )}
                                        </div>
                                        <PriceHistoryChart
                                            symbol={asset}
                                            range={range}
                                            onStats={s => setPeriodStats(prev => ({ ...prev, [asset]: s }))}
                                        />
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {[
                                                { label: 'Price', value: d?.lastTradedPrice != null ? `₹${d.lastTradedPrice.toLocaleString('en-IN')}` : 'N/A' },
                                                { label: 'Today', value: d?.oneDayChangePercent != null ? `${d.oneDayChangePercent >= 0 ? '+' : ''}${d.oneDayChangePercent.toFixed(2)}%` : 'N/A',
                                                  tone: d?.oneDayChangePercent != null ? (d.oneDayChangePercent >= 0 ? 'text-green-600' : 'text-red-500') : '' },
                                                { label: 'P/E', value: formatNum(d?.peRatio) },
                                                { label: 'ROE', value: d?.roe != null ? `${d.roe.toFixed(2)}%` : 'N/A' },
                                                { label: `${range} High`, value: stats ? `₹${stats.high.toFixed(2)}` : 'N/A' },
                                                { label: `${range} Low`, value: stats ? `₹${stats.low.toFixed(2)}` : 'N/A' }
                                            ].map(item => (
                                                <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl">
                                                    <div className="text-[11px] font-bold text-zinc-500">{item.label}</div>
                                                    <div className={cn('font-semibold text-sm text-zinc-900 dark:text-white', item.tone)}>
                                                        {comprehensiveLoading && !d ? '…' : item.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {selectedAssets.length > 0 && (
                    <StockRecommendationEngine data={comprehensiveData} />
                )}

                {selectedAssets.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 mt-8 overflow-hidden">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Detailed Fundamentals Table</h3>
                        <div className="overflow-x-auto pb-4">
                            <ComprehensiveComparisonTable 
                                data={comprehensiveData} 
                                loading={comprehensiveLoading} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </Page>
    )
}

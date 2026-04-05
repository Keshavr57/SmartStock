import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { X, Plus, BarChart3 } from 'lucide-react'
import { compareAssets, getAssetsHistory, getComprehensiveComparison } from '../lib/api'
import { cn } from '../lib/utils'
import ComprehensiveComparisonTable from '@/components/ComprehensiveComparisonTable'
import StockRecommendationEngine from '@/components/StockRecommendationEngine'
import StockSearchAutocomplete from '@/components/StockSearchAutocomplete'

export default function Compare() {
    const [selectedAssets, setSelectedAssets] = useState<string[]>(['RELIANCE.NS', 'TCS.NS'])
    const [comprehensiveData, setComprehensiveData] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (selectedAssets.length === 0) {
                setChartData([])
                setComprehensiveData([])
                return
            }
            
            setLoading(true)
            setComprehensiveLoading(true)
            
            try {
                // Fetch basic fundamentals and chart data
                const [basicRes, histRes, comprehensiveRes] = await Promise.allSettled([
                    compareAssets(selectedAssets),
                    getAssetsHistory(selectedAssets),
                    getComprehensiveComparison(selectedAssets)
                ])

                // Handle chart data
                if (histRes.status === 'fulfilled' && histRes.value.success) {
                    const dateMap: { [key: string]: any } = {}
                    const symbols = Object.keys(histRes.value.data)

                    symbols.forEach(s => {
                        histRes.value.data[s].forEach((point: any) => {
                            // Handle both string and Date objects for date
                            const date = new Date(point.date);
                            const dStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            if (!dateMap[dStr]) {
                                dateMap[dStr] = { name: dStr, date: date }
                            }
                            dateMap[dStr][s] = Math.round(point.price * 100) / 100 // Round to 2 decimal places
                        })
                    })

                    // Sort by actual date, not string
                    const formattedChart = Object.values(dateMap)
                        .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
                        .map(item => {
                            const { date, ...rest } = item as any;
                            return rest;
                        });
                    
                    setChartData(formattedChart)
                } else {
                    setChartData([]);
                }

                // Handle comprehensive data
                if (comprehensiveRes.status === 'fulfilled' && comprehensiveRes.value.success) {
                    setComprehensiveData(comprehensiveRes.value.comparison)
                }

            } catch (error) {
                // Handle error silently or show user-friendly message
            } finally {
                setLoading(false)
                setComprehensiveLoading(false)
            }
        }
        fetchData()
    }, [selectedAssets])

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
            setSearchQuery('')
        }
    }

    // Mock technical indicators data for demo
    const technicalData = [
        { name: 'RSI', value: 65 },
        { name: 'MACD', value: 45 },
        { name: 'Volume', value: 85 }
    ]

    return (
        <section className="bg-[#f9f9ff] dark:bg-zinc-950 min-h-[calc(100vh-64px)] p-4 md:p-8 border-t dark:border-zinc-900" id="compare">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Compare Assets</h1>
                        <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Cross-check fundamentals & tech</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedAssets.map((asset, idx) => {
                        const assetData = comprehensiveData[idx];
                        const change = assetData?.oneDayChangePercent || 0;
                        const isBest = comprehensiveData.length > 1 && change === Math.max(...comprehensiveData.map((d: any) => d?.oneDayChangePercent || 0));
                        return (
                            <div key={asset} className={`relative bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border flex justify-between items-center group transition-shadow hover:shadow-md ${isBest ? 'border-green-400 dark:border-green-600 ring-1 ring-green-400/30' : 'border-zinc-100 dark:border-zinc-800'}`}>
                                {isBest && (
                                    <span className="absolute -top-2.5 left-4 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Best</span>
                                )}
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">{asset.replace('.NS', '')}</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">NSE</p>
                                    {assetData && (
                                        <p className={`text-xs font-black mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {change >= 0 ? '+' : ''}{change.toFixed(2)}% today
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => removeAsset(asset)}
                                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-700">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                    
                    {selectedAssets.length < 3 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex items-center justify-center min-h-[104px]">
                            <StockSearchAutocomplete
                                onSelectStock={addAsset}
                                selectedSymbols={selectedAssets}
                                maxSelection={3}
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 h-full flex flex-col">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6">Price Performance (Historical)</h3>
                            <div className="flex-1 w-full min-h-[400px]">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-zinc-400">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-8 h-8 border-4 border-[#630ed4] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase tracking-widest">Compiling chart data...</span>
                                        </div>
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={400}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#a1a1aa"
                                                fontSize={10}
                                                fontWeight={700}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#a1a1aa"
                                                fontSize={10}
                                                fontWeight={700}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: 'white', 
                                                    border: '1px solid #e5e7eb', 
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    fontWeight: '700'
                                                }}
                                                formatter={(value: any, name: string) => [
                                                    `₹${value.toLocaleString()}`, 
                                                    name.replace('.NS', '')
                                                ]}
                                            />
                                            {selectedAssets.map((asset, i) => (
                                                <Line
                                                    key={asset}
                                                    type="monotone"
                                                    dataKey={asset}
                                                    stroke={i === 0 ? '#630ed4' : i === 1 ? '#0ea5e9' : '#10b981'}
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                    name={asset.replace('.NS', '')}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <BarChart3 className="h-12 w-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                                        <div className="text-sm font-black uppercase tracking-widest text-zinc-500">No data plotted</div>
                                        <div className="text-xs font-bold mt-2 max-w-xs text-center text-zinc-400">
                                            {selectedAssets.length === 0 
                                                ? "Select at least one stock to plot"
                                                : "Chart data unavailable."
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center justify-between">
                                Key Fundamentals
                                <span className="bg-[#630ed4]/10 text-[#630ed4] px-2 py-1 rounded text-[10px] uppercase font-black">Live</span>
                            </h3>

                            <div className="space-y-6">
                                {comprehensiveData.length > 0 ? comprehensiveData.map((asset, index) => (
                                    <div key={asset.symbol || index} className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                                        <h4 className="font-black text-zinc-900 dark:text-white text-lg">
                                            {asset.symbol || selectedAssets[index]}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Current</div>
                                                <div className="font-black text-zinc-900 dark:text-white">
                                                    ₹{asset.lastTradedPrice?.toLocaleString() || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">24h</div>
                                                <div className={cn(
                                                    "font-black",
                                                    (asset.oneDayChangePercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {(asset.oneDayChangePercent || 0) >= 0 ? '+' : ''}{typeof asset.oneDayChangePercent === 'number' ? asset.oneDayChangePercent.toFixed(2) : 'N/A'}%
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">P/E</div>
                                                <div className="font-black text-zinc-900 dark:text-white">
                                                    {asset.peRatio && typeof asset.peRatio === 'number' ? asset.peRatio.toFixed(2) : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">ROE</div>
                                                <div className="font-black text-zinc-900 dark:text-white">
                                                    {asset.roe && typeof asset.roe === 'number' ? `${asset.roe.toFixed(2)}%` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : selectedAssets.map((asset) => (
                                    <div key={asset} className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                                        <h4 className="font-black text-zinc-900 dark:text-white text-lg">
                                            {asset.replace('.NS', '')}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded w-16 mb-2"></div>
                                                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded w-20"></div>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                                                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded w-16 mb-2"></div>
                                                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded w-20"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedAssets.length > 0 && (
                    <StockRecommendationEngine data={comprehensiveData} />
                )}

                {selectedAssets.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 mt-8 overflow-hidden">
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6">Detailed Fundamentals Table</h3>
                        <div className="overflow-x-auto pb-4">
                            <ComprehensiveComparisonTable 
                                data={comprehensiveData} 
                                loading={comprehensiveLoading} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

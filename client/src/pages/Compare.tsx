import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { X, Plus } from 'lucide-react'
import { compareAssets, getAssetsHistory, getComprehensiveComparison } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import ComprehensiveComparisonTable from '@/components/ComprehensiveComparisonTable'
import StockRecommendationEngine from '@/components/StockRecommendationEngine'

export default function Compare() {
    const [selectedAssets, setSelectedAssets] = useState<string[]>(['RELIANCE.NS', 'TCS.NS'])
    const [comprehensiveData, setComprehensiveData] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

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

                // Handle basic comparison data
                if (basicRes.status === 'fulfilled' && basicRes.value.success) {
                    // Basic comparison data can be used if needed
                }

                // Handle chart data
                if (histRes.status === 'fulfilled' && histRes.value.success) {
                    const dateMap: { [key: string]: any } = {}
                    const symbols = Object.keys(histRes.value.data)

                    symbols.forEach(s => {
                        histRes.value.data[s].forEach((point: any) => {
                            const dStr = new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            if (!dateMap[dStr]) {
                                dateMap[dStr] = { name: dStr }
                            }
                            dateMap[dStr][s] = point.price
                        })
                    })

                    const formattedChart = Object.values(dateMap).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
                    setChartData(formattedChart)
                }

                // Handle comprehensive data
                if (comprehensiveRes.status === 'fulfilled' && comprehensiveRes.value.success) {
                    setComprehensiveData(comprehensiveRes.value.comparison)
                }

            } catch (error) {
                console.error("Failed to fetch comparison data:", error)
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
        if (sym.length >= 3 && !sym.includes('.') && !['BTC', 'ETH', 'SOL', 'USDT'].some(x => sym.includes(x))) {
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
        <div className="min-h-screen bg-white dark:bg-zinc-950 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header - Figma Style */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Compare & Learn About Stocks
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Compare stocks side-by-side and get educational analysis to learn about stock evaluation. 
                        Our AI-powered recommendations help you understand what makes a good investment.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-2xl mx-auto">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Educational Purpose:</strong> All recommendations are for learning only, not financial advice.
                        </p>
                    </div>
                </div>

                {/* Asset Selection - Figma Style */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Select Assets to Compare (Max 3)
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {selectedAssets.map((asset) => (
                            <div key={asset} className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-full">
                                <span className="font-medium text-gray-900 dark:text-white">{asset}</span>
                                <button
                                    onClick={() => removeAsset(asset)}
                                    className="w-5 h-5 rounded-full bg-gray-300 dark:bg-zinc-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        
                        {selectedAssets.length < 3 && (
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Add asset..."
                                    className="w-40 h-10 rounded-full border-gray-300 dark:border-zinc-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addAsset(searchQuery)}
                                />
                                <Button
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => addAsset(searchQuery)}
                                    disabled={!searchQuery.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Performance Chart - Figma Style */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Price Performance
                    </h3>
                    
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
                        <div className="h-[400px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value.toLocaleString()}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: 'white', 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        {selectedAssets.map((asset, i) => (
                                            <Line
                                                key={asset}
                                                type="monotone"
                                                dataKey={asset}
                                                stroke={i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#10b981'}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4, strokeWidth: 0 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    {loading ? 'Loading chart data...' : 'No data available'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fundamentals & Technical Indicators - Figma Style */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Fundamentals & Ratings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Fundamentals & Ratings
                        </h3>
                        
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
                            {comprehensiveData.length > 0 ? comprehensiveData.map((asset, index) => (
                                <div key={asset.symbol || index} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {asset.symbol || selectedAssets[index]}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            <span className="text-sm font-medium">Live Data</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">Current Price</div>
                                            <div className="font-semibold">
                                                ₹{asset.lastTradedPrice?.toLocaleString() || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">24h Change</div>
                                            <div className={cn(
                                                "font-semibold",
                                                (asset.oneDayChangePercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                                            )}>
                                                {(asset.oneDayChangePercent || 0) >= 0 ? '+' : ''}{asset.oneDayChangePercent?.toFixed(2) || 'N/A'}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">P/E Ratio</div>
                                            <div className="font-semibold">
                                                {asset.peRatio?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">EPS</div>
                                            <div className="font-semibold">
                                                ₹{asset.eps?.toFixed(2) || 'N/A'}
                                            </div>
                                        </div>
                                        {asset.revenue && (
                                            <>
                                                <div>
                                                    <div className="text-gray-600 dark:text-gray-400">Revenue</div>
                                                    <div className="font-semibold">
                                                        ₹{(asset.revenue / 10000000).toFixed(0)}K Cr
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600 dark:text-gray-400">ROE</div>
                                                    <div className="font-semibold">
                                                        {asset.roe?.toFixed(2) || 'N/A'}%
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                // Fallback to basic comparison data or default
                                selectedAssets.map((asset) => (
                                    <div key={asset} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {asset.replace('.NS', '')}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                                <span className="text-sm font-medium">Loading...</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">Current Price</div>
                                                <div className="font-semibold">Loading...</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">24h Change</div>
                                                <div className="font-semibold">Loading...</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">P/E Ratio</div>
                                                <div className="font-semibold">Loading...</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600 dark:text-gray-400">EPS</div>
                                                <div className="font-semibold">Loading...</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Technical Indicators
                        </h3>
                        
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={technicalData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: 'white', 
                                                border: '1px solid #e5e7eb', 
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#1f2937" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest News & Analysis - Figma Style */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Latest News & Analysis
                    </h3>
                    
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
                        {selectedAssets.map((asset, index) => (
                            <div key={asset} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
                                <div className="space-y-1">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                        {asset.replace('.NS', '')}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                                        {index === 0 ? 'Strong Q3 results boost confidence' : 'Digital transformation deals surge'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    2 hours ago
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Educational Stock Recommendations */}
                {selectedAssets.length > 0 && (
                    <StockRecommendationEngine data={comprehensiveData} />
                )}

                {/* Stock Comparison Table */}
                {selectedAssets.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Detailed Stock Comparison
                        </h3>
                        <ComprehensiveComparisonTable 
                            data={comprehensiveData} 
                            loading={comprehensiveLoading} 
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
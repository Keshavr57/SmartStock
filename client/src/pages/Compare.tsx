import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { X, ArrowLeftRight, Plus, Search, BarChart2 } from 'lucide-react'
import { compareAssets, getAssetsHistory, getComprehensiveComparison } from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import ComprehensiveComparisonTable from '@/components/ComprehensiveComparisonTable'

export default function Compare() {
    const [selectedAssets, setSelectedAssets] = useState<string[]>(['RELIANCE.NS', 'TCS.NS'])
    const [comparisonData, setComparisonData] = useState<any[]>([])
    const [comprehensiveData, setComprehensiveData] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            if (selectedAssets.length === 0) {
                setComparisonData([])
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
                    setComparisonData(basicRes.value.comparison)
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

    return (
        <div className="p-6 container mx-auto space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center text-white shadow-lg">
                        <ArrowLeftRight className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Compare Assets</h1>
                        <p className="text-muted-foreground text-lg">Comprehensive side-by-side analysis of stocks and crypto.</p>
                    </div>
                </div>
            </div>

            {/* Asset Selection */}
            <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b">
                    <CardTitle className="text-xl">Asset Selection</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by symbol (e.g. RELIANCE.NS, BTC-USD, AAPL)..."
                                className="pl-10 h-11 rounded-xl bg-background/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addAsset(searchQuery)}
                            />
                        </div>
                        <Button
                            className="h-11 px-8 rounded-xl premium-gradient shadow-md"
                            onClick={() => addAsset(searchQuery)}
                            disabled={!searchQuery.trim() || selectedAssets.length >= 3}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Asset
                        </Button>
                    </div>

                    <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="text-amber-600 mt-1">
                            <ArrowLeftRight className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <span className="font-bold text-amber-900 dark:text-amber-200">Important for Indian Stocks:</span> Always add <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 font-bold font-mono">.NS</code> (e.g., <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 font-bold font-mono">TCS.NS</code>) to fetch real-time NSE data.
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        {selectedAssets.map(asset => (
                            <div key={asset} className="flex items-center gap-3 bg-primary/5 text-primary px-4 py-2 rounded-xl border border-primary/20 font-bold group shadow-sm">
                                <span>{asset}</span>
                                <X
                                    className="h-4 w-4 cursor-pointer hover:text-red-500 transition-colors"
                                    onClick={() => removeAsset(asset)}
                                />
                            </div>
                        ))}
                        {selectedAssets.length === 0 && (
                            <p className="text-muted-foreground text-sm">Add assets to start comparing.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Price Chart */}
            <Card className="border-muted/50 overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle>Price Performance (1 Month)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[400px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline))" opacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value.toLocaleString()}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        labelClassName="font-bold border-b pb-1 mb-2"
                                    />
                                    {selectedAssets.map((asset, i) => (
                                        <Line
                                            key={asset}
                                            type="monotone"
                                            dataKey={asset}
                                            stroke={i === 0 ? '#2563eb' : i === 1 ? '#9333ea' : '#10b981'}
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            animationDuration={1000}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center flex-col gap-4 text-muted-foreground">
                                <BarChart2 className="h-12 w-12 opacity-20" />
                                <p>{loading ? 'Loading market data...' : 'No historical data available for selected assets.'}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Comprehensive Comparison Table */}
            <ComprehensiveComparisonTable 
                data={comprehensiveData} 
                loading={comprehensiveLoading} 
            />
        </div>
    )
}

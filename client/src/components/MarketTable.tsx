import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketHighlights, getMarketCharts } from "@/lib/api"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"

export function MarketTable() {
    const [quickAssets, setQuickAssets] = useState<any[]>([])
    const [chartsData, setChartsData] = useState<any>(null)
    const [selectedChart, setSelectedChart] = useState<'nifty' | 'sp500' | 'btc'>('nifty')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                
                // Fetch market highlights
                const marketRes = await getMarketHighlights()
                if (marketRes.status === "success" && marketRes.data) {
                    const stocks = Array.isArray(marketRes.data.stocks) ? marketRes.data.stocks : []
                    const crypto = Array.isArray(marketRes.data.crypto) ? marketRes.data.crypto : []
                    const combined = [
                        ...stocks.slice(0, 2),
                        ...crypto.slice(0, 2)
                    ]
                    setQuickAssets(combined)
                }

                // Fetch charts data
                const chartsRes = await getMarketCharts()
                if (chartsRes.status === "success" && chartsRes.charts) {
                    setChartsData(chartsRes.charts)
                }
            } catch (error) {
                console.error("Failed to fetch market data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const getCurrentChart = () => {
        if (!chartsData) return null
        return chartsData[selectedChart]
    }

    const currentChart = getCurrentChart()

    return (
        <section className="py-12 px-4 container mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Market Performance Overview</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant={selectedChart === 'nifty' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedChart('nifty')}
                                    className="text-xs"
                                >
                                    NIFTY 50
                                </Button>
                                <Button
                                    variant={selectedChart === 'sp500' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedChart('sp500')}
                                    className="text-xs"
                                >
                                    S&P 500
                                </Button>
                                <Button
                                    variant={selectedChart === 'btc' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedChart('btc')}
                                    className="text-xs"
                                >
                                    BTC
                                </Button>
                            </div>
                        </div>
                        {currentChart && (
                            <div className="flex items-center gap-4 mt-2">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {currentChart.name === 'Bitcoin' ? '$' : ''}
                                        {currentChart.currentPrice?.toLocaleString()}
                                    </p>
                                    <p className={`text-sm ${currentChart.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {currentChart.change >= 0 ? '+' : ''}{currentChart.change?.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full min-h-[350px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : currentChart ? (
                                <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                                    <AreaChart data={currentChart.data}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={currentChart.color} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={currentChart.color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
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
                                            tickFormatter={(v) => `${v.toLocaleString()}`} 
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                            }}
                                            formatter={(value: any) => [
                                                `${currentChart.name === 'Bitcoin' ? '$' : ''}${value.toLocaleString()}`,
                                                currentChart.name
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={currentChart.color}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Failed to load chart data
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Trades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {quickAssets.map((asset) => (
                                <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full premium-gradient flex items-center justify-center text-white font-bold text-xs">
                                            {asset.symbol.substring(0, 3)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{asset.symbol}</p>
                                            <p className="text-xs text-muted-foreground">{asset.name || 'Market Asset'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">
                                            {asset.price.toLocaleString(undefined, { style: 'currency', currency: asset.symbol.length > 3 ? 'INR' : 'USD' })}
                                        </p>
                                        <p className={`text-xs ${asset.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full premium-gradient font-bold h-12">Analyze New Asset</Button>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketHighlights, getMarketCharts } from "@/lib/api"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

export function MarketTable() {
    const [marketData, setMarketData] = useState<any>({ stocks: [], crypto: [] })
    const [chartsData, setChartsData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                
                // Fetch market data
                const marketRes = await getMarketHighlights()
                if (marketRes.status === "success" && marketRes.data) {
                    const stocks = Array.isArray(marketRes.data.stocks) ? marketRes.data.stocks : []
                    const crypto = Array.isArray(marketRes.data.crypto) ? marketRes.data.crypto : []
                    setMarketData({ stocks, crypto })
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

    if (loading) {
        return (
            <section className="py-8 px-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-8 px-6 max-w-7xl mx-auto">
            {/* Market Analytics Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Market Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Visualize market trends and make informed decisions with our comprehensive charts and analytics
                </p>
            </div>

            {/* Market Data Tables - Figma Design */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {/* Trending Indian Stocks */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                📈 Trending Indian Stocks
                            </h3>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                Live NSE/BSE
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {marketData.stocks.slice(0, 4).map((stock: any, index: number) => (
                            <div key={stock.symbol || index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {stock.symbol?.substring(0, 3) || 'REL'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {stock.symbol || 'RELIANCE'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Vol: {stock.volume || '12 M'} • NSE
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            ₹{stock.price?.toLocaleString() || '2,847.50'}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {(stock.change || 1.68) > 0 ? (
                                                <ChevronUp className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={`text-xs font-medium ${
                                                (stock.change || 1.68) > 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {(stock.change || 1.68) > 0 ? '+' : ''}{stock.change?.toFixed(2) || '+1.68'}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Global Cryptocurrency */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                🌍 Global Cryptocurrency
                            </h3>
                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                Live Global
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {marketData.crypto.slice(0, 4).map((crypto: any, index: number) => (
                            <div key={crypto.symbol || index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                                            {crypto.symbol?.substring(0, 3) || 'BTC'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {crypto.symbol || 'Bitcoin'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Cap: ${crypto.marketCap || '43,750'} • {crypto.exchange || 'Global'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            ${crypto.price?.toLocaleString() || '43,750.00'}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {(crypto.change || 4.82) > 0 ? (
                                                <ChevronUp className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={`text-xs font-medium ${
                                                (crypto.change || 4.82) > 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {(crypto.change || 4.82) > 0 ? '+' : ''}{crypto.change?.toFixed(2) || '+4.82'}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Section - Figma Design */}
            <div className="mt-16">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* S&P 500 Performance Chart */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            S&P 500 Performance
                        </h3>
                        <div className="h-[300px] w-full">
                            {chartsData?.sp500 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartsData.sp500.data}>
                                        <defs>
                                            <linearGradient id="sp500Gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
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
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#8884d8"
                                            fillOpacity={1}
                                            fill="url(#sp500Gradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="animate-pulse">Loading S&P 500 data...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Crypto Market Trends Chart */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Crypto Market Trends
                        </h3>
                        <div className="h-[300px] w-full">
                            {chartsData?.btc ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartsData.btc.data}>
                                        <defs>
                                            <linearGradient id="cryptoGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
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
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#f7931a"
                                            fillOpacity={1}
                                            fill="url(#cryptoGradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="animate-pulse">Loading crypto data...</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
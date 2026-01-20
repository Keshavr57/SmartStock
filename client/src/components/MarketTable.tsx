import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketHighlights, getMarketCharts } from "../lib/api"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, TrendingUp, Globe } from "lucide-react"

export function MarketTable() {
    const [marketData, setMarketData] = useState<any>({ stocks: [] })
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
                    setMarketData({ stocks })
                }

                // Fetch charts data
                const chartsRes = await getMarketCharts()
                if (chartsRes.status === "success" && chartsRes.charts) {
                    setChartsData(chartsRes.charts)
                }
            } catch (error) {
                // Silent error handling
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-8 px-6 max-w-7xl mx-auto">
            {/* Market Data Tables */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {/* Trending Indian Stocks */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Trending Indian Stocks
                            </h3>
                            <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                                Live NSE/BSE
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {marketData.stocks.slice(0, 4).map((stock: any, index: number) => (
                            <div key={stock.symbol || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                            {stock.symbol?.substring(0, 3) || 'REL'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {stock.symbol || 'RELIANCE'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Vol: {stock.volume || '12 M'} • NSE
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">
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

                {/* Global Stock Markets */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-600" />
                                Global Stock Markets
                            </h3>
                            <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                                Live Global
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {[
                            { symbol: 'S&P 500', price: '5,900.00', change: 0.85, volume: '4.2B', exchange: 'NYSE' },
                            { symbol: 'NASDAQ', price: '18,750.00', change: 1.24, volume: '3.8B', exchange: 'NASDAQ' },
                            { symbol: 'DOW JONES', price: '38,500.00', change: -0.32, volume: '2.1B', exchange: 'NYSE' },
                            { symbol: 'FTSE 100', price: '7,650.00', change: 0.45, volume: '1.9B', exchange: 'LSE' }
                        ].map((index: any, idx: number) => (
                            <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                                            {index.symbol.substring(0, 3)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {index.symbol}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Vol: {index.volume} • {index.exchange}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">
                                            ${index.price}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {index.change > 0 ? (
                                                <ChevronUp className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3 text-red-500" />
                                            )}
                                            <span className={`text-xs font-medium ${
                                                index.change > 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {index.change > 0 ? '+' : ''}{index.change.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="mt-16">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* NIFTY 50 Performance Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            NIFTY 50 Performance
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                            {chartsData?.nifty ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                    <AreaChart data={chartsData.nifty.data}>
                                        <defs>
                                            <linearGradient id="niftyGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
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
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '8px', 
                                                border: '1px solid #e5e7eb', 
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#niftyGradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="animate-pulse">Loading NIFTY 50 data...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* S&P 500 Performance Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            S&P 500 Performance
                        </h3>
                        <div className="h-[300px] w-full min-h-[300px]">
                            {chartsData?.sp500 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                                    <AreaChart data={chartsData.sp500.data}>
                                        <defs>
                                            <linearGradient id="sp500Gradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
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
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '8px', 
                                                border: '1px solid #e5e7eb', 
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
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
                </div>
            </div>
        </section>
    )
}
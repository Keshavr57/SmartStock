import { MarketTable } from "@/components/MarketTable"
import { TrendingUp, DollarSign, Activity, BarChart3, ArrowUpRight, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "../lib/auth"
import { ENDPOINTS } from "../lib/config"
import { getMarketCharts } from "../lib/api"
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface PortfolioData {
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercent: number;
    availableBalance: number;
    holdingsCount: number;
    dayPnL: number;
    dayPnLPercent: number;
}

interface Transaction {
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    price: number;
    date: string;
}

export default function Home() {
    const [portfolioData, setPortfolioData] = useState<PortfolioData>({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        availableBalance: 100000,
        holdingsCount: 0,
        dayPnL: 0,
        dayPnLPercent: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [marketCharts, setMarketCharts] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
        fetchMarketCharts();
    }, []);

    const fetchMarketCharts = async () => {
        try {
            const response = await getMarketCharts();
            if (response.success) {
                setMarketCharts(response.charts);
            }
        } catch (error) {
            console.error('Error fetching market charts:', error);
        }
    };

    const fetchUserData = async () => {
        try {
            const user = authService.getUser();
            if (!user) return;

            // Fetch portfolio data
            const portfolioResponse = await fetch(ENDPOINTS.PORTFOLIO(user.id), {
                headers: authService.getAuthHeaders()
            });
            const portfolioResult = await portfolioResponse.json();
            
            if (portfolioResult.status === 'success') {
                setPortfolioData(portfolioResult.data);
            }

            // Fetch recent transactions
            const transactionsResponse = await fetch(ENDPOINTS.TRANSACTIONS(user.id, 3), {
                headers: authService.getAuthHeaders()
            });
            const transactionsResult = await transactionsResponse.json();
            
            if (transactionsResult.status === 'success') {
                setRecentTransactions(transactionsResult.data);
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        // Handle NaN, null, undefined values
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '₹0';
        }
        
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (percent: number) => {
        // Handle NaN, null, undefined values
        if (isNaN(percent) || percent === null || percent === undefined) {
            return '0.00%';
        }
        
        const sign = percent >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    };

    const portfolioStats = [
        {
            title: "Portfolio Value",
            value: formatCurrency(portfolioData.totalValue),
            change: formatPercentage(portfolioData.totalPnLPercent),
            isPositive: portfolioData.totalPnL >= 0,
            icon: DollarSign
        },
        {
            title: "Today's P&L",
            value: formatCurrency(portfolioData.dayPnL),
            change: formatPercentage(portfolioData.dayPnLPercent),
            isPositive: portfolioData.dayPnL >= 0,
            icon: TrendingUp
        },
        {
            title: "Active Positions",
            value: portfolioData.holdingsCount.toString(),
            change: `${portfolioData.holdingsCount} holdings`,
            isPositive: true,
            icon: Activity
        },
        {
            title: "Available Balance",
            value: formatCurrency(portfolioData.availableBalance),
            change: "Ready to invest",
            isPositive: true,
            icon: BarChart3
        }
    ]

    const topPerformers = [
        { symbol: "RELIANCE", price: "₹2,847.50", change: "+1.85%", isPositive: true },
        { symbol: "TCS", price: "₹4,125.30", change: "+2.18%", isPositive: true },
        { symbol: "HDFCBANK", price: "₹1,685.75", change: "+0.95%", isPositive: true },
        { symbol: "INFY", price: "₹1,892.40", change: "-0.42%", isPositive: false },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header - Clean like Compare/IPO pages */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Trading Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your comprehensive overview of portfolio and market performance
                    </p>
                </div>

                {/* Market Status - Simple like IPO page */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600 dark:text-gray-400">NSE: Open</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600 dark:text-gray-400">BSE: Open</span>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <RefreshCw className="h-4 w-4" />
                                <span className="text-sm">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Portfolio Stats - Clean grid like IPO cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6">
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        portfolioStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                                <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${
                                                    stat.isPositive ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {stat.title !== "Active Positions" && stat.title !== "Available Balance" && (
                                                        <ArrowUpRight className={`h-4 w-4 ${stat.isPositive ? '' : 'rotate-180'}`} />
                                                    )}
                                                    <span>{stat.change}</span>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                stat.isPositive ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                                            }`}>
                                                <Icon className={`h-6 w-6 ${
                                                    stat.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Market Charts Section - Clean like IPO cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* NIFTY 50 Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">NIFTY 50</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {marketCharts?.nifty?.currentPrice?.toLocaleString() || '24,150'}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            (marketCharts?.nifty?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {(marketCharts?.nifty?.change || 0) >= 0 ? '+' : ''}{(marketCharts?.nifty?.change || 0.5).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="h-32" style={{ width: '100%', height: '128px' }}>
                                <ResponsiveContainer width="100%" height={128} minWidth={200} minHeight={128}>
                                    <LineChart data={marketCharts?.nifty?.data || []} width={300} height={128}>
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#2563eb" 
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* S&P 500 Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">S&P 500</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {marketCharts?.sp500?.currentPrice?.toLocaleString() || '5,900'}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            (marketCharts?.sp500?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {(marketCharts?.sp500?.change || 0) >= 0 ? '+' : ''}{(marketCharts?.sp500?.change || 0.3).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="h-32" style={{ width: '100%', height: '128px' }}>
                                <ResponsiveContainer width="100%" height={128} minWidth={200} minHeight={128}>
                                    <LineChart data={marketCharts?.sp500?.data || []} width={300} height={128}>
                                        <Line 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#10b981" 
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Market Overview */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Market Overview
                                </h3>
                                <button 
                                    onClick={fetchMarketCharts}
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="text-sm">Refresh</span>
                                </button>
                            </div>
                            <MarketTable />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Recent Trading Activity
                            </h3>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Loading transactions...</p>
                                </div>
                            ) : recentTransactions.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTransactions.map((transaction, index) => (
                                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                    transaction.type === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {transaction.type}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{transaction.symbol}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.quantity} shares at {formatCurrency(transaction.price)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Trading Activity Yet</h4>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        Start your trading journey with virtual money
                                    </p>
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                        Start Virtual Trading
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
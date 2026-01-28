import { MarketTable } from "@/components/MarketTable"
import { TrendingUp, DollarSign, Activity, BarChart3, ArrowUpRight, RefreshCw, TrendingDown } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "../lib/auth"
import { ENDPOINTS } from "../lib/config"
import { formatCurrency, formatPercentage } from "../lib/currency"

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = authService.getUser();
            if (!user) return;

            const portfolioResponse = await fetch(ENDPOINTS.PORTFOLIO(user.id), {
                headers: authService.getAuthHeaders()
            });
            const portfolioResult = await portfolioResponse.json();
            
            if (portfolioResult.status === 'success') {
                setPortfolioData(portfolioResult.data);
            }

            const transactionsResponse = await fetch(ENDPOINTS.TRANSACTIONS(user.id, 3), {
                headers: authService.getAuthHeaders()
            });
            const transactionsResult = await transactionsResponse.json();
            
            if (transactionsResult.status === 'success') {
                setRecentTransactions(transactionsResult.data);
            }

        } catch (error) {
            // Silent error handling
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Trading Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your comprehensive overview of portfolio and market performance
                    </p>
                </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {loading ? (
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Top Gainers
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">NSE</span>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2485, change: 8.2, volume: '2.1M' },
                                    { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 785, change: 6.8, volume: '5.3M' },
                                    { symbol: 'JSWSTEEL', name: 'JSW Steel', price: 985, change: 5.4, volume: '3.2M' },
                                    { symbol: 'COALINDIA', name: 'Coal India', price: 385, change: 4.9, volume: '1.8M' },
                                    { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 285, change: 4.2, volume: '4.1M' }
                                ].map((stock, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-green-800 dark:text-green-200">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{stock.symbol}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">₹{stock.price}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-green-600">+{stock.change}%</span>
                                                <span className="text-xs text-gray-500">{stock.volume}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                    Top Losers
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">NSE</span>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { symbol: 'PAYTM', name: 'Paytm', price: 985, change: -5.2, volume: '3.8M' },
                                    { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 945, change: -4.8, volume: '2.1M' },
                                    { symbol: 'ASIANPAINT', name: 'Asian Paints', price: 2420, change: -3.9, volume: '1.2M' },
                                    { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', price: 11800, change: -3.1, volume: '0.8M' },
                                    { symbol: 'NESTLEIND', name: 'Nestle India', price: 2180, change: -2.8, volume: '0.5M' }
                                ].map((stock, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-red-800 dark:text-red-200">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{stock.symbol}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">₹{stock.price}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-red-600">{stock.change}%</span>
                                                <span className="text-xs text-gray-500">{stock.volume}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Market Overview
                                </h3>
                            </div>
                            <MarketTable />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Recent Trading Activity
                            </h3>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
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
                                    <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
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
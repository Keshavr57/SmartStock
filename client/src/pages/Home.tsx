import { MarketTable } from "@/components/MarketTable"
import { TrendingUp, DollarSign, Activity, BarChart3, ArrowUpRight, Eye, BookOpen, Brain, Newspaper, Clock, Star, Target, Zap, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"

export default function Home() {
    const [portfolioData, setPortfolioData] = useState({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        availableBalance: 100000,
        holdingsCount: 0,
        dayPnL: 0,
        dayPnLPercent: 0
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = authService.getUser();
            if (!user) return;

            // Fetch portfolio data
            const portfolioResponse = await fetch(`http://localhost:5050/api/virtual/portfolio/${user.id}`, {
                headers: authService.getAuthHeaders()
            });
            const portfolioResult = await portfolioResponse.json();
            
            if (portfolioResult.status === 'success') {
                setPortfolioData(portfolioResult.data);
            }

            // Fetch recent transactions
            const transactionsResponse = await fetch(`http://localhost:5050/api/virtual/transactions/${user.id}?limit=3`, {
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (percent) => {
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

    const quickActions = [
        {
            title: "Virtual Trading",
            description: "Start trading with virtual money",
            icon: TrendingUp,
            color: "bg-blue-600 hover:bg-blue-700"
        },
        {
            title: "AI Advisor",
            description: "Get smart trading insights",
            icon: Brain,
            color: "bg-green-600 hover:bg-green-700"
        },
        {
            title: "Compare Stocks",
            description: "Analyze stock performance",
            icon: BarChart3,
            color: "bg-purple-600 hover:bg-purple-700"
        },
        {
            title: "View Portfolio",
            description: "Check your holdings",
            icon: Eye,
            color: "bg-orange-600 hover:bg-orange-700"
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
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Crypto: 24/7</span>
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

                {/* Quick Actions - Simple grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                className={`${action.color} text-white p-6 rounded-lg transition-colors text-left hover:shadow-md`}
                            >
                                <Icon className="h-8 w-8 mb-3" />
                                <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                                <p className="text-sm opacity-90">{action.description}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content - Two column layout like Compare page */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Market Overview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Market Overview */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Market Overview
                            </h3>
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6">
                                    <MarketTable />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Recent Trading Activity
                            </h3>
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6">
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

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Top Performers */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                Top Performers
                            </h3>
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6 space-y-4">
                                    {topPerformers.map((stock, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{stock.symbol}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{stock.price}</p>
                                            </div>
                                            <div className={`text-right font-semibold ${
                                                stock.isPositive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {stock.change}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Quick Links
                            </h3>
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="p-6 space-y-2">
                                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <Newspaper className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">Latest Market News</span>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">Upcoming IPOs</span>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">Learning Resources</span>
                                    </button>
                                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">Set Price Alerts</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
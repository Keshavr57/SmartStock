import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, RefreshCw, BarChart3, User, Mail, Calendar, Settings } from 'lucide-react';
import RealTimePnL from '../components/trading/RealTimePnL';

interface PortfolioSummary {
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercent: number;
    availableBalance: number;
    holdingsCount: number;
    dayPnL: number;
    dayPnLPercent: number;
}

interface Holding {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    pnl: number;
    pnlPercent: number;
    sector: string;
}

const Portfolio: React.FC = () => {
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState<any>(null);
    
    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        
        fetchPortfolioData();
        const interval = setInterval(fetchPortfolioData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchPortfolioData = async () => {
        try {
            setLoading(true);
            
            // Get user from localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                console.error('No user data found');
                return;
            }
            
            const currentUser = JSON.parse(userData);
            const userId = currentUser.id;
            
            // Fetch portfolio summary
            const summaryResponse = await fetch(`http://localhost:5050/api/virtual/portfolio/${userId}`);
            const summaryData = await summaryResponse.json();
            
            // Fetch holdings
            const holdingsResponse = await fetch(`http://localhost:5050/api/virtual/holdings/${userId}`);
            const holdingsData = await holdingsResponse.json();
            
            if (summaryData.status === 'success') {
                setPortfolioSummary(summaryData.data);
            }
            
            if (holdingsData.status === 'success') {
                // Transform holdings data with real-time prices
                const transformedHoldings = await Promise.all(
                    holdingsData.data.map(async (holding: any) => {
                        let currentPrice = holding.avgPrice;
                        
                        try {
                            const priceResponse = await fetch(`http://localhost:5050/api/virtual/quote/${holding.symbol}`);
                            const priceData = await priceResponse.json();
                            if (priceData.status === 'success' && priceData.data.price) {
                                currentPrice = priceData.data.price;
                            }
                        } catch (error) {
                            console.log(`Could not fetch price for ${holding.symbol}`);
                        }
                        
                        const marketValue = currentPrice * holding.quantity;
                        const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
                        const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                        
                        return {
                            symbol: holding.symbol,
                            name: holding.name || holding.symbol,
                            quantity: holding.quantity,
                            avgPrice: holding.avgPrice,
                            currentPrice,
                            marketValue,
                            pnl,
                            pnlPercent,
                            sector: holding.sector || 'Unknown'
                        };
                    })
                );
                
                setHoldings(transformedHoldings);
            }
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieChart },
        { id: 'holdings', label: 'Holdings', icon: BarChart3 },
        { id: 'pnl', label: 'Real-Time P&L', icon: Activity },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    if (loading && !portfolioSummary) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading your portfolio...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
                            <p className="text-gray-600 mt-1">Track your investments and performance</p>
                        </div>
                        <button
                            onClick={fetchPortfolioData}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Portfolio Summary Cards */}
                {portfolioSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Value */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(portfolioSummary.totalValue)}
                                    </p>
                                </div>
                                <PieChart className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        {/* Total P&L */}
                        <div className={`rounded-lg shadow-sm p-6 ${
                            portfolioSummary.totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total P&L</p>
                                    <p className={`text-2xl font-bold ${
                                        portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(portfolioSummary.totalPnL)}
                                    </p>
                                    <p className={`text-sm ${
                                        portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {portfolioSummary.totalPnL >= 0 ? '+' : ''}{portfolioSummary.totalPnLPercent.toFixed(2)}%
                                    </p>
                                </div>
                                {portfolioSummary.totalPnL >= 0 ? (
                                    <TrendingUp className="h-8 w-8 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-8 w-8 text-red-500" />
                                )}
                            </div>
                        </div>

                        {/* Available Balance */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Available Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(portfolioSummary.availableBalance)}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        {/* Holdings Count */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Holdings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {portfolioSummary.holdingsCount}
                                    </p>
                                    <p className="text-sm text-gray-500">Active positions</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
                                
                                {user ? (
                                    <div className="max-w-2xl">
                                        {/* Profile Header */}
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                                            <div className="flex items-center space-x-4">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="Profile" className="h-16 w-16 rounded-full border-4 border-white" />
                                                ) : (
                                                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                                        <User className="h-8 w-8 text-white" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                                    <p className="text-blue-100">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Mail className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">Email</span>
                                                </div>
                                                <p className="text-gray-700">{user.email}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <DollarSign className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">Virtual Balance</span>
                                                </div>
                                                <p className="text-gray-700">₹{user.virtualBalance?.toLocaleString('en-IN') || '1,00,000'}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Calendar className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">Member Since</span>
                                                </div>
                                                <p className="text-gray-700">January 2025</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <Activity className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-900">Account Type</span>
                                                </div>
                                                <p className="text-gray-700">Virtual Trading</p>
                                            </div>
                                        </div>

                                        {/* Account Settings */}
                                        <div className="mt-8">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h4>
                                            <div className="space-y-3">
                                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3">
                                                    <Settings className="h-5 w-5 text-gray-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Edit Profile</p>
                                                        <p className="text-sm text-gray-600">Update your name and preferences</p>
                                                    </div>
                                                </button>
                                                
                                                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3">
                                                    <RefreshCw className="h-5 w-5 text-gray-600" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Reset Virtual Balance</p>
                                                        <p className="text-sm text-gray-600">Reset to ₹1,00,000 starting balance</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Please login to view your profile</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Portfolio Overview</h3>
                                
                                {holdings.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {holdings.slice(0, 6).map((holding) => (
                                            <div key={holding.symbol} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{holding.symbol}</h4>
                                                        <p className="text-sm text-gray-600">{holding.name}</p>
                                                        <p className="text-xs text-gray-500">{holding.quantity} shares</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">
                                                            {formatCurrency(holding.marketValue)}
                                                        </p>
                                                        <p className={`text-sm ${
                                                            holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                                                        </p>
                                                        <p className={`text-xs ${
                                                            holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No holdings found</p>
                                        <p className="text-sm text-gray-500">Start trading to build your portfolio</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'holdings' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">All Holdings</h3>
                                
                                {holdings.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Value</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {holdings.map((holding) => (
                                                    <tr key={holding.symbol} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <div className="font-medium text-gray-900">{holding.symbol}</div>
                                                                <div className="text-sm text-gray-600">{holding.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-gray-900">{holding.quantity}</td>
                                                        <td className="px-4 py-4 text-gray-900">{formatCurrency(holding.avgPrice)}</td>
                                                        <td className="px-4 py-4 text-gray-900">{formatCurrency(holding.currentPrice)}</td>
                                                        <td className="px-4 py-4 text-gray-900">{formatCurrency(holding.marketValue)}</td>
                                                        <td className="px-4 py-4">
                                                            <div className={`${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                <div className="font-medium">
                                                                    {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                                                                </div>
                                                                <div className="text-sm">
                                                                    {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No holdings found</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pnl' && (
                            <RealTimePnL userId={userId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
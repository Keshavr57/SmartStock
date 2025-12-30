import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Clock, Search, Plus, Minus } from 'lucide-react';
import TradingViewChart from '../components/trading/TradingViewChart';
import OrderPanel from '../components/trading/OrderPanel';
import PortfolioSummary from '../components/trading/PortfolioSummary';
import Holdings from '../components/trading/Holdings';
import Watchlist from '../components/trading/Watchlist';
import TransactionHistory from '../components/trading/TransactionHistory';
import RealTimePnL from '../components/trading/RealTimePnL';
import { authService } from '@/lib/auth';
import { ENDPOINTS } from '@/lib/config';

interface PortfolioData {
    balance: number;
    totalValue: number;
    invested: number;
    currentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    holdingsCount: number;
    transactionsCount: number;
}

interface MarketStatus {
    isOpen: boolean;
    status: string;
}

interface SearchResult {
    symbol: string;
    name: string;
    price: number;
}

const VirtualTrading: React.FC = () => {
    const [activeTab, setActiveTab] = useState('portfolio');
    const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showOrderPanel, setShowOrderPanel] = useState(false);
    const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');

    useEffect(() => {
        fetchPortfolioData();
        fetchMarketStatus();
        const interval = setInterval(() => {
            fetchPortfolioData();
            fetchMarketStatus();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.PORTFOLIO(user.id), {
                headers: authService.getAuthHeaders()
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPortfolioData(data.data);
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        }
    };

    const fetchMarketStatus = async () => {
        try {
            const response = await fetch(ENDPOINTS.MARKET_STATUS);
            const data = await response.json();
            if (data.status === 'success') {
                setMarketStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching market status:', error);
        }
    };

    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(ENDPOINTS.SEARCH(query));
            const data = await response.json();
            if (data.status === 'success') {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error('Error searching stocks:', error);
        }
    };

    const handleStockSelect = (symbol: string) => {
        setSelectedStock(symbol);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleOrderClick = (type: 'BUY' | 'SELL') => {
        setOrderType(type);
        setShowOrderPanel(true);
    };

    const tabs = [
        { id: 'portfolio', label: 'Portfolio', icon: PieChart },
        { id: 'pnl', label: 'Real-Time P&L', icon: Activity },
        { id: 'holdings', label: 'Holdings', icon: DollarSign },
        { id: 'watchlist', label: 'Watchlist', icon: Activity },
        { id: 'transactions', label: 'Transactions', icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Trading</h1>
                    <p className="text-gray-600">Practice trading with real market data</p>
                    
                    {/* Market Status */}
                    {marketStatus && (
                        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg mt-4 ${
                            marketStatus.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                marketStatus.isOpen ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium">{marketStatus.status}</span>
                        </div>
                    )}
                </div>

                {/* Stock Search */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search stocks (e.g., RELIANCE, TCS, INFY)"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                handleSearch(e.target.value);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                                {searchResults.map((stock: any) => (
                                    <button
                                        key={stock.symbol}
                                        onClick={() => handleStockSelect(stock.symbol)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                                        <div className="text-sm text-gray-600">{stock.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Chart */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900">{selectedStock}</h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleOrderClick('BUY')}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Buy</span>
                                        </button>
                                        <button
                                            onClick={() => handleOrderClick('SELL')}
                                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <Minus className="h-4 w-4" />
                                            <span>Sell</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <TradingViewChart symbol={selectedStock} height={500} />
                        </div>
                    </div>

                    {/* Right Panel - Portfolio Summary */}
                    <div>
                        {portfolioData && <PortfolioSummary data={portfolioData} />}
                    </div>
                </div>

                {/* Portfolio Stats Cards */}
                {portfolioData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ₹{portfolioData.totalValue?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Available Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ₹{portfolioData.balance?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total P&L</p>
                                    <p className={`text-2xl font-bold ${
                                        portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        ₹{portfolioData.totalPnL?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                {portfolioData.totalPnL >= 0 ? (
                                    <TrendingUp className="h-8 w-8 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-8 w-8 text-red-500" />
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Holdings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {portfolioData.holdingsCount}
                                    </p>
                                </div>
                                <PieChart className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs Section */}
                <div className="mt-8">
                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6">
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
                            {activeTab === 'portfolio' && portfolioData && (
                                <div className="text-center py-8">
                                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Portfolio Overview</h3>
                                    <p className="text-gray-600">Your portfolio statistics are displayed in the cards above</p>
                                </div>
                            )}
                            
                            {activeTab === 'pnl' && <RealTimePnL />}
                            {activeTab === 'holdings' && <Holdings />}
                            {activeTab === 'watchlist' && <Watchlist onStockSelect={handleStockSelect} />}
                            {activeTab === 'transactions' && <TransactionHistory />}
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                        <strong>Virtual Trading:</strong> This is a simulation using real market data. No actual money is involved. Use this platform to practice and learn trading strategies.
                    </p>
                </div>
            </div>

            {/* Order Panel Modal */}
            {showOrderPanel && (
                <OrderPanel
                    symbol={selectedStock}
                    type={orderType}
                    onClose={() => setShowOrderPanel(false)}
                    onOrderComplete={() => {
                        setShowOrderPanel(false);
                        fetchPortfolioData();
                    }}
                />
            )}
        </div>
    );
};

export default VirtualTrading;
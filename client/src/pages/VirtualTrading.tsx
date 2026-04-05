import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, Clock, Search, Plus, Minus } from 'lucide-react';
import TradingViewChart from '../components/trading/TradingViewChart';
import OrderPanel from '../components/trading/OrderPanel';
import PortfolioSummary from '../components/trading/PortfolioSummary';
import Holdings from '../components/trading/Holdings';
import Watchlist from '../components/trading/Watchlist';
import TransactionHistory from '../components/trading/TransactionHistory';
import RealTimePnL from '../components/trading/RealTimePnL';
import { authService } from '../lib/auth';
import { api } from '../lib/api';
import { ENDPOINTS } from '../lib/config';
import { formatCurrency, formatCurrencyWithSign } from '../lib/currency';

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
    const [activeTab, setActiveTab] = useState('watchlist');
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

        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const user = authService.getUser();
            if (!user) {

                return;
            }

            const response = await api.get(`/trading/portfolio/${user.id}`);
            if (response.data.status === 'success') {
                setPortfolioData(response.data.data);
            }
        } catch (error) {

            // Set default portfolio data to prevent blank screen
            setPortfolioData({
                balance: 100000, // ₹1 Lakh starting balance
                totalValue: 100000,
                invested: 0,
                currentValue: 0,
                totalPnL: 0,
                totalPnLPercent: 0,
                holdingsCount: 0,
                transactionsCount: 0
            });
        }
    };

    const fetchMarketStatus = async () => {
        try {
            const response = await api.get('/trading/market-status');
            if (response.data.status === 'success') {
                setMarketStatus(response.data.data);
            }
        } catch (error) {

            // Set default market status with proper IST timing
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
            const currentHour = istTime.getHours() + istTime.getMinutes() / 60;
            const isWeekday = istTime.getDay() >= 1 && istTime.getDay() <= 5;
            const isMarketOpen = isWeekday && currentHour >= 9.25 && currentHour <= 15.5;
            
            setMarketStatus({
                isOpen: isMarketOpen,
                status: isMarketOpen ? 'Market Open (NSE/BSE)' : 'Market Closed'
            });
        }
    };

    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await api.get(`/trading/search/${query}`);
            if (response.data.status === 'success') {
                setSearchResults(response.data.data);
            }
        } catch (error) {

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
        { id: 'watchlist', label: 'Watchlist' },
        { id: 'holdings', label: 'Holdings' },
        { id: 'transactions', label: 'History' },
        { id: 'pnl', label: 'Real-Time P&L' }
    ];

    return (
        <section className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-[#f9f9ff] dark:bg-slate-900 border-t dark:border-slate-800" id="virtual-trading">
            <div className="flex-1 p-4 md:p-8 space-y-8 flex flex-col">
                <div className="w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search any Indian stock (e.g., RELIANCE, TCS)..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearch(e.target.value);
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-outline-variant/30 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#630ed4]/20 shadow-sm font-bold text-on-surface dark:text-white"
                    />
                    {searchResults.length > 0 && searchQuery && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-20 mt-2 max-h-80 overflow-y-auto">
                            {searchResults.map((stock: any) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleStockSelect(stock.symbol)}
                                    className="w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 last:border-0 transition-colors flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-black text-gray-900 dark:text-white text-lg">{stock.symbol}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stock.name}</div>
                                    </div>
                                    {stock.price && (
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 dark:text-white text-lg">₹{stock.price}</div>
                                            {stock.changePercent && (
                                                <div className={`text-xs font-black ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!searchQuery && (
                    <div className="flex flex-wrap gap-2">
                        {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS'].map(sym => (
                            <button 
                                key={sym}
                                onClick={() => handleStockSelect(sym)}
                                className={`px-4 py-2 rounded-full border border-outline-variant/30 dark:border-slate-700 text-xs font-bold transition-all shadow-sm ${selectedStock === sym ? 'bg-[#630ed4] text-white border-[#630ed4]' : 'bg-white dark:bg-slate-800 text-on-surface dark:text-slate-300 hover:border-[#630ed4] hover:text-[#630ed4]'}`}
                            >
                                {sym.replace('.NS', '')}
                            </button>
                        ))}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-outline-variant/10 dark:border-slate-700 shadow-sm overflow-visible flex flex-col">
                    <div className="p-8 border-b border-outline-variant/10 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-3xl font-black text-on-surface dark:text-white tracking-tight">{selectedStock}</h3>
                                {marketStatus && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${marketStatus.isOpen ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                                        {marketStatus.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-2 h-96 relative overflow-hidden rounded-none">
                        <TradingViewChart symbol={selectedStock} height={380} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 p-8 border-t border-outline-variant/10 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-3xl">
                        <button onClick={() => handleOrderClick('BUY')} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> BUY {selectedStock.split('.')[0]}
                        </button>
                        <button onClick={() => handleOrderClick('SELL')} className="flex-1 bg-red-500 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Minus className="w-5 h-5" /> SELL {selectedStock.split('.')[0]}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-outline-variant/10 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="flex gap-4 border-b border-outline-variant/30 dark:border-slate-700 px-6 pt-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-2 font-black text-xs tracking-widest transition-all uppercase ${activeTab === tab.id ? 'border-b-2 border-[#630ed4] text-[#630ed4]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-6 flex-1 bg-slate-50/30 dark:bg-slate-900/30">
                        {activeTab === 'pnl' && <RealTimePnL />}
                        {activeTab === 'holdings' && <Holdings />}
                        {activeTab === 'watchlist' && <Watchlist onStockSelect={handleStockSelect} />}
                        {activeTab === 'transactions' && <TransactionHistory />}
                    </div>
                </div>
            </div>

            {/* Virtual Portfolio Sidebar */}
            <div className="w-full lg:w-96 bg-[#e9edff]-container-low dark:bg-slate-900/80 p-8 border-t lg:border-t-0 lg:border-l border-outline-variant/20 dark:border-slate-800 space-y-8 flex flex-col">
                <div className="bg-[#630ed4] p-8 rounded-3xl text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] uppercase font-black opacity-80 mb-1 tracking-widest">Virtual Account Value</p>
                        <h3 className="text-4xl font-black tracking-tight">{formatCurrency(portfolioData?.totalValue || 0)}</h3>
                        <div className="mt-6 flex justify-between items-end border-t border-white/20 pt-4">
                            <span className="text-xs font-bold uppercase opacity-80">Total P&L</span>
                            <span className={`font-black text-lg ${(portfolioData?.totalPnL || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                {formatCurrencyWithSign(portfolioData?.totalPnL || 0)}
                            </span>
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <PieChart className="w-48 h-48 -mr-12 -mb-12" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-on-surface-variant dark:text-slate-400 font-bold text-sm tracking-wide">Cash Balance</span>
                        <span className="font-black text-on-surface dark:text-white text-lg">{formatCurrency(portfolioData?.balance || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <span className="text-on-surface-variant dark:text-slate-400 font-bold text-sm tracking-wide">Invested Assets</span>
                        <span className="font-black text-on-surface dark:text-white text-lg">{formatCurrency(portfolioData?.invested || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 pt-4 border-t border-outline-variant/20 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Return %</span>
                        <span className={`font-black text-lg ${(portfolioData?.totalPnLPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(portfolioData?.totalPnLPercent || 0) >= 0 ? '+' : ''}{(portfolioData?.totalPnLPercent || 0).toFixed(2)}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-slate-700 text-center">
                        <p className="text-3xl font-black text-[#630ed4] mb-2">{portfolioData?.holdingsCount || 0}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Holdings</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-outline-variant/10 dark:border-slate-700 text-center">
                        <p className="text-3xl font-black text-[#630ed4] mb-2">{portfolioData?.transactionsCount || 0}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transactions</p>
                    </div>
                </div>

                <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 leading-relaxed text-center">
                        <strong className="block mb-1 text-sm font-bold uppercase tracking-widest">Practice Account</strong>
                        Prices reflect real-time live data for simulation. No real money used.
                    </p>
                </div>
            </div>

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
        </section>
    );
};

export default VirtualTrading;

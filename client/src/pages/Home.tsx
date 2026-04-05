import { MarketTable } from "@/components/MarketTable"
import { TrendingUp, Activity, BarChart3, ArrowUpRight, RefreshCw, TrendingDown, Wallet, Target, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "../lib/auth"
import { formatCurrency, formatPercentage } from "../lib/currency"
import { api, getTopMovers, getMarketStatus } from "../lib/api"

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
    date?: string;
    timestamp?: string;
    createdAt?: string;
}

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    volume: string;
}

interface TopMoversData {
    gainers: Stock[];
    losers: Stock[];
}

function Home() {
    const [portfolioData, setPortfolioData] = useState<PortfolioData>({
        totalValue: 0, totalInvested: 0, totalPnL: 0, totalPnLPercent: 0,
        availableBalance: 100000, holdingsCount: 0, dayPnL: 0, dayPnLPercent: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [topMovers, setTopMovers] = useState<TopMoversData>({ gainers: [], losers: [] });
    const [marketStatus, setMarketStatus] = useState<any>({ isOpen: false });
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (!userData) { setLoading(false); return; }
            const currentUser = JSON.parse(userData);
            const userId = currentUser.id;
            const response = await api.get(`/trading/portfolio/${userId}`);
            const data = response.data;
            if (data.status === 'success' && data.data) {
                const p = data.data;
                setPortfolioData({
                    totalValue: p.totalValue || 0, totalInvested: p.totalInvested || 0,
                    totalPnL: p.totalPnL || 0, totalPnLPercent: p.totalPnLPercent || 0,
                    availableBalance: p.availableBalance || p.virtualBalance || 100000,
                    holdingsCount: p.holdingsCount || 0, dayPnL: p.dayPnL || 0, dayPnLPercent: p.dayPnLPercent || 0
                });
            }
            const txResponse = await api.get(`/trading/transactions/${userId}?limit=5`);
            const txData = txResponse.data;
            if (txData.status === 'success' && txData.data) setRecentTransactions(txData.data.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopMovers = async () => {
        try {
            const res = await getTopMovers();
            const movers = res?.data || res;
            if (movers?.gainers && movers?.losers) setTopMovers(movers);
        } catch (error) { console.error('Failed to fetch top movers:', error); }
    };

    const fetchMarketStatus = async () => {
        try {
            const data = await getMarketStatus();
            if (data) setMarketStatus(data);
        } catch (error) { console.error('Failed to fetch market status:', error); }
    };

    useEffect(() => {
        fetchUserData(); fetchTopMovers(); fetchMarketStatus();
        const interval = setInterval(() => { fetchTopMovers(); fetchMarketStatus(); }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" id="dashboard">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${marketStatus.isOpen ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></span>
                    NSE {marketStatus.isOpen ? 'Open' : 'Closed'}
                </div>
                <button onClick={() => { fetchTopMovers(); fetchMarketStatus(); }}
                    className="flex items-center gap-2 text-slate-400 hover:text-[#630ed4] font-bold text-xs uppercase tracking-widest transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent dark:from-violet-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portfolio Value</span>
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '...' : formatCurrency(portfolioData.totalValue)}</h3>
                    {!loading && (
                        <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {portfolioData.totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {portfolioData.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnL)} overall
                        </div>
                    )}
                </div>

                <div className={`relative p-6 rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${portfolioData.dayPnL >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider ${portfolioData.dayPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>Today P&L</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${portfolioData.dayPnL >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                            {portfolioData.dayPnL >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                    </div>
                    <h3 className={`text-2xl font-black ${portfolioData.dayPnL >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{loading ? '...' : formatCurrency(portfolioData.dayPnL)}</h3>
                    <div className={`mt-2 text-xs font-bold ${portfolioData.dayPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>{portfolioData.dayPnL >= 0 ? '+' : ''}{formatPercentage(portfolioData.dayPnLPercent)}</div>
                </div>

                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Positions</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '...' : portfolioData.holdingsCount}</h3>
                    <p className="mt-2 text-xs text-slate-400 font-medium">stocks in portfolio</p>
                </div>

                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '...' : formatCurrency(portfolioData.availableBalance)}</h3>
                    <p className="mt-2 text-xs font-bold text-[#630ed4] flex items-center gap-1"><Zap className="w-3 h-3" /> Virtual Credits</p>
                </div>
            </div>

            {/* Quick Insights */}
            {!loading && portfolioData.holdingsCount > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invested</p>
                            <p className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(portfolioData.totalInvested)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${portfolioData.totalPnL >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <TrendingUp className={`w-5 h-5 ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Return</p>
                            <p className={`font-black text-sm ${portfolioData.totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>{portfolioData.totalPnL >= 0 ? '+' : ''}{formatPercentage(portfolioData.totalPnLPercent)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transactions</p>
                            <p className="font-black text-slate-900 dark:text-white text-sm">{recentTransactions.length} recent</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Gainers & Losers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <h4 className="font-black text-base flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-green-600" /></span>
                            Top Gainers
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full uppercase">NSE</span>
                    </div>
                    <div className="space-y-1">
                        {loading ? [1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />) :
                        topMovers.gainers?.length > 0 ? topMovers.gainers.slice(0, 5).map((stock, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-400 flex items-center justify-center">{i+1}</span>
                                    <div>
                                        <span className="font-black text-sm text-slate-900 dark:text-white block">{stock.symbol}</span>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[110px] block">{stock.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">₹{stock.price?.toLocaleString()}</div>
                                    <div className="text-xs font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">+{stock.change?.toFixed(2)}%</div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400 text-center py-4">No data available</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <h4 className="font-black text-base flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-500" /></span>
                            Top Losers
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full uppercase">NSE</span>
                    </div>
                    <div className="space-y-1">
                        {loading ? [1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />) :
                        topMovers.losers?.length > 0 ? topMovers.losers.slice(0, 5).map((stock, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-400 flex items-center justify-center">{i+1}</span>
                                    <div>
                                        <span className="font-black text-sm text-slate-900 dark:text-white block">{stock.symbol}</span>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[110px] block">{stock.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">₹{stock.price?.toLocaleString()}</div>
                                    <div className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">{stock.change?.toFixed(2)}%</div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400 text-center py-4">No data available</p>}
                    </div>
                </div>
            </div>

            {/* Market Overview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100 via-transparent to-transparent dark:from-violet-900/20 pointer-events-none" />
                <div className="relative z-10 mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Market Overview</h2>
                        <p className="text-sm text-slate-500 mt-1">Markets are currently <span className={`font-bold ${marketStatus.isOpen ? 'text-green-600' : 'text-red-500'}`}>{marketStatus.isOpen ? 'open' : 'closed'}</span>.</p>
                    </div>
                    <button className="bg-[#630ed4] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4d0aab] transition-colors shadow-sm">Explore Index</button>
                </div>
                <div className="relative z-10"><MarketTable /></div>
            </div>

            {/* Recent Trading Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#630ed4]" />
                    <h3 className="font-black text-slate-900 dark:text-white">Recent Trading Activity</h3>
                </div>
                {loading ? (
                    <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
                ) : recentTransactions.length > 0 ? (
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {recentTransactions.map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${transaction.type === 'BUY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {transaction.type}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-sm">{transaction.symbol}</p>
                                        <p className="text-xs text-slate-400">{transaction.quantity} shares · {formatCurrency(transaction.price)}</p>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-400">{(() => {
                                    const raw = transaction.date || transaction.timestamp || transaction.createdAt;
                                    if (!raw) return 'Just now';
                                    const d = new Date(raw);
                                    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                })()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                            <Activity className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                        </div>
                        <h4 className="font-black text-slate-700 dark:text-white mb-1">No Trading Activity Yet</h4>
                        <p className="text-sm text-slate-400 mb-5">Start trading with your ₹1,00,000 virtual balance</p>
                        <a href="/virtual-trading" className="bg-[#630ed4] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4d0aab] transition-colors">Start Trading</a>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Home;

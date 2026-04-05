import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, RefreshCw, BarChart3, User, Mail, Calendar, Settings } from 'lucide-react';
import RealTimePnL from '../components/trading/RealTimePnL';
import { ENDPOINTS } from '../lib/config';
import { api } from '../lib/api';

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
        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchPortfolioData = async () => {
        try {
            setLoading(true);
            
            // Get user from localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {

                return;
            }
            
            const currentUser = JSON.parse(userData);
            const userId = currentUser.id;
            
            // Fetch portfolio summary
            const summaryResponse = await api.get(`/trading/portfolio/${userId}`);
            const summaryData = summaryResponse.data;
            
            // Fetch holdings
            const holdingsResponse = await api.get(`/trading/holdings/${userId}`);
            const holdingsData = holdingsResponse.data;
            
            if (summaryData.status === 'success') {
                setPortfolioSummary(summaryData.data);
            } else {
                // Set default values if API fails
                setPortfolioSummary({
                    totalValue: 100000,
                    totalInvested: 0,
                    totalPnL: 0,
                    totalPnLPercent: 0,
                    availableBalance: 100000,
                    holdingsCount: 0,
                    dayPnL: 0,
                    dayPnLPercent: 0
                });
            }
            
            if (holdingsData.status === 'success') {
                // Use server-calculated values directly to avoid NaN issues
                const transformedHoldings = holdingsData.data.map((holding: any) => {
                    // Validate all numeric values from server
                    const avgPrice = parseFloat(holding.avgPrice) || 0;
                    const currentPrice = parseFloat(holding.currentPrice) || avgPrice;
                    const quantity = parseFloat(holding.quantity) || 0;
                    const invested = parseFloat(holding.invested) || 0;
                    const currentValue = parseFloat(holding.currentValue) || 0;
                    const pnl = parseFloat(holding.pnl) || 0;
                    const pnlPercent = parseFloat(holding.pnlPercent) || 0;
                    
                    return {
                        symbol: holding.symbol || '',
                        name: holding.name || holding.symbol || '',
                        quantity: quantity,
                        avgPrice: avgPrice,
                        currentPrice: currentPrice,
                        marketValue: currentValue,
                        invested: invested,
                        pnl: pnl,
                        pnlPercent: pnlPercent,
                        sector: holding.sector || 'Unknown',
                        purchaseDate: holding.purchaseDate
                    };
                });
                
                setHoldings(transformedHoldings);
            }
        } catch (error) {

            // Set default values to prevent blank screen
            setPortfolioSummary({
                totalValue: 0,
                totalInvested: 0,
                totalPnL: 0,
                totalPnLPercent: 0,
                availableBalance: 100000, // Default starting balance
                holdingsCount: 0,
                dayPnL: 0,
                dayPnLPercent: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        // Handle NaN, null, undefined values
        if (isNaN(amount) || amount === null || amount === undefined) {
            return '₹0';
        }
        
        // Format with Indian locale and explicitly add ₹ symbol
        const formatted = Math.abs(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return `₹${formatted}`;
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieChart },
        { id: 'holdings', label: 'Holdings', icon: BarChart3 },
        { id: 'pnl', label: 'Real-Time P&L', icon: Activity },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    if (loading && !portfolioSummary) {
        return (
            <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="h-10 w-10 animate-spin text-[#630ed4]" />
                    <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Portfolio</span>
                </div>
            </div>
        );
    }

    return (
        <section className="p-4 md:p-8 space-y-8 bg-[#f9f9ff] dark:bg-slate-900 min-h-screen border-t dark:border-slate-800" id="portfolio">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-on-surface dark:text-white">Portfolio Dashboard</h1>
                <button
                    onClick={fetchPortfolioData}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-[#630ed4] text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 font-bold text-sm shadow-md"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sync Data</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-transparent dark:from-violet-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-violet-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface dark:text-white">
                        {portfolioSummary ? formatCurrency(portfolioSummary.totalValue) : '₹0'}
                    </h3>
                </div>
                <div className={`relative p-6 rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${(portfolioSummary?.totalPnL || 0) >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`text-xs font-bold uppercase tracking-widest ${(portfolioSummary?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>Total P&L</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(portfolioSummary?.totalPnL || 0) >= 0 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                            {(portfolioSummary?.totalPnL || 0) >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                    </div>
                    <h3 className={`text-2xl font-black ${(portfolioSummary?.totalPnL || 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {(portfolioSummary?.totalPnL || 0) >= 0 ? '+' : ''}{portfolioSummary ? formatCurrency(portfolioSummary.totalPnL) : '₹0'}
                    </h3>
                    <p className={`text-xs font-bold mt-1 ${(portfolioSummary?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {portfolioSummary ? (portfolioSummary.totalPnL >= 0 ? '+' : '') + portfolioSummary.totalPnLPercent.toFixed(2) + '%' : '0.00%'}
                    </p>
                </div>
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface dark:text-white">
                        {portfolioSummary ? formatCurrency(portfolioSummary.availableBalance) : '₹1,00,000'}
                    </h3>
                </div>
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Holdings</p>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface dark:text-white">
                        {portfolioSummary ? portfolioSummary.holdingsCount : 0}
                    </h3>
                </div>
            </div>

            <div className="flex gap-8 border-b border-outline-variant/30 dark:border-slate-800">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 font-black flex items-center gap-2 text-sm tracking-widest transition-all uppercase ${isActive ? 'border-b-2 border-[#630ed4] text-[#630ed4]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-[#e9edff]-container-low dark:bg-[#630ed4]/10 rounded-3xl p-6 lg:p-10 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-sm border border-outline-variant/10 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 w-full mb-6 md:mb-0">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl" />
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl bg-[#630ed4] flex items-center justify-center text-white">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="text-2xl font-black text-on-surface dark:text-white">{user?.name || 'Guest'}</h3>
                                <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400">{user?.email}</p>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                                    <span className="px-3 py-1 bg-[#630ed4]/10 text-[#630ed4] dark:bg-[#630ed4]/20 dark:text-[#a975ff] text-[10px] font-black rounded-lg">VERIFIED</span>
                                    <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-black rounded-lg">ACTIVE INVESTOR</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 flex gap-4 w-full md:w-auto">
                            <button className="flex-1 md:flex-none bg-[#630ed4] text-white px-8 py-3 rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-center">Settings</button>
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {holdings.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {holdings.slice(0, 6).map((holding, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-outline-variant/10 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-[#630ed4]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div>
                                                <h4 className="text-2xl font-black text-on-surface dark:text-white uppercase">{holding.symbol}</h4>
                                                <p className="text-xs font-bold text-slate-400 uppercase">{holding.quantity} Shares</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-on-surface dark:text-white">{formatCurrency(holding.marketValue)}</p>
                                                <p className={`text-sm font-bold ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)} ({holding.pnlPercent.toFixed(2)}%)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 relative z-10">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Avg Price</p>
                                                <p className="font-bold text-sm dark:text-slate-200">{formatCurrency(holding.avgPrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Current Price</p>
                                                <p className="font-bold text-sm dark:text-slate-200">{formatCurrency(holding.currentPrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Invested Value</p>
                                                <p className="font-bold text-sm dark:text-slate-200">{formatCurrency(holding.invested || (holding.avgPrice * holding.quantity))}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-5">
                                    <Activity className="h-10 w-10 text-violet-300 dark:text-violet-600" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Holdings Yet</h3>
                                <p className="text-sm text-slate-400 mb-6 max-w-xs">Start with ₹1,00,000 virtual money and build your portfolio risk-free.</p>
                                <a href="/virtual-trading" className="bg-[#630ed4] text-white px-7 py-3 rounded-xl font-black text-sm hover:bg-[#4d0aab] transition-colors shadow-md shadow-violet-200 dark:shadow-none">
                                    Start Trading →
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Holdings Tab */}
                {activeTab === 'holdings' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-outline-variant/10 dark:border-slate-700 shadow-sm overflow-hidden">
                        {holdings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#f9f9ff] dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Symbol</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Quantity</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Avg Price</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Current Price</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Market Value</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                        {holdings.map((holding) => (
                                            <tr key={holding.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 dark:text-white uppercase">{holding.symbol}</div>
                                                    <div className="text-xs text-gray-500">{holding.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium dark:text-slate-300">{holding.quantity}</td>
                                                <td className="px-6 py-4 text-right font-medium dark:text-slate-300">{formatCurrency(holding.avgPrice)}</td>
                                                <td className="px-6 py-4 text-right font-medium dark:text-slate-300">{formatCurrency(holding.currentPrice)}</td>
                                                <td className="px-6 py-4 text-right font-bold dark:text-white">{formatCurrency(holding.marketValue)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-bold ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                                                    </div>
                                                    <div className={`text-xs font-bold ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                                    <Activity className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                                </div>
                                <p className="font-black text-slate-700 dark:text-white mb-1">No Holdings Yet</p>
                                <p className="text-sm text-slate-400 mb-5">Go to Virtual Trading to buy your first stock</p>
                                <a href="/virtual-trading" className="bg-[#630ed4] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4d0aab] transition-colors">Start Trading</a>
                            </div>
                        )}
                    </div>
                )}

                {/* Real-Time PnL Tab */}
                {activeTab === 'pnl' && (
                    <RealTimePnL />
                )}
            </div>
        </section>
    );
};

export default Portfolio;

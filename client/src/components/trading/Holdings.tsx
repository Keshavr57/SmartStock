import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { authService } from '@/lib/auth';
import { ENDPOINTS } from '@/lib/config';

interface Holding {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    totalInvested: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    lastUpdated: string;
}

const Holdings: React.FC = () => {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'pnlPercent'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchHoldings();
        const interval = setInterval(fetchHoldings, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchHoldings = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.HOLDINGS(user.id), {
                headers: authService.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setHoldings(data.data);
            }
        } catch (error) {
            console.error('Error fetching holdings:', error);
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

    const sortedHoldings = [...holdings].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'value':
                aValue = a.currentValue;
                bValue = b.currentValue;
                break;
            case 'pnl':
                aValue = a.pnl;
                bValue = b.pnl;
                break;
            case 'pnlPercent':
                aValue = a.pnlPercent;
                bValue = b.pnlPercent;
                break;
            default:
                aValue = a.currentValue;
                bValue = b.currentValue;
        }
        
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    const handleSort = (field: 'value' | 'pnl' | 'pnlPercent') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No holdings yet</div>
                <div className="text-sm text-gray-400">Start trading to see your holdings here</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Sort Controls */}
            <div className="flex space-x-2">
                <button
                    onClick={() => handleSort('value')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'value' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Value {sortBy === 'value' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                    onClick={() => handleSort('pnl')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'pnl' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    P&L {sortBy === 'pnl' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                    onClick={() => handleSort('pnlPercent')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'pnlPercent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    P&L% {sortBy === 'pnlPercent' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
            </div>

            {/* Holdings List */}
            <div className="space-y-4">
                {sortedHoldings.map((holding) => (
                    <div key={holding.symbol} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{holding.symbol}</h4>
                            <div className={`flex items-center space-x-1 ${
                                holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {holding.pnl >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                    {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                                </span>
                                <span className="text-sm">
                                    ({holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Quantity</p>
                                <p className="font-medium text-gray-900">{holding.quantity}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Avg Price</p>
                                <p className="font-medium text-gray-900">₹{holding.avgPrice.toFixed(2)}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Current Price</p>
                                <p className="font-medium text-gray-900">₹{holding.currentPrice.toFixed(2)}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Current Value</p>
                                <p className="font-medium text-gray-900">{formatCurrency(holding.currentValue)}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Invested: {formatCurrency(holding.totalInvested)}
                            </div>
                            <div className="text-xs text-gray-500">
                                Updated: {new Date(holding.lastUpdated).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Holdings;
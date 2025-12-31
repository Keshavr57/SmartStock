import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { authService } from '../../lib/auth';
import { ENDPOINTS } from '../../lib/config';

interface WatchlistItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
}

interface WatchlistProps {
    onStockSelect: (symbol: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onStockSelect }) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        fetchWatchlist();
        const interval = setInterval(fetchWatchlist, 15000); // Update every 15 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchWatchlist = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.WATCHLIST(user.id), {
                headers: authService.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setWatchlist(data.data);
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
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

    const addToWatchlist = async (symbol: string) => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.WATCHLIST(user.id), {
                method: 'POST',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify({ symbol })
            });

            if (response.ok) {
                setNewSymbol('');
                setSearchResults([]);
                setShowAddForm(false);
                fetchWatchlist();
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
        }
    };

    const removeFromWatchlist = async (symbol: string) => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.WATCHLIST_ITEM(user.id, symbol), {
                method: 'DELETE',
                headers: authService.getAuthHeaders()
            });

            if (response.ok) {
                fetchWatchlist();
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e7) return (num / 1e7).toFixed(2) + 'Cr';
        if (num >= 1e5) return (num / 1e5).toFixed(2) + 'L';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num?.toFixed(2) || 'N/A';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Watchlist</h3>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Stock</span>
                    </button>
                </div>
            </div>

            {/* Add Stock Form */}
            {showAddForm && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search stocks to add (e.g., RELIANCE, TCS)"
                            value={newSymbol}
                            onChange={(e) => {
                                setNewSymbol(e.target.value);
                                handleSearch(e.target.value);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                                {searchResults.map((stock: any) => (
                                    <button
                                        key={stock.symbol}
                                        onClick={() => addToWatchlist(stock.symbol)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                                        <div className="text-sm text-gray-600">{stock.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setNewSymbol('');
                                setSearchResults([]);
                            }}
                            className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* Watchlist Items */}
            <div className="divide-y divide-gray-200">
                {watchlist.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="text-gray-500 mb-2">Your watchlist is empty</div>
                        <div className="text-sm text-gray-400">Add stocks to track their performance</div>
                    </div>
                ) : (
                    watchlist.map((item) => (
                        <div key={item.symbol} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900">{item.symbol}</h4>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onStockSelect(item.symbol)}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                title="View Chart"
                                            >
                                                <Eye className="h-4 w-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => removeFromWatchlist(item.symbol)}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                title="Remove from Watchlist"
                                            >
                                                <X className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-2">{item.name}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                ₹{item.price?.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Vol: {formatNumber(item.volume)}
                                            </div>
                                        </div>
                                        
                                        <div className={`text-right ${
                                            item.change >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            <div className="flex items-center space-x-1">
                                                {item.change >= 0 ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                <span className="font-medium">
                                                    {item.change >= 0 ? '+' : ''}₹{item.change?.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                ({item.changePercent >= 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Price Change Indicator */}
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            item.changePercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{
                                            width: `${Math.min(Math.abs(item.changePercent || 0) * 10, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Watchlist;
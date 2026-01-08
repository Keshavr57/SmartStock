import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Filter, AlertCircle } from 'lucide-react';
import { authService } from '../../lib/auth';
import { ENDPOINTS } from '../../lib/config';
import { formatCurrency } from '../../lib/currency';

interface Transaction {
    symbol?: string;
    type?: 'BUY' | 'SELL';
    quantity?: number;
    price?: number;
    totalAmount?: number;
    fees?: number;
    timestamp?: string;
    orderId?: string;
    status?: 'PENDING' | 'EXECUTED' | 'CANCELLED';
}

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
    const [limit, setLimit] = useState(50);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, [limit]);

    const fetchTransactions = async () => {
        try {
            setError(null);
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                setTransactions([]);
                setLoading(false);
                return;
            }

            const response = await fetch(ENDPOINTS.TRANSACTIONS(user.id, limit), {
                headers: authService.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.status === 'success' && Array.isArray(data.data)) {
                setTransactions(data.data);
            } else {
                console.log('No transaction data or invalid format:', data);
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transactions');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = Array.isArray(transactions) ? transactions.filter(transaction => {
        if (filter === 'ALL') return true;
        return transaction.type === filter;
    }) : [];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'EXECUTED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Transactions</h4>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button 
                        onClick={fetchTransactions}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as 'ALL' | 'BUY' | 'SELL')}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Transactions</option>
                            <option value="BUY">Buy Orders</option>
                            <option value="SELL">Sell Orders</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Total Transactions</div>
                        <div className="text-lg font-semibold text-gray-900">{Array.isArray(transactions) ? transactions.length : 0}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600">Buy Orders</div>
                        <div className="text-lg font-semibold text-green-900">
                            {Array.isArray(transactions) ? transactions.filter(t => t.type === 'BUY').length : 0}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-sm text-red-600">Sell Orders</div>
                        <div className="text-lg font-semibold text-red-900">
                            {Array.isArray(transactions) ? transactions.filter(t => t.type === 'SELL').length : 0}
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                    <div className="p-6 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-500 mb-2">No transactions yet</div>
                        <div className="text-sm text-gray-400">Your trading history will appear here</div>
                    </div>
                ) : (
                    filteredTransactions.map((transaction, index) => {
                        if (!transaction || typeof transaction !== 'object') {
                            return null;
                        }

                        return (
                            <div key={transaction.orderId || index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${
                                            (transaction.type || 'BUY') === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {(transaction.type || 'BUY') === 'BUY' ? (
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-semibold text-gray-900">{transaction.symbol || 'Unknown'}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    (transaction.type || 'BUY') === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {transaction.type || 'BUY'}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status || 'EXECUTED')}`}>
                                                    {transaction.status || 'EXECUTED'}
                                                </span>
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 mt-1">
                                                {transaction.quantity || 0} shares @ ₹{(transaction.price || 0).toFixed(2)}
                                            </div>
                                            
                                            <div className="text-xs text-gray-500 mt-1">
                                                {transaction.timestamp ? new Date(transaction.timestamp).toLocaleString('en-IN') : 'Unknown date'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900">
                                            {formatCurrency(transaction.totalAmount || 0)}
                                        </div>
                                        {(transaction.fees || 0) > 0 && (
                                            <div className="text-xs text-gray-500">
                                                Fees: {formatCurrency(transaction.fees || 0)}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">
                                            ID: {transaction.orderId ? transaction.orderId.slice(-8) : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }).filter(Boolean)
                )}
            </div>

            {Array.isArray(transactions) && transactions.length >= limit && (
                <div className="p-4 border-t border-gray-200 text-center">
                    <button
                        onClick={() => setLimit(limit + 25)}
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        Load More Transactions
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Filter } from 'lucide-react';
import { authService } from '@/lib/auth';

interface Transaction {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    fees: number;
    timestamp: string;
    orderId: string;
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
}

const TransactionHistory: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        fetchTransactions();
    }, [limit]);

    const fetchTransactions = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(`http://localhost:5050/api/virtual/transactions/${user.id}?limit=${limit}`, {
                headers: authService.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
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

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'ALL') return true;
        return transaction.type === filter;
    });

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

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Total Transactions</div>
                        <div className="text-lg font-semibold text-gray-900">{transactions.length}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600">Buy Orders</div>
                        <div className="text-lg font-semibold text-green-900">
                            {transactions.filter(t => t.type === 'BUY').length}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-sm text-red-600">Sell Orders</div>
                        <div className="text-lg font-semibold text-red-900">
                            {transactions.filter(t => t.type === 'SELL').length}
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
                    filteredTransactions.map((transaction) => (
                        <div key={transaction.orderId} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${
                                        transaction.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        {transaction.type === 'BUY' ? (
                                            <TrendingUp className={`h-4 w-4 ${
                                                transaction.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        ) : (
                                            <TrendingDown className={`h-4 w-4 ${
                                                transaction.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        )}
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-semibold text-gray-900">{transaction.symbol}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {transaction.type}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                {transaction.status}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 mt-1">
                                            {transaction.quantity} shares @ ₹{transaction.price.toFixed(2)}
                                        </div>
                                        
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(transaction.timestamp).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                        {formatCurrency(transaction.totalAmount)}
                                    </div>
                                    {transaction.fees > 0 && (
                                        <div className="text-xs text-gray-500">
                                            Fees: {formatCurrency(transaction.fees)}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                        ID: {transaction.orderId.slice(-8)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {transactions.length >= limit && (
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
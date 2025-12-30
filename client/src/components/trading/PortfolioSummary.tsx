import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

interface PortfolioSummaryProps {
    data: {
        balance: number;
        totalValue: number;
        invested: number;
        currentValue: number;
        totalPnL: number;
        totalPnLPercent: number;
        holdingsCount: number;
        transactionsCount: number;
    };
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
            
            <div className="space-y-4">
                {/* Total Portfolio Value */}
                <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <PieChart className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total Value</p>
                            <p className="text-xl font-bold text-blue-900">
                                {formatCurrency(data.totalValue)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Available Balance */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Available Balance</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(data.balance)}
                    </span>
                </div>

                {/* Invested Amount */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Invested</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(data.invested)}
                    </span>
                </div>

                {/* Current Value */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Current Value</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                        {formatCurrency(data.currentValue)}
                    </span>
                </div>

                {/* Total P&L */}
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {data.totalPnL >= 0 ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium text-gray-600">Total P&L</span>
                        </div>
                        <div className="text-right">
                            <div className={`font-semibold ${
                                data.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {data.totalPnL >= 0 ? '+' : ''}{formatCurrency(data.totalPnL)}
                            </div>
                            <div className={`text-sm ${
                                data.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                ({data.totalPnL >= 0 ? '+' : ''}{data.totalPnLPercent.toFixed(2)}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Holdings Count */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Holdings</span>
                    <span className="font-semibold text-gray-900">{data.holdingsCount}</span>
                </div>

                {/* Transactions Count */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Transactions</span>
                    <span className="font-semibold text-gray-900">{data.transactionsCount}</span>
                </div>
            </div>

            {/* Performance Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        data.totalPnLPercent >= 5 ? 'bg-green-100 text-green-800' :
                        data.totalPnLPercent >= 0 ? 'bg-yellow-100 text-yellow-800' :
                        data.totalPnLPercent >= -5 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {data.totalPnLPercent >= 5 ? 'Excellent Performance' :
                         data.totalPnLPercent >= 0 ? 'Positive Returns' :
                         data.totalPnLPercent >= -5 ? 'Minor Loss' :
                         'Significant Loss'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSummary;
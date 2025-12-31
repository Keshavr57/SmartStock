import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../lib/auth';
import { ENDPOINTS } from '../../lib/config';

interface OrderPanelProps {
    symbol: string;
    type: 'BUY' | 'SELL';
    onClose: () => void;
    onOrderComplete: () => void;
}

interface StockQuote {
    price: number;
    name: string;
    change: number;
    changePercent: number;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ symbol, type, onClose, onOrderComplete }) => {
    const [quantity, setQuantity] = useState(1);
    const [orderType, setOrderType] = useState('MARKET');
    const [limitPrice, setLimitPrice] = useState('');
    const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchStockQuote();
        const interval = setInterval(fetchStockQuote, 5000);
        return () => clearInterval(interval);
    }, [symbol]);

    const fetchStockQuote = async () => {
        try {
            const response = await fetch(ENDPOINTS.QUOTE(symbol));
            const data = await response.json();
            
            if (data.status === 'success') {
                setStockQuote({
                    price: data.data.price || 100,
                    name: data.data.name || symbol,
                    change: data.data.change || 0,
                    changePercent: data.data.changePercent || 0
                });
                
                if (orderType === 'LIMIT' && !limitPrice) {
                    setLimitPrice((data.data.price || 100).toFixed(2));
                }
            }
        } catch (error) {
            console.error('Error fetching quote:', error);
            // Set fallback data on error
            setStockQuote({
                price: 100,
                name: symbol,
                change: 0,
                changePercent: 0
            });
        }
    };

    const calculateTotal = () => {
        if (!stockQuote) return 0;
        const price = orderType === 'LIMIT' ? parseFloat(limitPrice) || (stockQuote.price || 0) : (stockQuote.price || 0);
        return quantity * price;
    };

    const calculateFees = () => {
        return calculateTotal() * 0.001; // 0.1% fees
    };

    const handleSubmitOrder = async () => {
        if (!stockQuote) return;
        
        const user = authService.getUser();
        if (!user) {
            setError('Please login to place orders');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const orderData = {
                symbol,
                type,
                quantity,
                orderType,
                ...(orderType === 'LIMIT' && { limitPrice: parseFloat(limitPrice) })
            };

            const response = await fetch(ENDPOINTS.ORDER(user.id), {
                method: 'POST',
                headers: authService.getAuthHeaders(),
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                setSuccess(true);
                setTimeout(() => {
                    onOrderComplete();
                }, 2000);
            } else {
                setError(data.message || 'Order failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Executed!</h3>
                        <p className="text-gray-600 mb-4">
                            Your {type} order for {quantity} shares of {symbol} has been executed successfully.
                        </p>
                        <div className="text-sm text-gray-500">
                            Redirecting to portfolio...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {type === 'BUY' ? (
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                        ) : (
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{type} Order</h2>
                            <p className="text-gray-600">{symbol}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Stock Info */}
                    {stockQuote && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">{stockQuote.name}</h3>
                                    <p className="text-sm text-gray-600">{symbol}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-gray-900">
                                        ₹{(stockQuote.price || 0).toFixed(2)}
                                    </div>
                                    <div className={`text-sm ${
                                        (stockQuote.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {(stockQuote.change || 0) >= 0 ? '+' : ''}₹{(stockQuote.change || 0).toFixed(2)} 
                                        ({(stockQuote.changePercent || 0) >= 0 ? '+' : ''}{(stockQuote.changePercent || 0).toFixed(2)}%)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Order Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setOrderType('MARKET')}
                                className={`p-3 rounded-lg border text-center transition-colors ${
                                    orderType === 'MARKET'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="font-medium">Market</div>
                                <div className="text-xs text-gray-500">Execute immediately</div>
                            </button>
                            <button
                                onClick={() => setOrderType('LIMIT')}
                                className={`p-3 rounded-lg border text-center transition-colors ${
                                    orderType === 'LIMIT'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="font-medium">Limit</div>
                                <div className="text-xs text-gray-500">Set your price</div>
                            </button>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                        </label>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Limit Price */}
                    {orderType === 'LIMIT' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Limit Price (₹)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter limit price"
                            />
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Order Summary</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="text-gray-900">{quantity} shares</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="text-gray-900">
                                ₹{orderType === 'LIMIT' ? limitPrice || '0.00' : (stockQuote?.price || 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fees (0.1%):</span>
                            <span className="text-gray-900">₹{calculateFees().toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                            <div className="flex justify-between font-medium">
                                <span className="text-gray-900">Total:</span>
                                <span className="text-gray-900">₹{(calculateTotal() + calculateFees()).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmitOrder}
                        disabled={loading || !stockQuote}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            type === 'BUY'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </div>
                        ) : (
                            `${type} ${quantity} Shares`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderPanel;
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/lib/auth';
import { ENDPOINTS, API_CONFIG } from '@/lib/config';

interface Position {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    marketValue: number;
    lastUpdate: Date;
}

interface PnLSummary {
    totalPnL: number;
    totalPnLPercent: number;
    totalInvested: number;
    totalCurrentValue: number;
    dayPnL: number;
    dayPnLPercent: number;
    positions: Position[];
}

const RealTimePnL: React.FC = () => {
    const [pnlData, setPnlData] = useState<PnLSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'unknown'>('unknown');

    useEffect(() => {
        initializeRealTimePnL();
        
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const initializeRealTimePnL = async () => {
        try {
            // Check market status
            await checkMarketStatus();
            
            // Fetch initial portfolio data
            await fetchPortfolioData();
            
            // Try to connect to WebSocket for real-time updates
            try {
                const socketConnection = io(API_CONFIG.WEBSOCKET_URL);
                setSocket(socketConnection);

                socketConnection.on('connect', () => {
                    console.log('🔌 Connected to P&L WebSocket');
                    
                    // Subscribe to price updates for all positions
                    if (pnlData?.positions) {
                        pnlData.positions.forEach(position => {
                            socketConnection.emit('subscribe-price', position.symbol);
                        });
                    }
                });

                socketConnection.on('price-update', (data) => {
                    updatePositionPrice(data.symbol, data.price);
                });

                socketConnection.on('connect_error', () => {
                    console.log('🔌 P&L WebSocket connection failed, using polling updates');
                });
            } catch (wsError) {
                console.log('🔌 WebSocket not available, using polling updates');
            }

            // Always set up polling as backup
            const interval = setInterval(() => {
                fetchPortfolioData();
                checkMarketStatus();
            }, 30000);
            
            // Cleanup function
            return () => {
                clearInterval(interval);
                if (socket) {
                    socket.disconnect();
                }
            };

        } catch (error) {
            console.error('Error initializing real-time P&L:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkMarketStatus = async () => {
        try {
            const response = await fetch(ENDPOINTS.MARKET_STATUS);
            const result = await response.json();
            
            if (result.status === 'success') {
                setMarketStatus(result.data.isOpen ? 'open' : 'closed');
            }
        } catch (error) {
            console.log('Could not fetch market status');
            // Determine market status based on time (simplified)
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();
            
            // Rough market hours: Mon-Fri 9:30 AM - 4:00 PM EST
            const isWeekday = day >= 1 && day <= 5;
            const isMarketHours = hour >= 9 && hour <= 16;
            
            setMarketStatus(isWeekday && isMarketHours ? 'open' : 'closed');
        }
    };

    const fetchPortfolioData = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            const response = await fetch(ENDPOINTS.HOLDINGS(user.id), {
                headers: authService.getAuthHeaders()
            });
            const result = await response.json();

            if (result.status === 'success') {
                const holdings = result.data;
                
                // Transform holdings to positions with P&L calculations
                const positions: Position[] = await Promise.all(holdings.map(async (holding: any) => {
                    // Get real-time price for each holding
                    let currentPrice = holding.avgPrice; // fallback to avg price
                    
                    try {
                        const priceResponse = await fetch(ENDPOINTS.QUOTE(holding.symbol));
                        const priceData = await priceResponse.json();
                        if (priceData.status === 'success' && priceData.data.price) {
                            currentPrice = priceData.data.price;
                        }
                    } catch (error) {
                        console.log(`Could not fetch real-time price for ${holding.symbol}, using last known price`);
                    }

                    const pnl = (currentPrice - holding.avgPrice) * holding.quantity;
                    const pnlPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                    const marketValue = currentPrice * holding.quantity;

                    return {
                        symbol: holding.symbol,
                        quantity: holding.quantity,
                        avgPrice: holding.avgPrice,
                        currentPrice: currentPrice,
                        pnl: pnl,
                        pnlPercent: pnlPercent,
                        marketValue: marketValue,
                        lastUpdate: new Date()
                    };
                }));

                const totalInvested = positions.reduce((sum, pos) => sum + (pos.avgPrice * pos.quantity), 0);
                const totalCurrentValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
                const totalPnL = totalCurrentValue - totalInvested;
                const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

                // Calculate day P&L (simplified - in production, track opening prices)
                const dayPnL = totalPnL; // For demo, same as total P&L
                const dayPnLPercent = totalPnLPercent;

                setPnlData({
                    totalPnL,
                    totalPnLPercent,
                    totalInvested,
                    totalCurrentValue,
                    dayPnL,
                    dayPnLPercent,
                    positions
                });

                setLastUpdate(new Date());
                
                console.log(`💰 P&L Updated: Total P&L: $${totalPnL.toFixed(2)} (${totalPnLPercent.toFixed(2)}%)`);
            }
        } catch (error) {
            console.error('Error fetching portfolio data:', error);
        }
    };

    const updatePositionPrice = (symbol: string, newPrice: number) => {
        setPnlData(prevData => {
            if (!prevData) return prevData;

            const updatedPositions = prevData.positions.map(position => {
                if (position.symbol === symbol) {
                    const pnl = (newPrice - position.avgPrice) * position.quantity;
                    const pnlPercent = ((newPrice - position.avgPrice) / position.avgPrice) * 100;
                    const marketValue = newPrice * position.quantity;

                    return {
                        ...position,
                        currentPrice: newPrice,
                        pnl,
                        pnlPercent,
                        marketValue,
                        lastUpdate: new Date()
                    };
                }
                return position;
            });

            // Recalculate totals
            const totalInvested = updatedPositions.reduce((sum, pos) => sum + (pos.avgPrice * pos.quantity), 0);
            const totalCurrentValue = updatedPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
            const totalPnL = totalCurrentValue - totalInvested;
            const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

            setLastUpdate(new Date());

            return {
                ...prevData,
                totalPnL,
                totalPnLPercent,
                totalCurrentValue,
                dayPnL: totalPnL,
                dayPnLPercent: totalPnLPercent,
                positions: updatedPositions
            };
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!pnlData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">No positions found</p>
                <button
                    onClick={fetchPortfolioData}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Demo Notice */}
            {marketStatus === 'closed' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Demo Mode - Market Closed</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Currently showing simulated P&L movements. When markets open (Mon-Fri 9:30 AM - 4:00 PM EST), 
                                you'll see <strong>real gains/losses</strong> based on live stock prices from your virtual positions.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {marketStatus === 'open' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-green-900">Live Mode - Market Open</h4>
                            <p className="text-sm text-green-700 mt-1">
                                Showing <strong>real-time P&L</strong> based on live stock prices. 
                                Your gains/losses update automatically as market prices change.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* P&L Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Real-Time P&L</h3>
                    <div className="flex items-center space-x-4">
                        {/* Market Status */}
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                            marketStatus === 'open' 
                                ? 'bg-green-100 text-green-800' 
                                : marketStatus === 'closed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${
                                marketStatus === 'open' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span>
                                {marketStatus === 'open' ? 'Market Open - Real P&L' : 
                                 marketStatus === 'closed' ? 'Market Closed - Demo P&L' : 
                                 'Checking Market Status...'}
                            </span>
                        </div>
                        
                        {/* Live Status */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Activity className="h-4 w-4" />
                            <span>Live</span>
                            {lastUpdate && (
                                <span>• Updated {lastUpdate.toLocaleTimeString()}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total P&L */}
                    <div className={`p-4 rounded-lg ${
                        pnlData.totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total P&L</p>
                                <p className={`text-xl font-bold ${
                                    pnlData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(pnlData.totalPnL)}
                                </p>
                                <p className={`text-sm ${
                                    pnlData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatPercent(pnlData.totalPnLPercent)}
                                </p>
                            </div>
                            {pnlData.totalPnL >= 0 ? (
                                <TrendingUp className="h-8 w-8 text-green-500" />
                            ) : (
                                <TrendingDown className="h-8 w-8 text-red-500" />
                            )}
                        </div>
                    </div>

                    {/* Total Invested */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Invested</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {formatCurrency(pnlData.totalInvested)}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    {/* Current Value */}
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Current Value</p>
                                <p className="text-xl font-bold text-purple-600">
                                    {formatCurrency(pnlData.totalCurrentValue)}
                                </p>
                            </div>
                            <Activity className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    {/* Day P&L */}
                    <div className={`p-4 rounded-lg ${
                        pnlData.dayPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Day P&L</p>
                                <p className={`text-xl font-bold ${
                                    pnlData.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(pnlData.dayPnL)}
                                </p>
                                <p className={`text-sm ${
                                    pnlData.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatPercent(pnlData.dayPnLPercent)}
                                </p>
                            </div>
                            {pnlData.dayPnL >= 0 ? (
                                <TrendingUp className="h-8 w-8 text-green-500" />
                            ) : (
                                <TrendingDown className="h-8 w-8 text-red-500" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Positions Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Open Positions</h4>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Symbol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Market Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    P&L
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    P&L %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pnlData.positions.map((position) => (
                                <tr key={position.symbol} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{position.symbol}</div>
                                        <div className="text-xs text-gray-500">
                                            Updated {position.lastUpdate.toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {position.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {formatCurrency(position.avgPrice)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {formatCurrency(position.currentPrice)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {formatCurrency(position.marketValue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`font-medium ${
                                            position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(position.pnl)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`flex items-center space-x-1 ${
                                            position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {position.pnl >= 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            <span className="font-medium">
                                                {formatPercent(position.pnlPercent)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RealTimePnL;
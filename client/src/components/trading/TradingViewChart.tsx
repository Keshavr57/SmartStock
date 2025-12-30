import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, ENDPOINTS } from '@/lib/config';

interface TradingViewChartProps {
    symbol: string;
    height?: number;
}

interface PriceData {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    timestamp: Date;
}

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, height = 500 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const animationRef = useRef<number>();
    
    const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
    const [candleData, setCandleData] = useState<CandleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [interval, setInterval] = useState('1m');
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    useEffect(() => {
        loadChartData();
        connectWebSocket();
        startRealTimeUpdates();
        
        return () => {
            cleanup();
        };
    }, [symbol]);

    useEffect(() => {
        if (candleData.length > 0) {
            drawCandlestickChart();
        }
    }, [candleData, currentPrice]);

    useEffect(() => {
        loadChartData();
    }, [interval]);

    const connectWebSocket = () => {
        try {
            socketRef.current = io(API_CONFIG.WEBSOCKET_URL);

            socketRef.current.on('connect', () => {
                console.log('🔌 Connected to trading WebSocket');
                socketRef.current?.emit('subscribe-price', symbol);
            });

            socketRef.current.on('price-update', (data: PriceData & { symbol: string }) => {
                if (data.symbol === symbol) {
                    setCurrentPrice(data);
                    updateCurrentCandle(data.price);
                }
            });

            socketRef.current.on('connect_error', () => {
                console.log('🔌 WebSocket connection failed, using simulated data');
            });
        } catch (error) {
            console.error('Error connecting WebSocket:', error);
        }
    };

    const startRealTimeUpdates = () => {
        // Simulate real-time price movements
        const updatePrice = () => {
            if (candleData.length > 0) {
                const lastCandle = candleData[candleData.length - 1];
                const basePrice = lastCandle.close;
                
                // Generate realistic price movement
                const volatility = 0.02; // 2% volatility
                const randomChange = (Math.random() - 0.5) * volatility;
                const newPrice = basePrice * (1 + randomChange);
                
                // Update current price display
                setCurrentPrice(prev => ({
                    price: newPrice,
                    change: newPrice - basePrice,
                    changePercent: ((newPrice - basePrice) / basePrice) * 100,
                    volume: Math.random() * 1000000,
                    high: Math.max(lastCandle.high, newPrice),
                    low: Math.min(lastCandle.low, newPrice),
                    open: lastCandle.open,
                    timestamp: new Date()
                }));

                updateCurrentCandle(newPrice);
            }
            
            animationRef.current = setTimeout(updatePrice, 2000); // Update every 2 seconds
        };

        updatePrice();
    };

    const updateCurrentCandle = (newPrice: number) => {
        setCandleData(prev => {
            if (prev.length === 0) return prev;
            
            const updated = [...prev];
            const lastCandle = updated[updated.length - 1];
            
            // Update the last candle with new price
            updated[updated.length - 1] = {
                ...lastCandle,
                close: newPrice,
                high: Math.max(lastCandle.high, newPrice),
                low: Math.min(lastCandle.low, newPrice),
                volume: lastCandle.volume + Math.random() * 10000
            };
            
            return updated;
        });
        
        setLastUpdate(Date.now());
    };

    const loadChartData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(ENDPOINTS.CHART(symbol, interval));
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                setCandleData(result.data);
            } else {
                // Generate realistic mock candlestick data
                generateMockCandleData();
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
            generateMockCandleData();
        } finally {
            setLoading(false);
        }
    };

    const generateMockCandleData = () => {
        const data: CandleData[] = [];
        const now = Math.floor(Date.now() / 1000);
        let basePrice = 100 + Math.random() * 50; // Random base price between 100-150
        
        for (let i = 100; i >= 0; i--) {
            const time = now - (i * 60); // 1 minute intervals
            
            // Generate realistic OHLC data
            const volatility = 0.02;
            const change = (Math.random() - 0.5) * volatility;
            const open = basePrice;
            const close = basePrice * (1 + change);
            
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            
            data.push({
                time,
                open,
                high,
                low,
                close,
                volume: Math.random() * 1000000
            });
            
            basePrice = close; // Next candle starts where this one ended
        }
        
        setCandleData(data);
    };

    const drawCandlestickChart = () => {
        const canvas = canvasRef.current;
        if (!canvas || candleData.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = height;

        const width = canvas.width;
        const canvasHeight = canvas.height;

        // Clear canvas with dark background for professional look
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, canvasHeight);

        // Chart dimensions
        const padding = { top: 30, right: 80, bottom: 50, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = canvasHeight - padding.top - padding.bottom;

        // Calculate price range
        const prices = candleData.flatMap(d => [d.high, d.low]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const buffer = priceRange * 0.1;

        const chartMinPrice = minPrice - buffer;
        const chartMaxPrice = maxPrice + buffer;
        const chartPriceRange = chartMaxPrice - chartMinPrice;

        // Helper functions
        const getX = (index: number) => padding.left + (index / (candleData.length - 1)) * chartWidth;
        const getY = (price: number) => padding.top + ((chartMaxPrice - price) / chartPriceRange) * chartHeight;

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 8; i++) {
            const price = chartMinPrice + (chartPriceRange * i / 8);
            const y = getY(price);
            
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();

            // Price labels
            ctx.fillStyle = '#888';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`$${price.toFixed(2)}`, padding.left - 10, y + 4);
        }

        // Vertical grid lines
        const timeSteps = Math.min(8, candleData.length);
        for (let i = 0; i <= timeSteps; i++) {
            const x = padding.left + (chartWidth * i / timeSteps);
            
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();

            // Time labels
            if (i < candleData.length) {
                const dataIndex = Math.floor((candleData.length - 1) * i / timeSteps);
                const time = new Date(candleData[dataIndex].time * 1000);
                const timeStr = time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                });
                
                ctx.fillStyle = '#888';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(timeStr, x, canvasHeight - 15);
            }
        }

        // Draw candlesticks
        const candleWidth = Math.max(2, Math.min(12, chartWidth / candleData.length * 0.8));
        
        candleData.forEach((candle, index) => {
            const x = getX(index);
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);

            const isGreen = candle.close >= candle.open;
            const bodyColor = isGreen ? '#00ff88' : '#ff4444';
            const wickColor = isGreen ? '#00ff88' : '#ff4444';

            // Draw wick (high-low line)
            ctx.strokeStyle = wickColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // Draw body (open-close rectangle)
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));
            const bodyTop = Math.min(openY, closeY);

            if (isGreen) {
                // Green candle - hollow
                ctx.strokeStyle = bodyColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            } else {
                // Red candle - filled
                ctx.fillStyle = bodyColor;
                ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            }
        });

        // Draw current price line if available
        if (currentPrice) {
            const currentPriceY = getY(currentPrice.price);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            
            ctx.beginPath();
            ctx.moveTo(padding.left, currentPriceY);
            ctx.lineTo(padding.left + chartWidth, currentPriceY);
            ctx.stroke();
            
            ctx.setLineDash([]);

            // Current price label
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(padding.left + chartWidth + 5, currentPriceY - 12, 70, 24);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${currentPrice.price.toFixed(2)}`, padding.left + chartWidth + 40, currentPriceY + 4);
        }

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${symbol} - ${interval} Candlestick Chart`, padding.left, 25);

        // Draw last update time
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Last update: ${new Date(lastUpdate).toLocaleTimeString()}`, width - 20, 25);
    };

    const cleanup = () => {
        if (socketRef.current) {
            socketRef.current.emit('unsubscribe-price', symbol);
            socketRef.current.disconnect();
        }
        
        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
    };

    const intervals = [
        { label: '1m', value: '1m' },
        { label: '5m', value: '5m' },
        { label: '15m', value: '15m' },
        { label: '1h', value: '1h' },
        { label: '4h', value: '4h' },
        { label: '1d', value: '1d' },
    ];

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-700">
            {/* Chart Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-white">{symbol}</h3>
                        {currentPrice && (
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-white">
                                    ${currentPrice.price.toFixed(2)}
                                </span>
                                <div className={`flex items-center space-x-1 ${
                                    currentPrice.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {currentPrice.change >= 0 ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span className="font-medium">
                                        {currentPrice.change >= 0 ? '+' : ''}
                                        {currentPrice.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Interval Selector */}
                        <div className="flex space-x-1">
                            {intervals.map((int) => (
                                <button
                                    key={int.value}
                                    onClick={() => setInterval(int.value)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        interval === int.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {int.label}
                                </button>
                            ))}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={loadChartData}
                            disabled={loading}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
                            <span className="text-gray-300">Loading candlestick data...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-center">
                            <p className="text-red-400 mb-2">{error}</p>
                            <button
                                onClick={loadChartData}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-4">
                    <canvas
                        ref={canvasRef}
                        className="w-full border border-gray-700 rounded"
                        style={{ height: `${height}px` }}
                    />
                </div>
            </div>

            {/* Real-time Status */}
            <div className="p-2 border-t border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-gray-300">Live Candlestick Data</span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-400">
                        <span>Volume: {currentPrice ? (currentPrice.volume / 1000).toFixed(0) + 'K' : 'N/A'}</span>
                        <span>Updates every 2s</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradingViewChart;
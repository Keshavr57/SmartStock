import express from 'express';
import virtualTradingService from '../../services/trading/virtualTrading.service.js';
import robustStockService from '../../services/robustStockService.js';
import { authenticateToken } from '../authRoutes.js';
import User from '../../models/User.js';

const router = express.Router();

// Get portfolio summary
router.get('/portfolio/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Calculate portfolio summary from user's actual data
        let totalValue = user.virtualBalance;
        let totalInvested = 0;
        let totalPnL = 0;
        let holdingsCount = user.portfolio.length;

        // Calculate values from actual holdings
        for (const holding of user.portfolio) {
            const invested = holding.avgPrice * holding.quantity;
            totalInvested += invested;
            
            // Get current price (simplified for now)
            try {
                const currentPrice = holding.avgPrice; // Will be updated with real prices
                const currentValue = currentPrice * holding.quantity;
                totalValue += currentValue;
                totalPnL += (currentValue - invested);
            } catch (error) {
                console.log(`Could not get price for ${holding.symbol}`);
            }
        }

        const summary = {
            totalValue: totalValue,
            totalInvested: totalInvested,
            totalPnL: totalPnL,
            totalPnLPercent: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
            availableBalance: user.virtualBalance,
            holdingsCount: holdingsCount,
            dayPnL: 0, // Can be calculated based on daily changes
            dayPnLPercent: 0
        };
        
        res.json({
            status: 'success',
            data: summary
        });
    } catch (error) {
        console.error('Portfolio error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get holdings
router.get('/holdings/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Return user's actual portfolio holdings
        const holdings = user.portfolio.map(holding => ({
            symbol: holding.symbol,
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            purchaseDate: holding.purchaseDate,
            name: holding.symbol.replace('.NS', ''), // Simple name extraction
            sector: 'Unknown' // Can be enhanced later
        }));
        
        res.json({
            status: 'success',
            data: holdings
        });
    } catch (error) {
        console.error('Holdings error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Execute trade order
router.post('/order/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const orderData = req.body;
        
        console.log(`📊 Processing order for user ${userId}:`, orderData);
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const { symbol, type, quantity, orderType = 'MARKET' } = orderData;
        
        // Get current market price
        const stockData = await robustStockService.getComprehensiveStockData(symbol);
        const currentPrice = stockData.lastTradedPrice || stockData.currentPrice || 100;

        if (!currentPrice || currentPrice <= 0) {
            throw new Error(`Unable to get valid market price for ${symbol}`);
        }

        const totalAmount = quantity * currentPrice;
        const fees = totalAmount * 0.001; // 0.1% trading fees
        const netAmount = totalAmount + fees;

        // Validate order
        if (type === 'BUY') {
            if (user.virtualBalance < netAmount) {
                throw new Error(`Insufficient balance. Required: ₹${netAmount.toFixed(2)}, Available: ₹${user.virtualBalance.toFixed(2)}`);
            }
        } else if (type === 'SELL') {
            const holding = user.portfolio.find(h => h.symbol === symbol);
            if (!holding || holding.quantity < quantity) {
                const availableQty = holding ? holding.quantity : 0;
                throw new Error(`Insufficient shares to sell. Required: ${quantity}, Available: ${availableQty}`);
            }
        }

        // Execute the order
        if (type === 'BUY') {
            user.virtualBalance -= netAmount;
            
            // Add to portfolio
            const existingHolding = user.portfolio.find(h => h.symbol === symbol);
            if (existingHolding) {
                const newTotalInvested = (existingHolding.avgPrice * existingHolding.quantity) + totalAmount;
                const newQuantity = existingHolding.quantity + quantity;
                existingHolding.avgPrice = newTotalInvested / newQuantity;
                existingHolding.quantity = newQuantity;
            } else {
                user.portfolio.push({
                    symbol,
                    quantity,
                    avgPrice: currentPrice,
                    purchaseDate: new Date()
                });
            }
        } else {
            user.virtualBalance += (totalAmount - fees);
            
            // Remove from portfolio
            const holding = user.portfolio.find(h => h.symbol === symbol);
            if (holding) {
                holding.quantity -= quantity;
                if (holding.quantity <= 0) {
                    user.portfolio = user.portfolio.filter(h => h.symbol !== symbol);
                }
            }
        }

        // Add transaction
        user.transactions.push({
            type,
            symbol,
            quantity,
            price: currentPrice,
            date: new Date()
        });

        await user.save();
        
        res.json({
            status: 'success',
            message: `${orderData.type} order executed successfully`,
            data: {
                transaction: {
                    type,
                    symbol,
                    quantity,
                    price: currentPrice,
                    totalAmount,
                    fees
                },
                newBalance: user.virtualBalance
            }
        });
    } catch (error) {
        console.error('Order execution error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get transaction history
router.get('/transactions/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Return user's actual transactions
        const transactions = user.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(limit) || 50);
        
        res.json({
            status: 'success',
            data: transactions
        });
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get watchlist
router.get('/watchlist/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Get watchlist data with current prices
        const watchlistData = [];
        
        for (const item of user.watchlist) {
            try {
                const stockData = await robustStockService.getComprehensiveStockData(item.symbol);
                watchlistData.push({
                    symbol: item.symbol,
                    name: stockData.name || item.symbol,
                    price: stockData.lastTradedPrice || stockData.currentPrice,
                    change: stockData.oneDayChange || 0,
                    changePercent: stockData.oneDayChangePercent || 0,
                    volume: stockData.volume,
                    marketCap: stockData.marketCap,
                    addedDate: item.addedDate
                });
            } catch (error) {
                console.log(`Error fetching data for ${item.symbol}:`, error.message);
                // Add with basic info if API fails
                watchlistData.push({
                    symbol: item.symbol,
                    name: item.symbol,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    addedDate: item.addedDate
                });
            }
        }
        
        res.json({
            status: 'success',
            data: watchlistData
        });
    } catch (error) {
        console.error('Watchlist error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Add to watchlist
router.post('/watchlist/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { symbol } = req.body;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Check if symbol already in watchlist
        const existingItem = user.watchlist.find(item => item.symbol === symbol);
        if (!existingItem) {
            user.watchlist.push({
                symbol,
                addedDate: new Date()
            });
            await user.save();
        }
        
        res.json({
            status: 'success',
            message: 'Added to watchlist',
            data: user.watchlist
        });
    } catch (error) {
        console.error('Add watchlist error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Remove from watchlist
router.delete('/watchlist/:userId/:symbol', authenticateToken, async (req, res) => {
    try {
        const { userId, symbol } = req.params;
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Remove from watchlist
        user.watchlist = user.watchlist.filter(item => item.symbol !== symbol);
        await user.save();
        
        res.json({
            status: 'success',
            message: 'Removed from watchlist',
            data: user.watchlist
        });
    } catch (error) {
        console.error('Remove watchlist error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get market status
router.get('/market-status', async (req, res) => {
    try {
        const marketStatus = await virtualTradingService.getMarketStatus();
        
        res.json({
            status: 'success',
            data: marketStatus
        });
    } catch (error) {
        console.error('Market status error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get real-time stock quote with candlestick data
router.get('/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1d', range = '1d' } = req.query;
        
        console.log(`📊 Getting real-time data for ${symbol}`);
        
        // Get comprehensive stock data
        const stockData = await robustStockService.getComprehensiveStockData(symbol);
        
        // Extract real-time price from comprehensive data with proper null handling
        const basePrice = stockData.lastTradedPrice || stockData.currentPrice || 100;
        const change = stockData.oneDayChange || 0;
        const changePercent = stockData.oneDayChangePercent || 0;
        
        const realTimePrice = {
            price: basePrice,
            change: change,
            changePercent: changePercent,
            volume: stockData.volume || 1000000,
            high: stockData.dayHigh || stockData.fiftyTwoWeekHigh || basePrice * 1.02,
            low: stockData.dayLow || stockData.fiftyTwoWeekLow || basePrice * 0.98,
            open: stockData.openPrice || basePrice,
            previousClose: stockData.previousClose || (basePrice - change)
        };
        
        // Generate simple candlestick data (mock for now)
        const candlestickData = [];
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 100; i >= 0; i--) {
            const time = now - (i * 60);
            const price = basePrice + Math.sin(i * 0.1) * (basePrice * 0.02) + (Math.random() - 0.5) * (basePrice * 0.01);
            
            candlestickData.push({
                time: time,
                open: price,
                high: price + Math.random() * (basePrice * 0.005),
                low: price - Math.random() * (basePrice * 0.005),
                close: price + (Math.random() - 0.5) * (basePrice * 0.005),
                volume: Math.random() * 1000000
            });
        }
        
        res.json({
            status: 'success',
            data: {
                symbol,
                name: stockData.name || stockData.companyName || symbol,
                price: realTimePrice.price,
                change: realTimePrice.change,
                changePercent: realTimePrice.changePercent,
                volume: realTimePrice.volume,
                marketCap: stockData.marketCap,
                high52w: stockData.fiftyTwoWeekHigh,
                low52w: stockData.fiftyTwoWeekLow,
                pe: stockData.peRatio,
                eps: stockData.eps,
                sector: stockData.sector,
                dayHigh: realTimePrice.high,
                dayLow: realTimePrice.low,
                open: realTimePrice.open,
                previousClose: realTimePrice.previousClose,
                candlestickData: candlestickData,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('Quote error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Search stocks - REAL comprehensive search
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        
        console.log(`🔍 Searching for: ${query}`);
        
        // Use robust stock service for search
        const searchResults = [];
        
        // Try to get data for the query as a symbol
        try {
            const stockData = await robustStockService.getComprehensiveStockData(query.toUpperCase());
            if (stockData && stockData.name) {
                searchResults.push({
                    symbol: query.toUpperCase(),
                    name: stockData.name,
                    price: stockData.lastTradedPrice,
                    change: stockData.oneDayChange,
                    changePercent: stockData.oneDayChangePercent
                });
            }
        } catch (error) {
            console.log(`No exact match for ${query}`);
        }
        
        // Add comprehensive Indian stock suggestions if no results
        if (searchResults.length === 0) {
            const indianStocks = [
                // Major Indices
                { symbol: 'NIFTY50.NS', name: 'NIFTY 50 Index' },
                { symbol: 'BANKNIFTY.NS', name: 'Bank NIFTY Index' },
                { symbol: 'NIFTYNEXT50.NS', name: 'NIFTY Next 50 Index' },
                { symbol: 'NIFTYIT.NS', name: 'NIFTY IT Index' },
                
                // Banking & Financial Services
                { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited' },
                { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited' },
                { symbol: 'SBIN.NS', name: 'State Bank of India' },
                { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited' },
                { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited' },
                { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited' },
                { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited' },
                { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited' },
                { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance Company Limited' },
                { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Limited' },
                
                // IT & Technology
                { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited' },
                { symbol: 'INFY.NS', name: 'Infosys Limited' },
                { symbol: 'WIPRO.NS', name: 'Wipro Limited' },
                { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited' },
                { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited' },
                { symbol: 'LTI.NS', name: 'Larsen & Toubro Infotech Limited' },
                { symbol: 'MINDTREE.NS', name: 'Mindtree Limited' },
                
                // Oil & Gas
                { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited' },
                { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Limited' },
                { symbol: 'IOC.NS', name: 'Indian Oil Corporation Limited' },
                { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Limited' },
                { symbol: 'HINDPETRO.NS', name: 'Hindustan Petroleum Corporation Limited' },
                
                // Automobiles
                { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited' },
                { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited' },
                { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited' },
                { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited' },
                { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited' },
                { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited' },
                
                // Pharmaceuticals
                { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited' },
                { symbol: 'DRREDDY.NS', name: 'Dr. Reddys Laboratories Limited' },
                { symbol: 'CIPLA.NS', name: 'Cipla Limited' },
                { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories Limited' },
                { symbol: 'BIOCON.NS', name: 'Biocon Limited' },
                
                // FMCG
                { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited' },
                { symbol: 'ITC.NS', name: 'ITC Limited' },
                { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited' },
                { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited' },
                { symbol: 'DABUR.NS', name: 'Dabur India Limited' },
                
                // Metals & Mining
                { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited' },
                { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited' },
                { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited' },
                { symbol: 'COALINDIA.NS', name: 'Coal India Limited' },
                { symbol: 'VEDL.NS', name: 'Vedanta Limited' },
                
                // Cement
                { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited' },
                { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited' },
                { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited' },
                
                // Telecom
                { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited' },
                { symbol: 'JIOFINANCE.NS', name: 'Jio Financial Services Limited' },
                
                // Power & Utilities
                { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited' },
                { symbol: 'NTPC.NS', name: 'NTPC Limited' },
                
                // Conglomerates
                { symbol: 'LT.NS', name: 'Larsen & Toubro Limited' },
                { symbol: 'ITC.NS', name: 'ITC Limited' },
                
                // Popular US Stocks (for comparison)
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.' },
                { symbol: 'MSFT', name: 'Microsoft Corporation' },
                { symbol: 'TSLA', name: 'Tesla, Inc.' },
                { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
                { symbol: 'NVDA', name: 'NVIDIA Corporation' },
                { symbol: 'META', name: 'Meta Platforms, Inc.' }
            ];
            
            const filtered = indianStocks.filter(stock => 
                stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
                stock.name.toLowerCase().includes(query.toLowerCase())
            );
            
            searchResults.push(...filtered.slice(0, 10));
        }
        
        const results = searchResults;
        
        res.json({
            status: 'success',
            data: results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get TradingView chart data
router.get('/chart/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1m', from, to } = req.query;
        
        console.log(`📈 Getting TradingView chart data for ${symbol}`);
        
        // Get chart data from Binance service
        const binanceService = req.app.get('binanceService');
        
        if (binanceService) {
            try {
                const chartData = await binanceService.getKlineData(symbol, interval, 1000);
                
                res.json({
                    status: 'success',
                    data: chartData
                });
                return;
            } catch (binanceError) {
                console.log(`⚠️ Binance service error for ${symbol}:`, binanceError.message);
            }
        }
        
        // Fallback: generate mock data
        console.log(`📊 Generating mock chart data for ${symbol}`);
        const mockData = [];
        const now = Math.floor(Date.now() / 1000);
        const basePrice = 100;
        
        for (let i = 100; i >= 0; i--) {
            const time = now - (i * 60); // 1 minute intervals
            const price = basePrice + Math.sin(i * 0.1) * 10 + Math.random() * 5;
            
            mockData.push({
                time: time,
                open: price,
                high: price + Math.random() * 2,
                low: price - Math.random() * 2,
                close: price + (Math.random() - 0.5) * 2,
                volume: Math.random() * 1000000
            });
        }
        
        res.json({
            status: 'success',
            data: mockData
        });
    } catch (error) {
        console.error('Chart data error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
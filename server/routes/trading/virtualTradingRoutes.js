import express from 'express';
import mongoose from 'mongoose';
import virtualTradingService from '../../services/trading/virtualTrading.service.js';
import comprehensiveStockService from '../../services/comprehensiveStockService.js';
import { authenticateToken } from '../authRoutes.js';
import User from '../../models/User.js';
import { inMemoryUsers } from '../../utils/userStorage.js';

const router = express.Router();

// Helper function to get user data (database or in-memory)
const getUserData = async (userId) => {
    // Check if it's an in-memory user
    if (userId.startsWith('temp_')) {
        return inMemoryUsers.get(userId);
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        return null;
    }
    
    // Get from database
    try {
        return await User.findById(userId);
    } catch (error) {
        console.error('Database user fetch error:', error);
        return null;
    }
};

// Helper function to update user data (database or in-memory)
const updateUserData = async (userId, userData) => {
    // Check if it's an in-memory user
    if (userId.startsWith('temp_')) {
        inMemoryUsers.set(userId, userData);
        return true;
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
        return false;
    }
    
    // Update in database
    try {
        await userData.save();
        return true;
    } catch (error) {
        console.error('Database user update error:', error);
        return false;
    }
};

// Get portfolio summary
router.get('/portfolio/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Handle demo user
        if (req.user.userId === 'demo_user_123') {
            const demoSummary = {
                totalValue: 111093.6,
                totalInvested: 11093.6,
                totalPnL: 52.5,
                totalPnLPercent: 0.47,
                availableBalance: 88906.4,
                holdingsCount: 1,
                dayPnL: 0,
                dayPnLPercent: 0,
                
                // Client-compatible fields
                balance: 88906.4,
                invested: 11093.6,
                currentValue: 11146.1,
                transactionsCount: 1
            };
            
            return res.json({
                status: 'success',
                data: demoSummary
            });
        }

        // Get user data (database or in-memory)
        const user = await getUserData(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Initialize values with proper defaults
        let totalValue = parseFloat(user.virtualBalance) || 100000;
        let totalInvested = 0;
        let totalPnL = 0;
        let holdingsCount = (user.portfolio && Array.isArray(user.portfolio)) ? user.portfolio.length : 0;

        // Calculate values from actual holdings with proper validation
        if (user.portfolio && Array.isArray(user.portfolio) && user.portfolio.length > 0) {
            console.log(`📊 Processing ${user.portfolio.length} holdings for user ${userId}`);
            
            for (const holding of user.portfolio) {
                // Validate holding data
                const avgPrice = parseFloat(holding.avgPrice) || 0;
                const quantity = parseFloat(holding.quantity) || 0;
                
                console.log(`Processing holding: ${holding.symbol}, qty: ${quantity}, avgPrice: ${avgPrice}`);
                
                if (avgPrice > 0 && quantity > 0) {
                    const invested = avgPrice * quantity;
                    totalInvested += invested;
                    
                    // Get current price with fallback to avgPrice
                    try {
                        // Try to get real-time price
                        const stockData = await comprehensiveStockService.getComprehensiveStockData(holding.symbol);
                        const currentPrice = parseFloat(stockData.lastTradedPrice) || 
                                           parseFloat(stockData.currentPrice) || 
                                           avgPrice; // Fallback to purchase price
                        
                        if (currentPrice > 0) {
                            const currentValue = currentPrice * quantity;
                            totalValue = (totalValue - invested) + currentValue; // Adjust total value
                            totalPnL += (currentValue - invested);
                        } else {
                            // If no valid current price, use invested amount
                            console.log(`Using invested amount for ${holding.symbol}: ${invested}`);
                        }
                    } catch (error) {
                        console.log(`Could not get price for ${holding.symbol}, using avgPrice:`, error.message);
                        // Use invested amount as fallback
                    }
                } else {
                    console.log(`Invalid holding data for ${holding.symbol}: avgPrice=${avgPrice}, quantity=${quantity}`);
                }
            }
        } else {
            console.log(`No portfolio holdings found for user ${userId}`);
        }

        // Ensure all values are valid numbers
        const summary = {
            totalValue: isNaN(totalValue) ? 100000 : Math.round(totalValue * 100) / 100,
            totalInvested: isNaN(totalInvested) ? 0 : Math.round(totalInvested * 100) / 100,
            totalPnL: isNaN(totalPnL) ? 0 : Math.round(totalPnL * 100) / 100,
            totalPnLPercent: (totalInvested > 0 && !isNaN(totalPnL)) ? 
                Math.round((totalPnL / totalInvested) * 10000) / 100 : 0,
            availableBalance: isNaN(user.virtualBalance) ? 100000 : Math.round(user.virtualBalance * 100) / 100,
            holdingsCount: holdingsCount,
            dayPnL: 0, // Can be calculated based on daily changes
            dayPnLPercent: 0,
            
            // Add client-expected field names for compatibility
            balance: isNaN(user.virtualBalance) ? 100000 : Math.round(user.virtualBalance * 100) / 100,
            invested: isNaN(totalInvested) ? 0 : Math.round(totalInvested * 100) / 100,
            currentValue: isNaN(totalValue - (user.virtualBalance || 0)) ? 0 : Math.round((totalValue - (user.virtualBalance || 0)) * 100) / 100,
            transactionsCount: (user.transactions && Array.isArray(user.transactions)) ? user.transactions.length : 0
        };
        
        console.log(`📊 Portfolio summary for user ${userId}:`, summary);
        
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
        
        // Handle demo user
        if (req.user.userId === 'demo_user_123') {
            const demoHoldings = [
                {
                    symbol: 'RELIANCE.NS',
                    name: 'Reliance Industries Limited',
                    quantity: 7,
                    avgPrice: 1584.8,
                    currentPrice: 1592.3,
                    invested: 11093.6,
                    currentValue: 11146.1,
                    pnl: 52.5,
                    pnlPercent: 0.47,
                    purchaseDate: new Date(),
                    sector: 'Oil & Gas'
                }
            ];
            
            return res.json({
                status: 'success',
                data: demoHoldings
            });
        }

        // Get user data (database or in-memory)
        const user = await getUserData(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Return user's actual portfolio holdings with enhanced data
        const holdings = [];
        
        if (user.portfolio && Array.isArray(user.portfolio)) {
            for (const holding of user.portfolio) {
                // Validate holding data
                const avgPrice = parseFloat(holding.avgPrice) || 0;
                const quantity = parseFloat(holding.quantity) || 0;
                
                if (avgPrice > 0 && quantity > 0) {
                    let currentPrice = avgPrice;
                    let name = holding.symbol.replace('.NS', '');
                    let sector = 'Unknown';
                    
                    // Try to get real-time data
                    try {
                        const stockData = await comprehensiveStockService.getComprehensiveStockData(holding.symbol);
                        currentPrice = parseFloat(stockData.lastTradedPrice) || 
                                     parseFloat(stockData.currentPrice) || 
                                     avgPrice;
                        name = stockData.name || stockData.companyName || name;
                        sector = stockData.sector || sector;
                    } catch (error) {
                        // Use fallback values
                    }
                    
                    // Calculate values with proper validation
                    const invested = avgPrice * quantity;
                    const currentValue = currentPrice * quantity;
                    const pnl = currentValue - invested;
                    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                    
                    holdings.push({
                        symbol: holding.symbol,
                        name: name,
                        quantity: quantity,
                        avgPrice: Math.round(avgPrice * 100) / 100,
                        currentPrice: Math.round(currentPrice * 100) / 100,
                        invested: Math.round(invested * 100) / 100,
                        currentValue: Math.round(currentValue * 100) / 100,
                        pnl: Math.round(pnl * 100) / 100,
                        pnlPercent: Math.round(pnlPercent * 100) / 100,
                        purchaseDate: holding.purchaseDate,
                        sector: sector
                    });
                }
            }
        }
        
        console.log(`📊 Holdings for user ${userId}:`, holdings.length, 'holdings');
        
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
        const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
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
                const stockData = await comprehensiveStockService.getComprehensiveStockData(item.symbol);
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
        
        // Get comprehensive stock data
        const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
        
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
            const stockData = await comprehensiveStockService.getComprehensiveStockData(query.toUpperCase());
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
        
        // Return empty data if no chart service available
        res.json({
            status: 'success',
            data: []
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Chart data unavailable'
        });
    }
});

export default router;
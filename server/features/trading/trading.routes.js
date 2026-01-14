import express from 'express';
import mongoose from 'mongoose';
import virtualTradingService from './virtualTrading.service.js';
import comprehensiveStockService from '../stocks/stock.service.js';
import { authenticateToken } from '../auth/auth.routes.js';
import User from '../../models/User.js';
import { inMemoryUsers } from '../auth/userStorage.js';

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
                // Clear and consistent demo portfolio
                totalValue: 101500,        // ₹1,01,500 (cash + holdings)
                totalInvested: 15000,      // ₹15,000 invested in stocks
                totalPnL: 500,             // ₹500 profit
                totalPnLPercent: 3.33,     // 3.33% return
                availableBalance: 86500,   // ₹86,500 cash available
                holdingsCount: 2,          // 2 different stocks
                dayPnL: 150,              // ₹150 today's profit
                dayPnLPercent: 1.0,       // 1% today's return
                
                // Client-compatible fields
                balance: 86500,           // Available cash
                invested: 15000,          // Money in stocks
                currentValue: 15500,      // Current value of holdings
                transactionsCount: 3      // 3 transactions
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
        let availableBalance = parseFloat(user.virtualBalance) || 100000;
        let totalInvested = 0;
        let currentHoldingsValue = 0;
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
                            currentHoldingsValue += currentValue;
                            totalPnL += (currentValue - invested);
                        } else {
                            // If no valid current price, use invested amount
                            currentHoldingsValue += invested;
                            console.log(`Using invested amount for ${holding.symbol}: ${invested}`);
                        }
                    } catch (error) {
                        console.log(`Could not get price for ${holding.symbol}, using avgPrice:`, error.message);
                        // Use invested amount as fallback
                        currentHoldingsValue += invested;
                    }
                } else {
                    console.log(`Invalid holding data for ${holding.symbol}: avgPrice=${avgPrice}, quantity=${quantity}`);
                }
            }
        } else {
            console.log(`No portfolio holdings found for user ${userId}`);
        }

        // Calculate total portfolio value (cash + holdings)
        const totalPortfolioValue = availableBalance + currentHoldingsValue;

        // Ensure all values are valid numbers
        const summary = {
            // Main portfolio metrics
            totalValue: Math.round(totalPortfolioValue * 100) / 100,
            totalInvested: Math.round(totalInvested * 100) / 100,
            totalPnL: Math.round(totalPnL * 100) / 100,
            totalPnLPercent: (totalInvested > 0) ? 
                Math.round((totalPnL / totalInvested) * 10000) / 100 : 0,
            availableBalance: Math.round(availableBalance * 100) / 100,
            holdingsCount: holdingsCount,
            dayPnL: 0, // Can be calculated based on daily changes
            dayPnLPercent: 0,
            
            // Client-expected field names for compatibility
            balance: Math.round(availableBalance * 100) / 100,
            invested: Math.round(totalInvested * 100) / 100,
            currentValue: Math.round(currentHoldingsValue * 100) / 100,
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
                    quantity: 5,
                    avgPrice: 1500,
                    currentPrice: 1520,
                    invested: 7500,
                    currentValue: 7600,
                    pnl: 100,
                    pnlPercent: 1.33,
                    purchaseDate: new Date(),
                    sector: 'Oil & Gas'
                },
                {
                    symbol: 'TCS.NS',
                    name: 'Tata Consultancy Services Limited',
                    quantity: 2,
                    avgPrice: 3750,
                    currentPrice: 3950,
                    invested: 7500,
                    currentValue: 7900,
                    pnl: 400,
                    pnlPercent: 5.33,
                    purchaseDate: new Date(),
                    sector: 'Information Technology'
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
        
        // Handle demo user
        if (req.user.userId === 'demo_user_123') {
            const demoTransactions = [
                {
                    type: 'BUY',
                    symbol: 'RELIANCE.NS',
                    quantity: 5,
                    price: 1500,
                    totalAmount: 7500,
                    fees: 7.5,
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    orderId: 'demo_order_001',
                    status: 'EXECUTED'
                },
                {
                    type: 'BUY',
                    symbol: 'TCS.NS',
                    quantity: 2,
                    price: 3750,
                    totalAmount: 7500,
                    fees: 7.5,
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    orderId: 'demo_order_002',
                    status: 'EXECUTED'
                },
                {
                    type: 'SELL',
                    symbol: 'RELIANCE.NS',
                    quantity: 1,
                    price: 1520,
                    totalAmount: 1520,
                    fees: 1.52,
                    timestamp: new Date().toISOString(), // Today
                    orderId: 'demo_order_003',
                    status: 'EXECUTED'
                }
            ];
            
            return res.json({
                status: 'success',
                data: demoTransactions
            });
        }
        
        // Get user from database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Return user's actual transactions with proper null handling
        const transactions = Array.isArray(user.transactions) ? 
            user.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, parseInt(limit) || 50)
                .map(transaction => ({
                    type: transaction.type,
                    symbol: transaction.symbol,
                    quantity: transaction.quantity,
                    price: transaction.price,
                    totalAmount: (transaction.quantity * transaction.price) || 0,
                    fees: ((transaction.quantity * transaction.price) * 0.001) || 0,
                    timestamp: transaction.date,
                    orderId: transaction._id || 'unknown',
                    status: 'EXECUTED'
                })) : [];
        
        console.log(`📊 Transactions for user ${userId}:`, transactions.length, 'transactions');
        
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

// Get real-time stock quote with live data
router.get('/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1d', range = '1d' } = req.query;
        
        console.log(`📈 Getting real-time quote for ${symbol}`);
        
        // Get real stock data from comprehensive service (SAME SOURCE AS BUY FUNCTIONALITY)
        const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
        
        console.log(`📊 Stock data received for ${symbol}:`, {
            price: stockData.lastTradedPrice,
            name: stockData.name,
            hasRealData: !!(stockData.lastTradedPrice && stockData.lastTradedPrice > 0),
            source: 'comprehensiveStockService (same as buy functionality)'
        });
        
        // Extract real-time price from comprehensive data
        const realTimePrice = {
            price: stockData.lastTradedPrice || stockData.currentPrice || null,
            change: stockData.oneDayChange || 0,
            changePercent: stockData.oneDayChangePercent || 0,
            volume: stockData.volume || 1000000,
            high: stockData.dayHigh || stockData.fiftyTwoWeekHigh || null,
            low: stockData.dayLow || stockData.fiftyTwoWeekLow || null,
            open: stockData.openPrice || null,
            previousClose: stockData.previousClose || null
        };

        // If we got real price data, use it
        if (realTimePrice.price && realTimePrice.price > 0) {
            console.log(`✅ Got real price for ${symbol}: ₹${realTimePrice.price}`);
            
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
                    dayHigh: realTimePrice.high || realTimePrice.price * 1.02,
                    dayLow: realTimePrice.low || realTimePrice.price * 0.98,
                    open: realTimePrice.open || realTimePrice.price,
                    previousClose: realTimePrice.previousClose || (realTimePrice.price - realTimePrice.change),
                    lastUpdated: new Date(),
                    source: 'live'
                }
            });
        } else {
            // Fallback to reasonable estimates for popular stocks
            console.log(`⚠️ No real price data for ${symbol}, using fallback`);
            
            let fallbackPrice = 100;
            
            // Use more accurate fallback prices based on user corrections (January 2025)
            if (symbol.includes('SBIN')) fallbackPrice = 997;
            else if (symbol.includes('TCS')) fallbackPrice = 3140;
            else if (symbol.includes('RELIANCE')) fallbackPrice = 1458;
            else if (symbol.includes('HDFCBANK')) fallbackPrice = 1740;
            else if (symbol.includes('INFY')) fallbackPrice = 1875;
            else if (symbol.includes('ICICIBANK')) fallbackPrice = 1285;
            else if (symbol.includes('MARUTI')) fallbackPrice = 11200;
            else if (symbol.includes('BAJFINANCE')) fallbackPrice = 945;
            else if (symbol.includes('WIPRO')) fallbackPrice = 295;
            else if (symbol.includes('HCLTECH')) fallbackPrice = 1875;
            else if (symbol.includes('BHARTIARTL')) fallbackPrice = 1685;
            else if (symbol.includes('ITC')) fallbackPrice = 485;
            else if (symbol.includes('HINDUNILVR')) fallbackPrice = 2385;
            else if (symbol.includes('KOTAKBANK')) fallbackPrice = 1785;
            else if (symbol.includes('AXISBANK')) fallbackPrice = 1125;
            else if (symbol.includes('LT')) fallbackPrice = 3685;
            else if (symbol.includes('SUNPHARMA')) fallbackPrice = 1185;
            else if (symbol.includes('ULTRACEMCO')) fallbackPrice = 11800;
            else if (symbol.includes('ASIANPAINT')) fallbackPrice = 2420;
            else if (symbol.includes('NESTLEIND')) fallbackPrice = 2180;
            else if (symbol.includes('TITAN')) fallbackPrice = 3280;
            else if (symbol.includes('TATAMOTORS')) fallbackPrice = 785;
            else if (symbol.includes('TATASTEEL')) fallbackPrice = 145;
            else if (symbol.includes('JSWSTEEL')) fallbackPrice = 985;
            else if (symbol.includes('ADANIENT')) fallbackPrice = 2485;
            else if (symbol.includes('COALINDIA')) fallbackPrice = 385;
            else if (symbol.includes('NTPC')) fallbackPrice = 285;
            else if (symbol.includes('POWERGRID')) fallbackPrice = 285;
            else if (symbol.includes('ONGC')) fallbackPrice = 245;
            else if (symbol.includes('BPCL')) fallbackPrice = 285;
            else if (symbol.includes('IOC')) fallbackPrice = 135;
            else if (symbol.includes('ZOMATO')) fallbackPrice = 285;
            else if (symbol.includes('PAYTM')) fallbackPrice = 985;
            else if (symbol.includes('NAUKRI')) fallbackPrice = 4850;
            else if (symbol.includes('DMART')) fallbackPrice = 3685;
            
            const change = (Math.random() - 0.5) * fallbackPrice * 0.03; // ±1.5% change
            const changePercent = (change / fallbackPrice) * 100;
            
            res.json({
                status: 'success',
                data: {
                    symbol,
                    name: stockData.name || symbol.replace('.NS', ''),
                    price: fallbackPrice,
                    change: Math.round(change * 100) / 100,
                    changePercent: Math.round(changePercent * 100) / 100,
                    volume: Math.floor(Math.random() * 5000000) + 1000000,
                    marketCap: stockData.marketCap,
                    high52w: stockData.fiftyTwoWeekHigh,
                    low52w: stockData.fiftyTwoWeekLow,
                    pe: stockData.peRatio,
                    eps: stockData.eps,
                    sector: stockData.sector,
                    dayHigh: fallbackPrice * 1.02,
                    dayLow: fallbackPrice * 0.98,
                    open: fallbackPrice,
                    previousClose: fallbackPrice - change,
                    lastUpdated: new Date(),
                    source: 'fallback'
                }
            });
        }
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
        
        // Import the comprehensive stock database
        const { searchStocks } = await import('../../data/indianStocks.js');
        
        // Use the enhanced search function
        const searchResults = searchStocks(query, 15); // Get up to 15 results
        
        // If we have results from our database, fetch real prices for them
        if (searchResults.length > 0) {
            const resultsWithRealPrices = await Promise.all(
                searchResults.map(async (stock) => {
                    try {
                        // Try to get real price data
                        const stockData = await comprehensiveStockService.getComprehensiveStockData(stock.symbol);
                        
                        if (stockData.lastTradedPrice && stockData.lastTradedPrice > 0) {
                            // Use real data
                            return {
                                symbol: stock.symbol,
                                name: stockData.name || stock.name,
                                price: Math.round(stockData.lastTradedPrice * 100) / 100,
                                change: Math.round((stockData.oneDayChange || 0) * 100) / 100,
                                changePercent: Math.round((stockData.oneDayChangePercent || 0) * 100) / 100,
                                sector: stockData.sector || stock.sector,
                                exchange: stock.exchange,
                                source: 'live'
                            };
                        } else {
                            // Use fallback prices for popular stocks
                            let fallbackPrice = 100;
                            
                            // Updated fallback prices (January 2025)
                            if (stock.symbol.includes('SBIN')) fallbackPrice = 997;
                            else if (stock.symbol.includes('TCS')) fallbackPrice = 3140;
                            else if (stock.symbol.includes('RELIANCE')) fallbackPrice = 1458;
                            else if (stock.symbol.includes('HDFCBANK')) fallbackPrice = 1740;
                            else if (stock.symbol.includes('INFY')) fallbackPrice = 1875;
                            else if (stock.symbol.includes('ICICIBANK')) fallbackPrice = 1285;
                            else if (stock.symbol.includes('MARUTI')) fallbackPrice = 11200;
                            else if (stock.symbol.includes('BAJFINANCE')) fallbackPrice = 945;
                            else if (stock.symbol.includes('WIPRO')) fallbackPrice = 295;
                            else if (stock.symbol.includes('HCLTECH')) fallbackPrice = 1875;
                            else if (stock.symbol.includes('BHARTIARTL')) fallbackPrice = 1685;
                            else if (stock.symbol.includes('ITC')) fallbackPrice = 485;
                            else if (stock.symbol.includes('HINDUNILVR')) fallbackPrice = 2385;
                            else if (stock.symbol.includes('KOTAKBANK')) fallbackPrice = 1785;
                            else if (stock.symbol.includes('AXISBANK')) fallbackPrice = 1125;
                            else if (stock.symbol.includes('LT')) fallbackPrice = 3685;
                            else if (stock.symbol.includes('SUNPHARMA')) fallbackPrice = 1185;
                            else if (stock.symbol.includes('ULTRACEMCO')) fallbackPrice = 11800;
                            else if (stock.symbol.includes('ASIANPAINT')) fallbackPrice = 2420;
                            else if (stock.symbol.includes('NESTLEIND')) fallbackPrice = 2180;
                            else if (stock.symbol.includes('TITAN')) fallbackPrice = 3280;
                            else if (stock.symbol.includes('TATAMOTORS')) fallbackPrice = 785;
                            else if (stock.symbol.includes('TATASTEEL')) fallbackPrice = 145;
                            else if (stock.symbol.includes('JSWSTEEL')) fallbackPrice = 985;
                            else if (stock.symbol.includes('ADANIENT')) fallbackPrice = 2485;
                            else if (stock.symbol.includes('COALINDIA')) fallbackPrice = 385;
                            else if (stock.symbol.includes('NTPC')) fallbackPrice = 285;
                            else if (stock.symbol.includes('POWERGRID')) fallbackPrice = 285;
                            else if (stock.symbol.includes('ONGC')) fallbackPrice = 245;
                            else if (stock.symbol.includes('BPCL')) fallbackPrice = 285;
                            else if (stock.symbol.includes('IOC')) fallbackPrice = 135;
                            else if (stock.symbol.includes('ZOMATO')) fallbackPrice = 285;
                            else if (stock.symbol.includes('PAYTM')) fallbackPrice = 985;
                            else if (stock.symbol.includes('NAUKRI')) fallbackPrice = 4850;
                            else if (stock.symbol.includes('DMART')) fallbackPrice = 3685;
                            else {
                                // Generate price based on sector
                                if (stock.sector === 'Banking') fallbackPrice = 500 + Math.random() * 1000;
                                else if (stock.sector === 'Information Technology') fallbackPrice = 1000 + Math.random() * 2000;
                                else if (stock.sector === 'Pharmaceuticals') fallbackPrice = 800 + Math.random() * 1500;
                                else if (stock.sector === 'Automobiles') fallbackPrice = 2000 + Math.random() * 8000;
                                else if (stock.sector === 'FMCG') fallbackPrice = 1000 + Math.random() * 3000;
                                else if (stock.sector === 'Oil & Gas') fallbackPrice = 200 + Math.random() * 800;
                                else if (stock.sector === 'Metals') fallbackPrice = 100 + Math.random() * 500;
                                else if (stock.sector === 'Cement') fallbackPrice = 2000 + Math.random() * 15000;
                                else if (stock.sector === 'Real Estate') fallbackPrice = 500 + Math.random() * 2000;
                                else fallbackPrice = 100 + Math.random() * 1000;
                            }
                            
                            const change = (Math.random() - 0.5) * fallbackPrice * 0.03;
                            const changePercent = (change / fallbackPrice) * 100;
                            
                            return {
                                symbol: stock.symbol,
                                name: stock.name,
                                price: Math.round(fallbackPrice * 100) / 100,
                                change: Math.round(change * 100) / 100,
                                changePercent: Math.round(changePercent * 100) / 100,
                                sector: stock.sector,
                                exchange: stock.exchange,
                                source: 'fallback'
                            };
                        }
                    } catch (error) {
                        console.log(`Error fetching price for ${stock.symbol}:`, error.message);
                        
                        // Return with basic fallback price
                        return {
                            symbol: stock.symbol,
                            name: stock.name,
                            price: 100,
                            change: 0,
                            changePercent: 0,
                            sector: stock.sector,
                            exchange: stock.exchange,
                            source: 'error'
                        };
                    }
                })
            );
            
            return res.json({
                status: 'success',
                data: resultsWithRealPrices
            });
        }
        
        // If no results from our database, try the comprehensive stock service
        try {
            const stockData = await comprehensiveStockService.getComprehensiveStockData(query.toUpperCase());
            if (stockData && stockData.name) {
                const result = [{
                    symbol: query.toUpperCase(),
                    name: stockData.name,
                    price: stockData.lastTradedPrice || stockData.currentPrice || 100,
                    change: stockData.oneDayChange || 0,
                    changePercent: stockData.oneDayChangePercent || 0,
                    sector: stockData.sector || 'Unknown',
                    exchange: 'NSE'
                }];
                
                return res.json({
                    status: 'success',
                    data: result
                });
            }
        } catch (error) {
            console.log(`No external data for ${query}`);
        }
        
        // If still no results, return empty array with helpful message
        res.json({
            status: 'success',
            data: [],
            message: `No results found for "${query}". Try searching for popular Indian stocks like RELIANCE, TCS, HDFC, INFY, SBI, etc.`
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get TradingView chart data with enhanced real data
router.get('/chart/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '1d', period = '1mo' } = req.query;
        
        console.log(`📈 Getting enhanced chart data for ${symbol} (${period})`);
        
        // Import chart service
        const { default: chartService } = await import('../../services/chartService.js');
        
        // Get chart data using enhanced chart service
        const chartData = await chartService.getStockChart(symbol, period, interval);
        
        if (chartData && !chartData.error) {
            console.log(`✅ Chart data ready for ${symbol}: ${chartData.candles?.length || 0} candles`);
            
            res.json({
                status: 'success',
                data: {
                    symbol: chartData.symbol,
                    name: chartData.name,
                    currentPrice: chartData.currentPrice,
                    change: chartData.change,
                    changePercent: chartData.changePercent,
                    high: chartData.high,
                    low: chartData.low,
                    volume: chartData.volume,
                    marketCap: chartData.marketCap,
                    pe: chartData.pe,
                    candles: chartData.candles || [],
                    indicators: chartData.indicators || {},
                    dataSource: chartData.dataSource || 'live',
                    period: period,
                    interval: interval,
                    lastUpdated: new Date().toISOString()
                }
            });
        } else {
            console.log(`⚠️ Chart data unavailable for ${symbol}`);
            
            // Return empty structure but with current price if available
            const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
            
            res.json({
                status: 'success',
                data: {
                    symbol: symbol,
                    name: stockData.name || symbol.replace('.NS', ''),
                    currentPrice: stockData.lastTradedPrice || stockData.currentPrice || 0,
                    change: stockData.oneDayChange || 0,
                    changePercent: stockData.oneDayChangePercent || 0,
                    candles: [],
                    indicators: {},
                    dataSource: 'basic',
                    error: 'Chart data unavailable'
                }
            });
        }
    } catch (error) {
        console.error(`❌ Chart error for ${req.params.symbol}:`, error);
        res.status(500).json({
            status: 'error',
            message: 'Chart data unavailable',
            error: error.message
        });
    }
});

// Get popular/trending stocks for better UX
router.get('/popular-stocks', async (req, res) => {
    try {
        // Import the stock database
        const { INDIAN_STOCKS } = await import('../../data/indianStocks.js');
        
        // Popular Indian stocks with updated prices (January 2025)
        const popularStocks = [
            { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', price: 1458, change: 12.30, changePercent: 0.85, sector: 'Oil & Gas' },
            { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', price: 3140, change: -35.30, changePercent: -1.11, sector: 'Information Technology' },
            { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', price: 1740, change: 12.75, changePercent: 0.74, sector: 'Banking' },
            { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1875, change: 18.20, changePercent: 0.98, sector: 'Information Technology' },
            { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', price: 2385, change: -22.40, changePercent: -0.93, sector: 'FMCG' },
            { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', price: 1285, change: 9.80, changePercent: 0.77, sector: 'Banking' },
            { symbol: 'SBIN.NS', name: 'State Bank of India', price: 997, change: 6.20, changePercent: 0.63, sector: 'Banking' },
            { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', price: 1685, change: 28.10, changePercent: 1.69, sector: 'Telecom' },
            { symbol: 'ITC.NS', name: 'ITC Limited', price: 485, change: -3.30, changePercent: -0.68, sector: 'FMCG' },
            { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', price: 3685, change: 52.60, changePercent: 1.45, sector: 'Construction' },
            { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', price: 1785, change: 15.80, changePercent: 0.89, sector: 'Banking' },
            { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', price: 1125, change: -12.90, changePercent: -1.13, sector: 'Banking' },
            { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', price: 11200, change: 165.50, changePercent: 1.50, sector: 'Automobiles' },
            { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', price: 1185, change: 18.40, changePercent: 1.58, sector: 'Pharmaceuticals' },
            { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', price: 11800, change: -125.20, changePercent: -1.05, sector: 'Cement' },
            { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', price: 2420, change: 32.80, changePercent: 1.37, sector: 'Paints' },
            { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', price: 2180, change: 22.60, changePercent: 1.05, sector: 'FMCG' },
            { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', price: 945, change: 15.20, changePercent: 1.63, sector: 'Financial Services' },
            { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', price: 1875, change: 32.90, changePercent: 1.79, sector: 'Information Technology' },
            { symbol: 'WIPRO.NS', name: 'Wipro Limited', price: 295, change: -2.20, changePercent: -0.74, sector: 'Information Technology' }
        ];
        
        res.json({
            status: 'success',
            data: popularStocks
        });
    } catch (error) {
        console.error('Popular stocks error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get stocks by sector
router.get('/stocks-by-sector/:sector', async (req, res) => {
    try {
        const { sector } = req.params;
        
        // Import the stock database
        const { getStocksBySector } = await import('../../data/indianStocks.js');
        
        const sectorStocks = getStocksBySector(sector);
        
        // Add realistic prices to sector stocks
        const stocksWithPrices = sectorStocks.map(stock => {
            let basePrice = 100;
            
            // Set realistic prices based on sector
            if (sector.toLowerCase().includes('banking')) {
                basePrice = 500 + Math.random() * 1500;
            } else if (sector.toLowerCase().includes('technology') || sector.toLowerCase().includes('it')) {
                basePrice = 1000 + Math.random() * 3000;
            } else if (sector.toLowerCase().includes('pharma')) {
                basePrice = 800 + Math.random() * 1200;
            } else if (sector.toLowerCase().includes('auto')) {
                basePrice = 2000 + Math.random() * 10000;
            } else if (sector.toLowerCase().includes('fmcg')) {
                basePrice = 1000 + Math.random() * 2000;
            }
            
            const change = (Math.random() - 0.5) * basePrice * 0.05;
            const changePercent = (change / basePrice) * 100;
            
            return {
                symbol: stock.symbol,
                name: stock.name,
                price: Math.round(basePrice * 100) / 100,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                sector: stock.sector,
                exchange: stock.exchange
            };
        });
        
        res.json({
            status: 'success',
            data: stocksWithPrices
        });
    } catch (error) {
        console.error('Sector stocks error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get all available Indian stocks for comparison
router.get('/all-indian-stocks', async (req, res) => {
    try {
        const { limit = 100, sector, search } = req.query;
        
        console.log(`📊 Getting all Indian stocks (limit: ${limit}, sector: ${sector}, search: ${search})`);
        
        // Import the comprehensive stock database
        const { INDIAN_STOCKS, searchStocks, getStocksBySector } = await import('../../data/indianStocks.js');
        
        let stocks = [...INDIAN_STOCKS];
        
        // Filter by sector if specified
        if (sector && sector !== 'all') {
            stocks = getStocksBySector(sector);
        }
        
        // Filter by search term if specified
        if (search && search.trim()) {
            stocks = searchStocks(search.trim(), 1000); // Get more results for filtering
        }
        
        // Limit results
        const limitedStocks = stocks.slice(0, parseInt(limit));
        
        // Add realistic current prices to all stocks
        const stocksWithPrices = await Promise.all(
            limitedStocks.map(async (stock) => {
                try {
                    // Try to get real price data first
                    const stockData = await comprehensiveStockService.getComprehensiveStockData(stock.symbol);
                    
                    if (stockData.lastTradedPrice && stockData.lastTradedPrice > 0) {
                        // Use real data
                        return {
                            symbol: stock.symbol,
                            name: stockData.name || stock.name,
                            price: Math.round(stockData.lastTradedPrice * 100) / 100,
                            change: Math.round((stockData.oneDayChange || 0) * 100) / 100,
                            changePercent: Math.round((stockData.oneDayChangePercent || 0) * 100) / 100,
                            sector: stockData.sector || stock.sector,
                            exchange: stock.exchange,
                            marketCap: stockData.marketCap,
                            pe: stockData.peRatio,
                            volume: stockData.volume,
                            source: 'live'
                        };
                    } else {
                        // Use fallback prices
                        const fallbackPrice = comprehensiveStockService.generateFallbackPrice ? 
                            comprehensiveStockService.generateFallbackPrice(stock.symbol) : 
                            generateBasicFallbackPrice(stock.symbol, stock.sector);
                        
                        const change = (Math.random() - 0.5) * fallbackPrice * 0.03;
                        const changePercent = (change / fallbackPrice) * 100;
                        
                        return {
                            symbol: stock.symbol,
                            name: stock.name,
                            price: Math.round(fallbackPrice * 100) / 100,
                            change: Math.round(change * 100) / 100,
                            changePercent: Math.round(changePercent * 100) / 100,
                            sector: stock.sector,
                            exchange: stock.exchange,
                            marketCap: fallbackPrice * 1000000000, // Estimate
                            pe: generateSectorBasedPE(stock.sector),
                            volume: Math.floor(Math.random() * 5000000) + 1000000,
                            source: 'estimated'
                        };
                    }
                } catch (error) {
                    console.log(`Error fetching price for ${stock.symbol}:`, error.message);
                    
                    // Return with basic fallback
                    const fallbackPrice = generateBasicFallbackPrice(stock.symbol, stock.sector);
                    return {
                        symbol: stock.symbol,
                        name: stock.name,
                        price: fallbackPrice,
                        change: 0,
                        changePercent: 0,
                        sector: stock.sector,
                        exchange: stock.exchange,
                        source: 'fallback'
                    };
                }
            })
        );
        
        // Sort by market cap (estimated) for better ordering
        stocksWithPrices.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        
        console.log(`✅ Returning ${stocksWithPrices.length} Indian stocks`);
        
        res.json({
            status: 'success',
            data: stocksWithPrices,
            total: stocks.length,
            returned: stocksWithPrices.length,
            filters: {
                sector: sector || 'all',
                search: search || null,
                limit: parseInt(limit)
            },
            sectors: [...new Set(INDIAN_STOCKS.map(s => s.sector))].sort(),
            message: `Found ${stocksWithPrices.length} Indian stocks${sector ? ` in ${sector} sector` : ''}${search ? ` matching "${search}"` : ''}`
        });
    } catch (error) {
        console.error('All Indian stocks error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Helper function for basic fallback prices
function generateBasicFallbackPrice(symbol, sector) {
    // Sector-based pricing
    const sectorPriceMap = {
        'Banking': 500 + Math.random() * 1500,
        'Information Technology': 1000 + Math.random() * 3000,
        'Pharmaceuticals': 800 + Math.random() * 1200,
        'Automobiles': 2000 + Math.random() * 10000,
        'FMCG': 1000 + Math.random() * 3000,
        'Oil & Gas': 200 + Math.random() * 800,
        'Metals': 100 + Math.random() * 500,
        'Cement': 2000 + Math.random() * 15000,
        'Real Estate': 500 + Math.random() * 2000,
        'Power': 200 + Math.random() * 500,
        'Telecom': 300 + Math.random() * 1500,
        'Healthcare': 1000 + Math.random() * 5000,
        'Textiles': 200 + Math.random() * 800,
        'Chemicals': 500 + Math.random() * 2000,
        'Financial Services': 800 + Math.random() * 2000
    };
    
    return Math.round((sectorPriceMap[sector] || (100 + Math.random() * 1000)) * 100) / 100;
}

function generateSectorBasedPE(sector) {
    const sectorPEMap = {
        'Banking': 8 + Math.random() * 12,
        'Information Technology': 15 + Math.random() * 20,
        'Pharmaceuticals': 12 + Math.random() * 18,
        'Automobiles': 10 + Math.random() * 15,
        'FMCG': 20 + Math.random() * 30,
        'Oil & Gas': 6 + Math.random() * 10,
        'Metals': 5 + Math.random() * 10,
        'Cement': 8 + Math.random() * 12,
        'Real Estate': 10 + Math.random() * 20,
        'Power': 12 + Math.random() * 8
    };
    
    return Math.round((sectorPEMap[sector] || (10 + Math.random() * 15)) * 100) / 100;
}
router.get('/test-price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        console.log(`🧪 Testing price fetch for: ${symbol}`);
        
        // Test comprehensive stock service
        const stockData = await comprehensiveStockService.getComprehensiveStockData(symbol);
        
        const result = {
            symbol: symbol,
            testResults: {
                comprehensiveService: {
                    price: stockData.lastTradedPrice,
                    name: stockData.name,
                    change: stockData.oneDayChange,
                    changePercent: stockData.oneDayChangePercent,
                    source: stockData.lastTradedPrice ? 'api' : 'fallback'
                }
            },
            timestamp: new Date().toISOString()
        };
        
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        console.error('Test price error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Reset portfolio for testing (remove existing portfolio to get fresh ₹1 lakh)
router.post('/reset-portfolio/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Delete existing portfolio
        if (mongoose.connection.readyState === 1) {
            const VirtualPortfolio = mongoose.model('VirtualPortfolio');
            await VirtualPortfolio.deleteOne({ userId });
        }
        
        // Create fresh portfolio with ₹1 lakh
        const newPortfolio = await virtualTradingService.getOrCreatePortfolio(userId);
        
        res.json({
            status: 'success',
            message: 'Portfolio reset successfully',
            data: {
                balance: newPortfolio.balance,
                totalValue: newPortfolio.balance,
                message: 'Fresh portfolio created with ₹1,00,000'
            }
        });
        
    } catch (error) {
        console.error('Portfolio reset error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to reset portfolio'
        });
    }
});

export default router;
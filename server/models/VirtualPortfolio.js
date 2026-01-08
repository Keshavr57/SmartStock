import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    symbol: { type: String, required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    fees: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    orderId: { type: String, unique: true },
    status: { type: String, enum: ['PENDING', 'EXECUTED', 'CANCELLED'], default: 'EXECUTED' }
});

const holdingSchema = new mongoose.Schema({
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    avgPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    totalInvested: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const portfolioSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 100000 }, // Starting with ₹1 Lakh
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    totalPnL: { type: Number, default: 0 },
    totalPnLPercent: { type: Number, default: 0 },
    holdings: [holdingSchema],
    transactions: [transactionSchema],
    watchlist: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('VirtualPortfolio', portfolioSchema);
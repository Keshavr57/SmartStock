import mongoose from 'mongoose';

// Append-only ledger of executed orders.
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  name: String,
  side: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['MARKET'],
    default: 'MARKET'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0
  },
  // Cash impact on the account: negative for buys, positive for sells.
  netAmount: {
    type: Number,
    required: true
  },
  // Profit realised by a SELL against the average buy price (fees included).
  realizedPnL: {
    type: Number,
    default: null
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  priceSource: String,
  executedAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.index({ userId: 1, executedAt: -1 });

export default mongoose.model('Transaction', transactionSchema);

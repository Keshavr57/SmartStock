import mongoose from 'mongoose';

const stockFundamentalsSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, index: true },
  nsSymbol: { type: String, required: true }, // e.g. RELIANCE.NS
  name: { type: String, required: true },
  sector: String,
  industry: String,
  exchange: { type: String, default: 'NSE' },

  // Valuation
  peRatio: Number,
  pbRatio: Number,
  eps: Number,
  bookValue: Number,
  beta: Number,
  marketCapCr: Number, // in ₹ Crore

  // Profitability
  roe: Number,        // in %
  roce: Number,       // in %
  profitMargin: Number,  // in %
  grossMargin: Number,
  operatingMargin: Number,

  // Financials (₹ Crore)
  revenueCr: Number,
  netIncomeCr: Number,
  totalAssetsCr: Number,

  // Growth
  revenueGrowth: Number,  // in %
  earningsGrowth: Number,

  // Debt
  debtToEquity: Number,
  currentRatio: Number,

  // Dividend
  dividendYield: Number,  // in %

  // Ownership
  promoterHolding: Number,  // in %
  fiiHolding: Number,        // in %

  // Meta
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const StockFundamentals = mongoose.model('StockFundamentals', stockFundamentalsSchema);
export default StockFundamentals;

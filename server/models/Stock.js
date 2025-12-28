import mongoose from "mongoose";

const StockSchema = new mongoose.Schema(
  {
    symbol: String,

    price: Number,
    marketCap: Number,
    pe: Number,
    roe: Number,
    profitMargin: Number,
    revenue: Number,
    debtToEquity: Number,
    recommendation: String,

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { strict: false } // 🔥 IMPORTANT
);

export default mongoose.model("Stock", StockSchema);

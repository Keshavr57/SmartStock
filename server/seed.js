import YahooFinance from "yahoo-finance2";
import connectDB from "./config/db.js";
import Stock from "./models/Stock.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


const yahoo = new YahooFinance({
  suppressNotices: ["yahooSurvey"]
});

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ DB Connected");

const symbols = ["AAPL", "MSFT", "GOOGL", "TCS.NS", "INFY.NS"];

for (const symbol of symbols) {
  try {
    const data = await yahoo.quoteSummary(symbol, {
      modules: ["price", "summaryDetail", "financialData"]
    });

    await Stock.findOneAndUpdate(
      { symbol },
      {
        symbol,
        price: data.price?.regularMarketPrice,
        marketCap: data.price?.marketCap,
        roe: data.financialData?.returnOnEquity,
        roa: data.financialData?.returnOnAssets,
        pe: data.summaryDetail?.trailingPE,
        revenue: data.financialData?.totalRevenue,
        profitMargin: data.financialData?.profitMargins,
        recommendation: data.financialData?.recommendationKey
      },
      { upsert: true }
    );

    console.log(`✅ ${symbol} saved`);
  } catch (err) {
    console.log(`❌ ${symbol} error`, err.message);
  }
}

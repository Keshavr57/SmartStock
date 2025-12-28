import Stock from "../models/Stock.js";
import { fetchStockData } from "./stock.service.js";

export const fetchAndSave = async (symbol) => {
  const data = await fetchStockData(symbol);

  if (!data) {
    console.log("❌ No data for", symbol);
    return;
  }

  const stock = {
    symbol,
    price: data.price,
    summaryDetail: data.summaryDetail,
    financialData: data.financialData,
    incomeStatement: data.incomeStatementHistory?.incomeStatementHistory?.[0],
    balanceSheet: data.balanceSheetHistory?.balanceSheetStatements?.[0],
    cashflow: data.cashflowStatementHistory?.cashflowStatements?.[0],
  };

  await Stock.findOneAndUpdate(
    { symbol },
    stock,
    { upsert: true, new: true }
  );

  console.log(`✅ ${symbol} saved successfully`);
};

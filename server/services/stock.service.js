import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export const fetchStockData = async (symbol) => {
  try {
    const data = await yahooFinance.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryDetail",
        "financialData",
        // "fundamentalsTimeSeries"
      ],
    });

    return {
      symbol,
      price: data.price,
      summary: data.summaryDetail,
      financials: data.financialData,
      fundamentals: data.fundamentalsTimeSeries
    };
  } catch (err) {
    console.error("Yahoo Error:", err.message);
    return null;
  }
};

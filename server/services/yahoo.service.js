import YahooFinance from "yahoo-finance2";

const yahoo = new YahooFinance({
  suppressNotices: ["yahooSurvey"]
});

export const fetchYahooFundamentals = async (symbol) => {
  try {
    const data = await yahoo.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryDetail", 
        "financialData",
        "defaultKeyStatistics",
        "quoteType"
      ]
    });

    // Helper function to safely extract numeric values
    const getNumericValue = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object' && value.raw !== undefined) return value.raw;
      if (typeof value === 'number') return value;
      return null;
    };

    return {
      // price - try multiple sources
      price: getNumericValue(data.price?.regularMarketPrice) ?? 
             getNumericValue(data.financialData?.currentPrice) ?? 
             getNumericValue(data.summaryDetail?.previousClose) ?? null,

      // market cap - try multiple sources
      marketCap: getNumericValue(data.price?.marketCap) ??
                 getNumericValue(data.summaryDetail?.marketCap) ??
                 getNumericValue(data.defaultKeyStatistics?.marketCap) ?? null,

      // P/E ratio - try multiple sources
      pe: getNumericValue(data.summaryDetail?.trailingPE) ?? 
          getNumericValue(data.summaryDetail?.forwardPE) ?? 
          getNumericValue(data.defaultKeyStatistics?.trailingPE) ?? null,

      // ROE - try multiple sources
      roe: getNumericValue(data.financialData?.returnOnEquity) ?? 
           getNumericValue(data.defaultKeyStatistics?.returnOnEquity) ?? null,

      // Profit margin
      profitMargin: getNumericValue(data.financialData?.profitMargins) ?? 
                    getNumericValue(data.defaultKeyStatistics?.profitMargins) ?? null,

      // Revenue
      revenue: getNumericValue(data.financialData?.totalRevenue) ?? 
               getNumericValue(data.financialData?.revenuePerShare) ?? null,

      // Debt to equity
      debtToEquity: getNumericValue(data.financialData?.debtToEquity) ?? null,

      // Recommendation
      recommendation: data.financialData?.recommendationKey ?? "neutral"
    };
  } catch (err) {
    console.error("Yahoo Error for", symbol, ":", err.message);
    return null;
  }
};

export const fetchYahooHistory = async (symbol, range = "1mo") => {
  try {
    // yahoo-finance2 chart() now requires period1 and period2 for historical data
    // period1 is start date, period2 is end date.
    // We can also use '1mo' as a string if we use the legacy 'chart' options structure
    // actually, the error said period1 is missing.

    const now = new Date();
    const period2 = Math.floor(now.getTime() / 1000);
    const period1 = period2 - (30 * 24 * 60 * 60); // Roughly 1 month ago

    const data = await yahoo.chart(symbol, {
      period1,
      period2,
      interval: "1d"
    });

    if (!data || !data.quotes) return [];

    return data.quotes.map(q => ({
      date: q.date,
      price: q.close
    }));
  } catch (err) {
    console.error("Yahoo History Error:", err.message);
    return [];
  }
};

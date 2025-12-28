import axios from "axios";

export const fetchIndianStock = async (symbol) => {
  try {
    const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "");
    
    const res = await axios.get(
      "https://stock.indianapi.in/stock",
      {
        params: {
          name: cleanSymbol
        },
        headers: {
          "X-Api-Key": process.env.INDIAN_API_KEY
        }
      }
    );

    const d = res.data;
    console.log(`📊 Indian API response for ${symbol}:`, JSON.stringify(d, null, 2));

    // Helper function to safely extract numeric values
    const getNumericValue = (value) => {
      if (value === null || value === undefined || value === "N/A" || value === "") return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[,%]/g, ''));
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    return {
      symbol,

      // price & market cap - handle different response formats
      price: d.currentPrice ?? d.price ?? d.ltp ?? null,
      marketCap: getNumericValue(d.marketCap) ?? getNumericValue(d.market_cap) ?? null,

      // ratios - try different nested structures
      pe: getNumericValue(d.ratios?.pe) ?? 
          getNumericValue(d.pe) ?? 
          getNumericValue(d.peRatio) ?? 
          getNumericValue(d.priceToEarnings) ?? null,
          
      roe: getNumericValue(d.ratios?.roe) ?? 
           getNumericValue(d.roe) ?? 
           getNumericValue(d.returnOnEquity) ?? null,
           
      profitMargin: getNumericValue(d.ratios?.profitMargin) ?? 
                    getNumericValue(d.profitMargin) ?? 
                    getNumericValue(d.profit_margin) ?? null,
                    
      debtToEquity: getNumericValue(d.ratios?.debtEquity) ?? 
                    getNumericValue(d.debtToEquity) ?? 
                    getNumericValue(d.debt_to_equity) ?? null,

      // financials - try different nested structures
      revenue: getNumericValue(d.financials?.revenue) ?? 
               getNumericValue(d.revenue) ?? 
               getNumericValue(d.totalRevenue) ?? null,

      // rating
      recommendation: d.rating ?? d.recommendation ?? "neutral"
    };
  } catch (err) {
    console.error("❌ Indian API Error for", symbol, ":", err.message);
    return null;
  }
};

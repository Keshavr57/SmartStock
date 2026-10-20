import axios from 'axios';

export const fetchYahooFundamentals = async (symbol) => {
  try {
    const modules = 'price,summaryDetail,financialData,defaultKeyStatistics,quoteType';
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`;
    
    const response = await axios.get(url, {
      params: { modules },
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://finance.yahoo.com'
      }
    });

    const result = response.data?.quoteSummary?.result?.[0];
    if (!result) return null;

    const getNumericValue = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object' && value.raw !== undefined) return value.raw;
      if (typeof value === 'number') return value;
      return null;
    };

    const price = result.price || {};
    const fd = result.financialData || {};
    const sd = result.summaryDetail || {};
    const ks = result.defaultKeyStatistics || {};

    return {
      price: getNumericValue(price.regularMarketPrice) ?? 
             getNumericValue(fd.currentPrice) ?? 
             getNumericValue(sd.previousClose) ?? null,

      marketCap: getNumericValue(price.marketCap) ??
                 getNumericValue(sd.marketCap) ??
                 getNumericValue(ks.marketCap) ?? null,

      pe: getNumericValue(sd.trailingPE) ?? 
          getNumericValue(sd.forwardPE) ?? 
          getNumericValue(ks.trailingPE) ?? null,

      roe: getNumericValue(fd.returnOnEquity) ?? 
           getNumericValue(ks.returnOnEquity) ?? null,

      profitMargin: getNumericValue(fd.profitMargins) ?? 
                    getNumericValue(ks.profitMargins) ?? null,

      revenue: getNumericValue(fd.totalRevenue) ?? 
               getNumericValue(fd.revenuePerShare) ?? null,

      debtToEquity: getNumericValue(fd.debtToEquity) ?? null,

      recommendation: fd.recommendationKey ?? "neutral"
    };
  } catch (err) {
    console.error("Yahoo Error for", symbol, ":", err.message);
    return null;
  }
};

export const fetchYahooHistory = async (symbol, range = "1mo") => {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: { range: range, interval: '1d' },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.yahoo.com'
      }
    });

    const result = response.data?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const quotes = result.indicators.quote[0];
    return result.timestamp
      .map((time, index) => ({ date: new Date(time * 1000), price: quotes.close[index] }))
      .filter(point => point.price != null);
  } catch (err) {
    console.warn(`Yahoo history failed for ${symbol}: ${err.message}`);
    return [];
  }
};

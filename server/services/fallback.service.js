import axios from "axios";

// Alternative free API for Indian stocks
export const fetchAlternativeIndianStock = async (symbol) => {
  try {
    const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "");
    
    // Try Alpha Vantage free tier (if you have API key)
    // Or use a mock service with realistic data for demo
    
    // For now, let's create a mock service with realistic Indian stock data
    const mockData = getMockIndianStockData(cleanSymbol);
    
    if (mockData) {
      return {
        symbol,
        ...mockData
      };
    }
    
    return null;
  } catch (err) {
    console.error("❌ Fallback API Error:", err.message);
    return null;
  }
};

// Mock data for common Indian stocks (for demo purposes)
const getMockIndianStockData = (symbol) => {
  const mockDatabase = {
    "RELIANCE": {
      price: 1558.20,
      marketCap: 1054000000000, // 10.54 Lakh Crores
      pe: 15.2,
      roe: 12.8,
      profitMargin: 8.5,
      debtToEquity: 0.35,
      revenue: 792000000000, // 7.92 Lakh Crores
      recommendation: "buy"
    },
    "TCS": {
      price: 3280.00,
      marketCap: 1195000000000, // 11.95 Lakh Crores
      pe: 28.5,
      roe: 45.2,
      profitMargin: 25.1,
      debtToEquity: 0.02,
      revenue: 216000000000, // 2.16 Lakh Crores
      recommendation: "buy"
    },
    "HDFCBANK": {
      price: 1742.50,
      marketCap: 1325000000000, // 13.25 Lakh Crores
      pe: 18.9,
      roe: 17.2,
      profitMargin: 23.8,
      debtToEquity: 0.85,
      revenue: 185000000000, // 1.85 Lakh Crores
      recommendation: "buy"
    },
    "INFY": {
      price: 1845.30,
      marketCap: 765000000000, // 7.65 Lakh Crores
      pe: 25.4,
      roe: 31.5,
      profitMargin: 21.2,
      debtToEquity: 0.08,
      revenue: 182000000000, // 1.82 Lakh Crores
      recommendation: "hold"
    },
    "ICICIBANK": {
      price: 1285.75,
      marketCap: 902000000000, // 9.02 Lakh Crores
      pe: 16.8,
      roe: 18.9,
      profitMargin: 26.5,
      debtToEquity: 0.92,
      revenue: 167000000000, // 1.67 Lakh Crores
      recommendation: "buy"
    },
    "BHARTIARTL": {
      price: 1598.40,
      marketCap: 952000000000, // 9.52 Lakh Crores
      pe: 22.1,
      roe: 14.6,
      profitMargin: 12.8,
      debtToEquity: 0.68,
      revenue: 138000000000, // 1.38 Lakh Crores
      recommendation: "hold"
    },
    "SBIN": {
      price: 825.60,
      marketCap: 736000000000, // 7.36 Lakh Crores
      pe: 12.5,
      roe: 15.8,
      profitMargin: 18.9,
      debtToEquity: 1.25,
      revenue: 145000000000, // 1.45 Lakh Crores
      recommendation: "buy"
    },
    "LT": {
      price: 3685.20,
      marketCap: 515000000000, // 5.15 Lakh Crores
      pe: 31.2,
      roe: 12.4,
      profitMargin: 8.9,
      debtToEquity: 0.42,
      revenue: 175000000000, // 1.75 Lakh Crores
      recommendation: "hold"
    }
  };
  
  return mockDatabase[symbol] || null;
};

// US Stock mock data
export const fetchAlternativeUSStock = async (symbol) => {
  const mockUSData = {
    "AAPL": {
      price: 195.89,
      marketCap: 3020000000000, // $3.02T
      pe: 29.8,
      roe: 63.2,
      profitMargin: 25.3,
      debtToEquity: 1.73,
      revenue: 394000000000, // $394B
      recommendation: "buy"
    },
    "MSFT": {
      price: 415.26,
      marketCap: 3080000000000, // $3.08T
      pe: 34.5,
      roe: 36.8,
      profitMargin: 36.7,
      debtToEquity: 0.47,
      revenue: 245000000000, // $245B
      recommendation: "buy"
    },
    "GOOGL": {
      price: 178.32,
      marketCap: 2200000000000, // $2.2T
      pe: 24.1,
      roe: 29.2,
      profitMargin: 23.1,
      debtToEquity: 0.11,
      revenue: 307000000000, // $307B
      recommendation: "buy"
    },
    "TSLA": {
      price: 436.58,
      marketCap: 1390000000000, // $1.39T
      pe: 88.2,
      roe: 19.3,
      profitMargin: 8.9,
      debtToEquity: 0.17,
      revenue: 96000000000, // $96B
      recommendation: "hold"
    }
  };
  
  const data = mockUSData[symbol];
  return data ? { symbol, ...data } : null;
};
// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050',
  WEBSOCKET_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050'
};

// API Endpoints
export const ENDPOINTS = {
  // Virtual Trading
  PORTFOLIO: (userId: string) => `${API_CONFIG.BASE_URL}/virtual/portfolio/${userId}`,
  HOLDINGS: (userId: string) => `${API_CONFIG.BASE_URL}/virtual/holdings/${userId}`,
  TRANSACTIONS: (userId: string, limit?: number) => 
    `${API_CONFIG.BASE_URL}/virtual/transactions/${userId}${limit ? `?limit=${limit}` : ''}`,
  WATCHLIST: (userId: string) => `${API_CONFIG.BASE_URL}/virtual/watchlist/${userId}`,
  WATCHLIST_ITEM: (userId: string, symbol: string) => 
    `${API_CONFIG.BASE_URL}/virtual/watchlist/${userId}/${symbol}`,
  ORDER: (userId: string) => `${API_CONFIG.BASE_URL}/virtual/order/${userId}`,
  QUOTE: (symbol: string) => `${API_CONFIG.BASE_URL}/virtual/quote/${symbol}`,
  SEARCH: (query: string) => `${API_CONFIG.BASE_URL}/virtual/search/${query}`,
  MARKET_STATUS: `${API_CONFIG.BASE_URL}/virtual/market-status`,
  CHART: (symbol: string, interval?: string) => 
    `${API_CONFIG.BASE_URL}/virtual/chart/${symbol}${interval ? `?interval=${interval}` : ''}`,
  
  // Authentication
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/auth/login`,
    REGISTER: `${API_CONFIG.BASE_URL}/auth/register`,
    GOOGLE: `${API_CONFIG.BASE_URL}/auth/google`,
    VERIFY: `${API_CONFIG.BASE_URL}/auth/verify`
  }
};
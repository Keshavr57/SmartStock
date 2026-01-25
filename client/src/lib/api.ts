import axios from 'axios';
import { API_CONFIG } from './config';

export const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 45000, // Increased timeout for cold starts
});

// Add auth interceptor to include token in all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Enhanced response interceptor for cold start handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout - server may be starting up (cold start)');
            // You could show a specific message to users about server startup
        }
        
        // Handle 502/503 errors (common during cold starts)
        if (error.response?.status === 502 || error.response?.status === 503) {
            console.error('Server unavailable - likely cold start in progress');
        }
        
        return Promise.reject(error);
    }
);

export const aiApi = axios.create({
    baseURL: API_CONFIG.AI_SERVICE_URL,
    timeout: 30000, // AI requests can take longer
});

// Market highlights
export const getMarketHighlights = async () => {
    const response = await api.get('/market/landing-data');
    return response.data;
};

// Market charts data
export const getMarketCharts = async () => {
    const response = await api.get('/market/charts');
    return response.data;
};

// Compare stocks
export const compareAssets = async (symbols: string[]) => {
    const response = await api.post('/compare', { symbols });
    return response.data;
};

// Comprehensive stock comparison
export const getComprehensiveComparison = async (symbols: string[]) => {
    const response = await api.post('/compare/comprehensive', { symbols });
    return response.data;
};

// IPOs - REAL data only with fast loading
export const getUpcomingIPOs = async (fastMode = false, forceRefresh = false) => {
    const timeout = fastMode ? 5000 : 15000; // Fast mode for initial load
    const refreshParam = forceRefresh ? '&refresh=true&clear=true' : '';
    const fastParam = fastMode ? 'fast=true' : '';
    const params = `?${fastParam}${refreshParam}&t=${Date.now()}`;
    
    const response = await api.get(`/ipo/upcoming${params}`, { timeout });
    return response.data;
};

// News - REAL data only with fast loading
export const getTrendingNews = async (fastMode = false) => {
    const timeout = fastMode ? 5000 : 15000; // Fast mode for initial load
    const response = await api.get(`/news/trending?t=${Date.now()}`, { timeout });
    return response.data;
};

// Fast news loading for initial page load
export const getFastNews = async () => {
    return getTrendingNews(true);
};

// Learning
export const getLearningList = async () => {
    const response = await api.get('/learning/list');
    return response.data;
};

export const getLessonContent = async (id: string) => {
    const response = await api.get(`/learning/lesson/${id}`);
    return response.data;
};

// AI Advisor (Chat)
export const processAiQuery = async (message: string, userId: string = 'client_user') => {
    // Use the main API instead of direct AI service call
    const response = await api.post('/chat/ai-chat', { message, userId });
    return response.data;
};

export const getNewsBySentiment = async (sentiment: 'positive' | 'negative' | 'neutral') => {
    const response = await api.get(`/news/sentiment/${sentiment}`);
    return response.data;
};

export const getNewsByImpact = async (impact: 'high' | 'medium' | 'low') => {
    const response = await api.get(`/news/impact/${impact}`);
    return response.data;
};

export const getNewsAnalytics = async () => {
    const response = await api.get('/news/analytics');
    return response.data;
};

// Market History
export const getAssetsHistory = async (symbols: string[], period: string = '1mo') => {
    const response = await api.get('/market/history', {
        params: { symbols: symbols.join(','), period }
    });
    return response.data;
};

// Trading API functions
export const getUserPortfolio = async (userId: string) => {
    const response = await api.get(`/trading/portfolio/${userId}`);
    return response.data;
};

export const executeBuyOrder = async (orderData: {
    userId: string;
    symbol: string;
    name: string;
    type: 'stock' | 'crypto';
    quantity: number;
}) => {
    const response = await api.post('/trading/buy', orderData);
    return response.data;
};

export const executeSellOrder = async (orderData: {
    userId: string;
    symbol: string;
    name: string;
    type: 'stock' | 'crypto';
    quantity: number;
}) => {
    const response = await api.post('/trading/sell', orderData);
    return response.data;
};

export const getTransactionHistory = async (userId: string, limit?: number) => {
    const params = limit ? { limit } : {};
    const response = await api.get(`/trading/transactions/${userId}`, { params });
    return response.data;
};

export const getTradingMarketData = async () => {
    const response = await api.get('/trading/market-data');
    return response.data;
};

export const getCurrentPrice = async (symbol: string, type: 'stock' | 'crypto') => {
    const response = await api.get(`/trading/price/${type}/${symbol}`);
    return response.data;
};

// Chart data functions
export const getChartData = async (symbol: string, type: 'stock' | 'crypto', period: string = '1d', interval: string = '5m') => {
    const response = await api.get(`/trading/chart/${type}/${symbol}`, {
        params: { period, interval }
    });
    return response.data;
};

export const getWatchlist = async (userId: string) => {
    const response = await api.get(`/trading/watchlist/${userId}`);
    return response.data;
};

export const getPortfolioAnalytics = async (userId: string) => {
    const response = await api.get(`/trading/portfolio/${userId}/analytics`);
    return response.data;
};
import axios from 'axios';
import { API_CONFIG } from './config';

export const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
});

export const aiApi = axios.create({
    baseURL: API_CONFIG.AI_SERVICE_URL,
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

// IPOs
export const getUpcomingIPOs = async () => {
    const response = await api.get(`/ipo/upcoming?t=${Date.now()}`);
    return response.data;
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
    const response = await aiApi.post('/process', { message, user_id: userId });
    return response.data;
};

// News
export const getTrendingNews = async () => {
    const response = await api.get(`/news/trending?t=${Date.now()}`);
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
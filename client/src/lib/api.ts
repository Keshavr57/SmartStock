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

// Real-time top movers (gainers and losers)
export const getTopMovers = async () => {
    const response = await api.get('/market/top-movers');
    return response.data;
};

// Market status
export const getMarketStatus = async () => {
    const response = await api.get('/market/status');
    return response.data.data;
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

// IPOs from NSE: open, upcoming and closed in the last 30 days.
// The first load builds the board server-side (several NSE calls), so allow a longer timeout.
export const getIpoBoard = async (refresh = false) => {
    const response = await api.get('/ipo', { params: refresh ? { refresh: 1 } : {}, timeout: 30000 });
    return response.data;
};

// News with sentiment/event tags and measured historical impact.
export const getTrendingNews = async () => {
    const response = await api.get('/news/trending', { timeout: 20000 });
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

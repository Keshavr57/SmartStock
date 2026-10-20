import express from 'express';
const router = express.Router();
import { 
    getTrendingNews, 
    getNewsBySentiment, 
    getNewsByImpact, 
    getNewsAnalytics,
    getSymbolNews
} from './news.controller.js';

// GET /api/news/trending - All news with sentiment analysis
router.get('/trending', getTrendingNews);

// GET /api/news/sentiment/:sentiment - Filter by sentiment (positive/negative/neutral)
router.get('/sentiment/:sentiment', getNewsBySentiment);

// GET /api/news/impact/:impact - Filter by market impact (high/medium/low)
router.get('/impact/:impact', getNewsByImpact);

// GET /api/news/symbol/:symbol - Stored headlines about one stock
router.get('/symbol/:symbol', getSymbolNews);

// GET /api/news/analytics - News analytics and statistics
router.get('/analytics', getNewsAnalytics);

export default router;
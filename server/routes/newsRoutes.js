import express from 'express';
const router = express.Router();
import { 
    getTrendingNews, 
    getNewsBySentiment, 
    getNewsByImpact, 
    getNewsAnalytics 
} from '../controllers/newsController.js';

// GET /api/news/trending - All news with sentiment analysis
router.get('/trending', getTrendingNews);

// GET /api/news/sentiment/:sentiment - Filter by sentiment (positive/negative/neutral)
router.get('/sentiment/:sentiment', getNewsBySentiment);

// GET /api/news/impact/:impact - Filter by market impact (high/medium/low)
router.get('/impact/:impact', getNewsByImpact);

// GET /api/news/analytics - News analytics and statistics
router.get('/analytics', getNewsAnalytics);

export default router;
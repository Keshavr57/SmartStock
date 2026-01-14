import newsService from './news.service.js';

export const getTrendingNews = async (req, res) => {
    try {
        const news = await newsService.getUnifiedNews();
        res.status(200).json({
            status: "success",
            data: news
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getNewsBySentiment = async (req, res) => {
    try {
        const { sentiment } = req.params;
        if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid sentiment. Use: positive, negative, or neutral" 
            });
        }
        
        const news = await newsService.getNewsBySentiment(sentiment);
        res.status(200).json({
            status: "success",
            sentiment: sentiment,
            count: news.length,
            data: news
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getNewsByImpact = async (req, res) => {
    try {
        const { impact } = req.params;
        if (!['high', 'medium', 'low'].includes(impact)) {
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid impact level. Use: high, medium, or low" 
            });
        }
        
        const news = await newsService.getNewsByImpact(impact);
        res.status(200).json({
            status: "success",
            impact: impact,
            count: news.length,
            data: news
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getNewsAnalytics = async (req, res) => {
    try {
        const allNews = await newsService.getUnifiedNews();
        
        // Calculate analytics
        const analytics = {
            total: allNews.length,
            sentiment: {
                positive: allNews.filter(n => n.sentiment === 'positive').length,
                negative: allNews.filter(n => n.sentiment === 'negative').length,
                neutral: allNews.filter(n => n.sentiment === 'neutral').length
            },
            impact: {
                high: allNews.filter(n => n.marketImpact === 'high').length,
                medium: allNews.filter(n => n.marketImpact === 'medium').length,
                low: allNews.filter(n => n.marketImpact === 'low').length
            },
            sources: {}
        };
        
        // Count by source
        allNews.forEach(news => {
            analytics.sources[news.source] = (analytics.sources[news.source] || 0) + 1;
        });
        
        res.status(200).json({
            status: "success",
            data: analytics
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
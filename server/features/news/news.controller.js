import { getLatestNews, getNewsForSymbol, getNewsAnalytics as buildAnalytics } from './news.service.js';

const SENTIMENTS = new Set(['positive', 'negative', 'neutral']);
const IMPACTS = new Set(['high', 'medium', 'low']);

const respond = async (res, filters) => {
    try {
        const data = await getLatestNews(filters);
        res.json({ status: 'success', count: data.length, data, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('News error:', error.message);
        res.status(503).json({ status: 'error', message: 'News feeds are temporarily unavailable' });
    }
};

export const getTrendingNews = (req, res) => respond(res, {
    symbol: req.query.symbol ? String(req.query.symbol).toUpperCase() : undefined
});

export const getNewsBySentiment = (req, res) => {
    if (!SENTIMENTS.has(req.params.sentiment)) return res.status(400).json({ status: 'error', message: 'Invalid sentiment' });
    return respond(res, { sentiment: req.params.sentiment });
};

export const getNewsByImpact = (req, res) => {
    if (!IMPACTS.has(req.params.impact)) return res.status(400).json({ status: 'error', message: 'Invalid impact level' });
    return respond(res, { impact: req.params.impact });
};

export const getNewsAnalytics = async (req, res) => {
    try {
        res.json({ status: 'success', data: await buildAnalytics() });
    } catch (error) {
        console.error('News analytics error:', error.message);
        res.status(503).json({ status: 'error', message: 'News analytics unavailable' });
    }
};

export const getSymbolNews = async (req, res) => {
    const symbol = String(req.params.symbol || '').toUpperCase();
    if (!/^[A-Z0-9&-]{1,20}\.(NS|BO)$/.test(symbol)) return res.status(400).json({ status: 'error', message: 'Invalid symbol' });
    try {
        const data = await getNewsForSymbol(symbol);
        res.json({ status: 'success', count: data.length, data });
    } catch (error) {
        console.error('Symbol news error:', error.message);
        res.status(503).json({ status: 'error', message: 'News unavailable' });
    }
};

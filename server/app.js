import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import performanceMonitor from './middleware/performanceMonitor.js';

import stockRoutes from './features/stocks/stock.routes.js';
import ipoRoutes from './features/ipo/ipo.routes.js';
import newsRoutes from './features/news/news.routes.js';
import learningRoutes from './features/learning/learning.routes.js';
import tradingRoutes from './features/trading/trading.routes.js';
import marketRoutes from './features/market/market.routes.js';
import authRoutes from './features/auth/auth.routes.js';

export const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'https://smart-stock-ku3d.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

const limiter = (windowMs, limit, message) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { status: 'error', code: 'RATE_LIMITED', message }
});

export function createApp() {
    const app = express();

    // Render/Vercel sit behind one proxy hop; needed so rate limiting sees the real client IP.
    app.set('trust proxy', 1);

    app.use(helmet());
    app.use(cors({
        origin(origin, callback) {
            // Requests without an Origin header (curl, server-to-server) are allowed.
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        maxAge: 86400
    }));

    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ extended: true, limit: '100kb' }));
    app.use(performanceMonitor);

    if (process.env.NODE_ENV !== 'test') {
        app.use((req, res, next) => {
            console.log(`📥 ${req.method} ${req.path}`);
            next();
        });
    }

    app.use('/api', limiter(15 * 60 * 1000, 600, 'Too many requests. Please slow down.'));
    app.use(['/api/auth/login', '/api/auth/register', '/api/auth/google'],
        limiter(15 * 60 * 1000, 20, 'Too many login attempts. Try again in 15 minutes.'));
    app.use('/api/trading/order', limiter(60 * 1000, 30, 'Too many orders. Please wait a minute.'));

    app.use('/api', stockRoutes);
    app.use('/api/ipo', ipoRoutes);
    app.use('/api/news', newsRoutes);
    app.use('/api/learning', learningRoutes);
    app.use('/api/trading', tradingRoutes);
    app.use('/api/market', marketRoutes);
    app.use('/api/auth', authRoutes);
    // The AI advisor is a separate service (ai-service/), called directly by the client.

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            uptime: process.uptime()
        });
    });

    app.get('/', (req, res) => {
        res.json({ message: 'SmartStock API', health: '/api/health' });
    });

    app.use('/api', (req, res) => {
        res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` });
    });

    // Final error handler: never leak stack traces or internal messages to clients.
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err.message === 'Not allowed by CORS') {
            return res.status(403).json({ status: 'error', code: 'CORS', message: 'Origin not allowed' });
        }
        if (err.type === 'entity.parse.failed') {
            return res.status(400).json({ status: 'error', code: 'INVALID_JSON', message: 'Request body is not valid JSON' });
        }
        if (err.type === 'entity.too.large') {
            return res.status(413).json({ status: 'error', code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' });
        }
        console.error('Unhandled error:', err);
        res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Something went wrong' });
    });

    return app;
}

export default createApp;

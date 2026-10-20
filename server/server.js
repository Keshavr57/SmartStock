// Must be the first import: loads .env before any module reads process.env.
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import keepAliveService from './utils/keepAlive.js';
import { createApp, allowedOrigins } from './app.js';
import { getIpoBoard } from './features/ipo/ipo.service.js';
import { getLatestNews, computePendingReactions } from './features/news/news.service.js';

// Fail fast on missing configuration instead of crashing mid-request.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET is shorter than 32 characters; use a long random value in production.');
}

const app = createApp();
const httpServer = createServer(app);

connectDB();

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

global.io = io;

io.on('connection', (socket) => {
    socket.on('join-ipo-updates', () => {
        socket.join('ipo-updates');
    });
});

const PORT = process.env.PORT || 5050;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    keepAliveService.start();
    // Warm the IPO board (dozens of NSE calls) so the first visitor doesn't wait for it.
    setTimeout(() => getIpoBoard().catch(err => console.warn('IPO warm-up failed:', err.message)), 3000);
    startNewsPipeline();
});

// Keeps the news event-study dataset growing: store fresh headlines, then measure reactions of older ones.
const NEWS_PIPELINE_MS = 30 * 60 * 1000;
function startNewsPipeline() {
    const run = async () => {
        try {
            await getLatestNews();
            const { done } = await computePendingReactions(300);
            if (done) console.log(`📰 Measured ${done} news price reactions`);
        } catch (error) {
            console.warn('News pipeline run failed:', error.message);
        }
    };
    setTimeout(run, 60 * 1000);
    setInterval(run, NEWS_PIPELINE_MS).unref();
}

const shutdown = (signal) => {
    console.log(`🛑 ${signal} received, shutting down gracefully...`);
    keepAliveService.stop();
    httpServer.close(() => process.exit(0));
};
// A stray rejected promise (e.g. a flaky upstream API) should be logged, not take down every route.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;

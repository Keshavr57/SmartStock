import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import keepAliveService from './utils/keepAlive.js';
import performanceMonitor from './middleware/performanceMonitor.js';

// Import routes from organized features
import stockRoutes from './features/stocks/stock.routes.js';
import ipoRoutes from './features/ipo/ipo.routes.js';
import newsRoutes from './features/news/news.routes.js';
import learningRoutes from './features/learning/learning.routes.js';
import tradingRoutes from './features/trading/trading.routes.js';
import marketRoutes from './features/market/market.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import chatRoutes from './features/chat/chat.routes.js';

dotenv.config();

// Debug: Log environment variables
console.log('🔍 Environment Check:', {
    ALLOWED_ORIGINS_RAW: process.env.ALLOWED_ORIGINS,
    ALLOWED_ORIGINS_EXISTS: !!process.env.ALLOWED_ORIGINS,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
});

const app = express();
const httpServer = createServer(app);

// CORS Configuration - Enhanced for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'https://smart-stock-ku3d.vercel.app',
        'http://localhost:5173', 
        'http://localhost:3000', 
        'http://localhost:3001'
    ];

console.log('🌐 CORS Configuration:', {
    ALLOWED_ORIGINS: allowedOrigins,
    NODE_ENV: process.env.NODE_ENV || 'development'
});

// Enable CORS with proper configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            console.log('✅ Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance monitoring
app.use(performanceMonitor);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// Connect to Database
connectDB();

// Socket.IO Setup with enhanced CORS
const io = new Server(httpServer, {
    cors: {
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling']
});

global.io = io;

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('join-ipo-updates', () => {
        socket.join('ipo-updates');
        console.log('📊 Client joined IPO updates room');
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// API Routes - Organized by Feature
app.use('/api', stockRoutes);           // Handles /api/compare
app.use('/api/ipo', ipoRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/trading', tradingRoutes); // Handles /api/trading/*
app.use('/api/market', marketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Health Check with warmup capabilities
app.get('/api/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Quick DB ping to ensure connection is ready
        const dbStatus = await checkDatabaseConnection();
        
        const responseTime = Date.now() - startTime;
        
        res.json({ 
            status: 'ok', 
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            database: dbStatus ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            features: [
                'stocks',
                'ipo', 
                'news',
                'learning',
                'trading',
                'market',
                'auth',
                'chat'
            ]
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Server starting up...',
            error: error.message
        });
    }
});

// Quick database connection check
async function checkDatabaseConnection() {
    try {
        const mongoose = await import('mongoose');
        return mongoose.default.connection.readyState === 1;
    } catch (error) {
        return false;
    }
}

// Root Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'SmartStock API - Organized by Features',
        version: '2.0',
        structure: 'Feature-based architecture',
        endpoints: {
            stocks: '/api/compare',
            ipo: '/api/ipo',
            news: '/api/news',
            learning: '/api/learning',
            trading: '/api/trading',
            market: '/api/market',
            auth: '/api/auth',
            chat: '/api/chat'
        }
    });
});

const PORT = process.env.PORT || 5050;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO enabled for real-time trading');
    
    // Start keep-alive service to prevent cold starts
    keepAliveService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    keepAliveService.stop();
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    keepAliveService.stop();
    httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;

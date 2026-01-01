import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Database connection
import connectDB from '../server/config/db.js';

// Routes
import chatRoutes from '../server/routes/chat.routes.js'
import compareRoutes from "../server/routes/compare.routes.js";
import newsRoutes from '../server/routes/newsRoutes.js';
import learningRoutes from '../server/routes/learningRoutes.js';
import marketRoutes from '../server/routes/marketRoutes.js';
import ipoRoutes from '../server/routes/ipoRoutes.js';
import virtualTradingRoutes from '../server/routes/trading/virtualTradingRoutes.js';
import { router as authRoutes } from '../server/routes/authRoutes.js';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "http://localhost:3001",
    "https://smartstock-frontend.vercel.app" // Add your Vercel frontend URL
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartStock API is running' });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ipo', ipoRoutes);
app.use('/api/trading', virtualTradingRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

export default app;
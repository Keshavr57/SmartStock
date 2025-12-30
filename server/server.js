import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from 'http';
import { Server } from 'socket.io';

// Database connection
import connectDB from './config/db.js';

// Routes
import chatRoutes from './routes/chat.routes.js'
import compareRoutes from "./routes/compare.routes.js";
import newsRoutes from './routes/newsRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import ipoRoutes from './routes/ipoRoutes.js';
import virtualTradingRoutes from './routes/trading/virtualTradingRoutes.js';
import { router as authRoutes } from './routes/authRoutes.js';

// Services
import NSEWebSocketService from './services/trading/nseWebSocket.service.js';
import YahooWebSocketService from './services/trading/yahooWebSocket.service.js';

dotenv.config();

const app = express();
const server = createServer(app);

// ================= MIDDLEWARE =================
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json());

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Initialize services with Socket.IO
const nseService = new NSEWebSocketService(io);
const yahooService = new YahooWebSocketService(io);

// Make services available to routes
app.set('nseService', nseService);
app.set('yahooService', yahooService);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Subscribe to real-time price updates
  socket.on('subscribe-price', (symbol) => {
    console.log(`📊 Subscribing ${socket.id} to ${symbol} price updates`);
    
    // Route to appropriate service based on symbol
    if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('NIFTY') || symbol.includes('BANKNIFTY')) {
      // Indian stocks - use NSE service
      nseService.subscribeToPrice(socket, symbol);
    } else {
      // Other stocks - use Yahoo service
      yahooService.subscribeToPrice(socket, symbol);
    }
  });

  // Unsubscribe from price updates
  socket.on('unsubscribe-price', (symbol) => {
    console.log(`📊 Unsubscribing ${socket.id} from ${symbol} price updates`);
    
    // Route to appropriate service
    if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('NIFTY') || symbol.includes('BANKNIFTY')) {
      nseService.unsubscribeFromPrice(socket, symbol);
    } else {
      yahooService.unsubscribeFromPrice(socket, symbol);
    }
  });

  // Join trading room for real-time chat
  socket.on('join-trading-room', (symbol) => {
    socket.join(`trading-${symbol}`);
    console.log(`💬 ${socket.id} joined trading room for ${symbol}`);
  });

  // Handle trading room messages
  socket.on('trading-message', (data) => {
    socket.to(`trading-${data.symbol}`).emit('trading-message', {
      id: Date.now(),
      message: data.message,
      timestamp: new Date(),
      userId: data.userId || 'Anonymous'
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    nseService.cleanup(socket);
    yahooService.cleanup(socket);
  });
});

// ================= ROUTES =================
app.use('/api/auth', authRoutes);
app.use("/api", compareRoutes);
app.use('/api/chat', chatRoutes)
app.use('/api/news', newsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ipo', ipoRoutes);
app.use('/api/virtual', virtualTradingRoutes);

// ================= SERVER START =================
const PORT = 5050; // Hardcoded to avoid shifts

const startServer = async () => {
  await connectDB();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO enabled for real-time trading`);
  });
};

startServer();

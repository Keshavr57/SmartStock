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
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://smart-stock-ku3d.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://accounts.google.com',
      'https://smartstock-lkcx.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  optionsSuccessStatus: 200
};

console.log('🌐 CORS Configuration:', {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  NODE_ENV: process.env.NODE_ENV
});

app.use(cors(corsOptions));

// Add security headers for Google OAuth
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json());

// ================= SOCKET.IO SETUP =================
const io = new Server(server, {
  cors: {
    origin: true, // Temporarily allow all origins
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize services with Socket.IO
const nseService = new NSEWebSocketService(io);
const yahooService = new YahooWebSocketService(io);

// Make services available to routes
app.set('nseService', nseService);
app.set('yahooService', yahooService);

// Make io available globally for IPO updates
global.io = io;

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

  // Subscribe to IPO updates
  socket.on('subscribe-ipo', () => {
    console.log(`📈 Subscribing ${socket.id} to IPO updates`);
    socket.join('ipo-updates');
  });

  // Unsubscribe from IPO updates
  socket.on('unsubscribe-ipo', () => {
    console.log(`📈 Unsubscribing ${socket.id} from IPO updates`);
    socket.leave('ipo-updates');
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
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      AI_SERVICE_URL: process.env.AI_SERVICE_URL
    }
  });
});

app.use('/api/auth', authRoutes);
app.use("/api", compareRoutes);
app.use('/api/chat', chatRoutes)
app.use('/api/news', newsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ipo', ipoRoutes);
app.use('/api/virtual', virtualTradingRoutes);

// ================= SERVER START =================
const PORT = process.env.PORT || 5050;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO enabled for real-time trading`);
  });
};

startServer();

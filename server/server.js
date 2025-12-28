import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Routes
import chatRoutes from './routes/chat.routes.js'
import compareRoutes from "./routes/compare.routes.js";
import newsRoutes from './routes/newsRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import ipoRoutes from './routes/ipoRoutes.js';

dotenv.config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api", compareRoutes);
app.use('/api/chat', chatRoutes)
app.use('/api/news', newsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ipo', ipoRoutes);

// ================= DB CONNECT =================
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB Connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

// ================= SERVER START =================
const PORT = 5050; // Hardcoded to avoid shifts

const startServer = async () => {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

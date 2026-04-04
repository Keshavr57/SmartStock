import mongoose from "mongoose";

let isConnecting = false;
let connectionPromise = null;

const connectDB = async () => {
  try {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting && connectionPromise) {
      return connectionPromise;
    }

    // If already connected, return immediately
    if (mongoose.connection.readyState === 1) {
      return Promise.resolve();
    }

    isConnecting = true;

    // Optimized connection options for better performance
    const options = {
      dbName: "SmartStock",
      serverSelectionTimeoutMS: 5000,  // Reduced from 10000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,         // Added connection timeout
      maxPoolSize: 10,
      minPoolSize: 2,                  // Reduced from 5
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      // Additional performance optimizations
      heartbeatFrequencyMS: 10000      // Check connection every 10s
    };

    connectionPromise = mongoose.connect(process.env.MONGO_URI, options);
    await connectionPromise;
    
    console.log("✅ DB Connected successfully");
    isConnecting = false;
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnecting = false;
      connectionPromise = null;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnecting = false;
      connectionPromise = null;
      
      // Attempt immediate reconnection
      setTimeout(() => {
        console.log("Attempting to reconnect to database...");
        connectDB();
      }, 5000); // Reduced from 30 seconds
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnecting = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    isConnecting = false;
    connectionPromise = null;
    
    // Set up retry mechanism with exponential backoff
    const retryDelay = Math.min(30000, 5000 * Math.pow(2, (err.retryCount || 0)));
    setTimeout(() => {
      console.log(`🔄 Retrying database connection in ${retryDelay/1000}s...`);
      connectDB();
    }, retryDelay);
  }
};

// Fast connection check function
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Ensure connection function for auth routes
export const ensureConnection = async () => {
  if (isDBConnected()) {
    return true;
  }
  
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error('Failed to ensure database connection:', error);
    return false;
  }
};

export default connectDB;

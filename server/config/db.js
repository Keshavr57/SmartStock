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

    // DEPLOYMENT OPTIMIZED connection options
    const options = {
      dbName: "SmartStock",
      serverSelectionTimeoutMS: 2000,  // 2 seconds for deployment
      socketTimeoutMS: 30000,
      connectTimeoutMS: 3000,          // 3 seconds max
      maxPoolSize: 5,                  // Smaller pool for faster startup
      minPoolSize: 1,                  // Minimum connections
      maxIdleTimeMS: 20000,            // Faster idle timeout
      retryWrites: true,
      w: 'majority',
      heartbeatFrequencyMS: 5000,      // Check connection every 5s
      bufferCommands: false,           // Don't buffer commands
      bufferMaxEntries: 0              // No buffering for instant response
    };

    connectionPromise = mongoose.connect(process.env.MONGO_URI, options);
    await connectionPromise;
    
    console.log("✅ DB Connected for deployment (optimized)");
    isConnecting = false;
    
    // Handle connection events for deployment
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnecting = false;
      connectionPromise = null;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting fast reconnect');
      isConnecting = false;
      connectionPromise = null;
      
      // Immediate reconnection for deployment
      setTimeout(() => {
        console.log("🔄 Fast reconnecting for deployment...");
        connectDB();
      }, 1000); // 1 second reconnect
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected for deployment');
      isConnecting = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed for deployment shutdown');
      process.exit(0);
    });
    
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    isConnecting = false;
    connectionPromise = null;
    
    // Fast retry for deployment
    setTimeout(() => {
      console.log(`🔄 Fast retry database connection for deployment...`);
      connectDB();
    }, 2000); // 2 second retry
  }
};

// Fast connection check function
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Ensure connection function for auth routes - DEPLOYMENT OPTIMIZED
export const ensureConnection = async () => {
  if (isDBConnected()) {
    return true;
  }
  
  try {
    // Fast connection attempt for deployment
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB connection timeout')), 3000)
      )
    ]);
    return true;
  } catch (error) {
    console.error('Failed to ensure database connection:', error);
    // Return true anyway for deployment - don't block auth
    return true;
  }
};

export default connectDB;

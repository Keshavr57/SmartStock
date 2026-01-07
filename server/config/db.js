import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Simplified connection options (only supported ones)
    const options = {
      dbName: "SmartStock",
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ DB Connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    console.log("⚠️ Server will continue without database connection");
    
    // Set up retry mechanism
    setTimeout(() => {
      console.log("🔄 Attempting to reconnect to database...");
      connectDB();
    }, 30000); // Retry after 30 seconds
  }
};

export default connectDB;

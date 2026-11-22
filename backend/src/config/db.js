import mongoose from 'mongoose';
import dns from 'dns';

// Configure public DNS resolvers to prevent Windows SRV query ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[DNS Warning] Could not set custom DNS servers:', e.message);
}

let isMongoConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinecraft_media';

  // Enable buffering so queries wait safely instead of throwing bufferCommands error
  mongoose.set('bufferCommands', true);

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      autoIndex: true,
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[Database Warning] MongoDB connection failed: ${error.message}. Running in memory-safe failover mode.`);
    return null;
  }
};

mongoose.connection.on('connected', () => {
  isMongoConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
});

mongoose.connection.on('error', () => {
  isMongoConnected = false;
});

export const getIsMongoConnected = () => isMongoConnected && mongoose.connection.readyState === 1;

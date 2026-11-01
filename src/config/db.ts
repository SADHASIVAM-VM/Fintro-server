import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';


configDotenv({path: path.join(__dirname,'./src','.env')})

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || "";
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error event:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected event. Attempting to reconnect...');
    });

    await mongoose.connect(connStr);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

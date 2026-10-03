import mongoose from 'mongoose';

export const connectMongoDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('[MongoDB] MONGODB_URI is not defined');
  }

  await mongoose.connect(uri);

  console.log('[MongoDB] Connected to MongoDB');
};
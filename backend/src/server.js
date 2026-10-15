import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import influencerRoutes from './routes/influencer.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (fallback/local uploads)
const uploadsPath = path.join(__dirname, '../data/uploads');
app.use('/uploads', express.static(uploadsPath));

// MongoDB Connectivity
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('🍃 MongoDB connected successfully to Atlas!');
      try {
        const { Influencer } = await import('./models/Influencer.js');
        const { User } = await import('./models/User.js');
        const { Admin } = await import('./models/Admin.js');
        const { db } = await import('./db.js');
        const localData = db.read();

        const infCount = await Influencer.countDocuments();
        if (infCount === 0 && localData.influencers?.length > 0) {
          console.log('🌱 Seeding MongoDB collections from initial dataset...');
          await Influencer.insertMany(localData.influencers.map(({ id, ...i }) => i));
          await User.insertMany(localData.users.map(({ id, ...u }) => u));
          await Admin.insertMany(localData.admins.map(({ id, ...a }) => a));
          console.log('✅ MongoDB seeded with initial Admin, Influencers, and Users!');
        }
      } catch (seedErr) {
        console.log('ℹ️  MongoDB collection sync note:', seedErr.message);
      }
    })
    .catch(err => {
      console.warn('⚠️  MongoDB connection error (operating in file-backed persistent mode):', err.message);
    });
} else {
  console.log('ℹ️  No MONGODB_URI provided, running with high-performance persistent JSON storage.');
}

// Log Vercel Blob token status
if (process.env.BLOB_READ_WRITE_TOKEN) {
  console.log('☁️  Vercel Blob Storage token detected. Cloud asset storage active.');
} else {
  console.log('📁 Vercel Blob token not set. Using local file storage for uploads.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'MeetFame API',
    version: '1.0.0',
    time: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
    vercelBlobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  });
});

// Vercel Blob Connectivity Status Check
app.get('/api/blob/status', async (req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.json({
      connected: false,
      tokenConfigured: false,
      message: 'BLOB_READ_WRITE_TOKEN is not yet set in backend/.env. Follow instructions to paste it.'
    });
  }

  try {
    const { list } = await import('@vercel/blob');
    const blobList = await list({ token });
    return res.json({
      connected: true,
      tokenConfigured: true,
      totalBlobs: blobList.blobs.length,
      blobs: blobList.blobs.map(b => ({
        pathname: b.pathname,
        url: b.url,
        size: b.size,
        uploadedAt: b.uploadedAt
      }))
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      tokenConfigured: true,
      error: err.message
    });
  }
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MeetFame Backend API',
    endpoints: {
      auth: '/api/auth',
      influencers: '/api/influencers',
      bookings: '/api/bookings',
      admin: '/api/admin',
      chat: '/api/chat'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 MeetFame Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;

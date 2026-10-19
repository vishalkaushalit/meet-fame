import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createDatabaseMiddleware } from './databaseContext.js';
import { mongoStore } from './mongoStore.js';
import { mongoConnection } from './mongoConnection.js';
import { createHealthHandler } from './health.js';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import influencerRoutes from './routes/influencer.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import callRoutes from './routes/call.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (fallback/local uploads)
const uploadsPath = path.join(__dirname, '../data/uploads');
app.use('/uploads', express.static(uploadsPath));

// MongoDB Connectivity
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoConnection
    .connect()
    .then(() => {
      console.log('MongoDB connected. Persistent API storage is active.');
    })
    .catch(() => {
      console.warn(
        'MongoDB connection unavailable:',
        mongoConnection.status().issue,
      );
    });
} else {
  console.log(
    'ℹ️  No MONGODB_URI provided, running with high-performance persistent JSON storage.',
  );
}

// Log Vercel Blob token status
if (process.env.BLOB_READ_WRITE_TOKEN) {
  console.log(
    '☁️  Vercel Blob Storage token detected. Cloud asset storage active.',
  );
} else {
  console.log(
    '📁 Vercel Blob token not set. Using local file storage for uploads.',
  );
}

// Use durable storage for all API snapshots when configured. Never silently
// acknowledge writes to an ephemeral Vercel filesystem.
const persistentDatabase = createDatabaseMiddleware(mongoStore);
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (process.env.MONGODB_URI) return persistentDatabase(req, res, next);
  if (process.env.VERCEL)
    return res.status(503).json({
      error:
        'Booking service is temporarily unavailable. Please try again later.',
    });
  return next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);

// Health check endpoint
app.get('/api/health', createHealthHandler(mongoConnection));

// Vercel Blob Connectivity Status Check
app.get('/api/blob/status', async (req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.json({
      connected: false,
      tokenConfigured: false,
      message:
        'BLOB_READ_WRITE_TOKEN is not yet set in backend/.env. Follow instructions to paste it.',
    });
  }

  try {
    const { list } = await import('@vercel/blob');
    const blobList = await list({ token });
    return res.json({
      connected: true,
      tokenConfigured: true,
      totalBlobs: blobList.blobs.length,
      blobs: blobList.blobs.map((b) => ({
        pathname: b.pathname,
        url: b.url,
        size: b.size,
        uploadedAt: b.uploadedAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      tokenConfigured: true,
      error: err.message,
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
      chat: '/api/chat',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `🚀 MeetFame Backend Server running on http://localhost:${PORT}`,
    );
  });
}

export default app;

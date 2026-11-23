import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { configurePassport } from './config/passport.js';
import { initSocketServer } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable reverse proxy trust (required for Render / cloud load balancers & OAuth HTTPS redirects)
app.set('trust proxy', 1);

// Connect to Database & Services
await connectDB();
initRedis();
configurePassport();

// Security & Parsing Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Frontend Admin & Public requests
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://cinecraftmedia.com',
  'https://www.cinecraftmedia.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);

// Rate limiter for public endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/v1/', apiLimiter);

// Static uploads directory for media files & generated invoice PDFs
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CineCraft Media API Engine',
  });
});

// Mount Feature API Routers
app.use('/api/auth', authRoutes);
app.use('/api', cmsRoutes);
app.use('/api', leadRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', analyticsRoutes);
app.use('/api/admin', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const server = http.createServer(app);
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`[CineCraft Media Server] Running on http://localhost:${PORT}`);
  console.log(`[Client Admin UI] Configured for ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin`);
});

export { app, server };
export default app;

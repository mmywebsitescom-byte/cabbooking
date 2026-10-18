import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { config } from './config/config.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import carRoutes from './routes/carRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect DB
connectDB();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.frontendUrl);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`[API] ${req.method} ${req.url} ${color}${res.statusCode}\x1b[0m (${Date.now() - start}ms)`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', adminRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'DriveEase Backend API',
    version: '1.0.0',
    nodeVersion: process.version,
    uptime: `${Math.floor(process.uptime())}s`,
    demoMode: config.demoMode,
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚗 DriveEase Backend API running!`);
  console.log(`📡 URL       : http://localhost:${config.port}`);
  console.log(`🔌 Health    : http://localhost:${config.port}/api/health`);
  console.log(`🗄️  MongoDB   : ${config.mongoUri}`);
  console.log(`🧪 Demo Mode : ${config.demoMode}`);
  console.log(`========================================\n`);
});

export default app;

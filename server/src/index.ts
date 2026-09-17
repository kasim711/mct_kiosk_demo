import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initSocketIO } from './services/socketService';
import authRoutes from './routes/authRoutes';
import kioskRoutes from './routes/kioskRoutes';
import staffRoutes from './routes/staffRoutes';
import kitchenRoutes from './routes/kitchenRoutes';
import adminRoutes from './routes/adminRoutes';
import printRoutes from './routes/printRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with cross-origin support for multi-kiosk LAN operation
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

initSocketIO(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/print', printRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Muscat Touchscreen Restaurant POS & Kiosk Backend',
    location: 'Muscat, Sultanate of Oman',
    time: new Date().toISOString(),
  });
});

// Serve frontend build if exists
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) return next();
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Muscat Restaurant POS & Kiosk Backend Running     `);
  console.log(`  Local URL:    http://localhost:${PORT}             `);
  console.log(`  Socket.IO:    Ready for Kiosks, Staff, Kitchen    `);
  console.log(`====================================================`);
});

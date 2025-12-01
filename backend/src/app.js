import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import botRoutes from './routes/bot.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import packageRoutes from './routes/package.routes.js';
import depositRoutes from './routes/deposit.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import referralRoutes from './routes/referral.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/bot', botRoutes);
app.use('/admin', adminRoutes);

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/referral', referralRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;


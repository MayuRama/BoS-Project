import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { initSocket } from './socket/socket';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './modules/auth/auth.router';
import dealersRouter from './modules/dealers/dealers.router';
import omoRouter from './modules/omo/omo.router';
import transactionsRouter from './modules/transactions/transactions.router';
import amlRouter from './modules/aml/aml.router';
import ratesRouter from './modules/rates/rates.router';
import auditRouter from './modules/audit/audit.router';
import notificationsRouter from './modules/notifications/notifications.router';
import settingsRouter from './modules/settings/settings.router';
import ussdRouter from './modules/ussd/ussd.router';

const app = express();
const server = http.createServer(app);

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/dealers', dealersRouter);
app.use('/api/omo-sessions', omoRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/aml-alerts', amlRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/ussd', ussdRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
initSocket(server);

// ─── START ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 BoS FX Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});

export default app;

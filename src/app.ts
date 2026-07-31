import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/userRoutes';
import walletRoutes from './routes/walletRoutes';
import vtuRoutes from './routes/vtuRoutes';
import webhookRoutes from './routes/webhookRoutes';
import adminRoutes from './routes/adminRoutes';
import adminViewRoute from './routes/adminViewRoute';
import { BaseWalletError } from './errors/walletErrors';

const app: Express = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    service: 'Nigerian VTU & Data Platform Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Admin Interactive Web UI Dashboard
app.use(adminViewRoute);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Admin Management REST APIs
app.use('/api/admin', adminRoutes);

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Middleware]:', err);

  if (err instanceof BaseWalletError) {
    return res.status(err.statusCode).json({
      success: false,
      error_code: err.errorCode,
      message: err.message,
      details: err.details,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;

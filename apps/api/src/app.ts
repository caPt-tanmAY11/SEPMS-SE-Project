import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import portfoliosRoutes from './modules/portfolios/portfolios.routes';
import { initDbPool, isUsingMockDb } from './database/db';

export function createApp(): Application {
  const app = express();

  // Initialize DB pool
  initDbPool();

  // Security and utilities
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true
  }));
  app.use(express.json());

  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/api/v1/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SEPMS Backend API',
      version: '1.0.0',
      databaseMode: isUsingMockDb() ? 'offline-mock' : 'postgresql-live',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/portfolios', portfoliosRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
        code: 'NOT_FOUND'
      }
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

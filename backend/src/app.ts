import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import logger, { requestLogger } from './utils/logger';
import { validateHeaders } from './utils/validation';
import { requestHeadersSchema } from './constants/validation';

dotenv.config();

const app = express();

// Middlewares
const allowedOrigins: string[] = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(requestLogger);
app.use(validateHeaders(requestHeadersSchema));


// Root welcome endpoint

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Consulting & Procurement Intelligence Platform - Node.js Backend API',
    status: 'online',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// API Routes
app.use('/api', apiRouter);

// Test routes for coverage of error handling middleware
/* v8 ignore start */
if (process.env.NODE_ENV === 'test') {
  app.get('/test-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error('Test unhandled error'));
  });
  app.get('/test-error-custom', (_req: Request, _res: Response, next: NextFunction) => {
    next({ status: 403 });
  });
}
/* v8 ignore stop */

// 404 Catch-all
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled server error', { path: req.originalUrl, method: req.method }, err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});


export default app;


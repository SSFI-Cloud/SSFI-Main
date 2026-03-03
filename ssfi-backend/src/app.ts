import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

// Hardcoded fallbacks for critical env vars - Hostinger doesn't inject at runtime
if (!process.env.PRISMA_QUERY_ENGINE_TYPE) process.env.PRISMA_QUERY_ENGINE_TYPE = 'library';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'c8322b41b9e638adfa1dc68246d32421aa4c3d6de8b99bc56654584e';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = '08e9486f57655d259fe9dcfb76cfbcabb246bcaed257bc90b3cd42df';
if (!process.env.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = 'c9078dd529e9bc32405e2a8b1146eca4';
if (!process.env.JWT_EXPIRE) process.env.JWT_EXPIRE = '24h';
if (!process.env.JWT_REFRESH_EXPIRE) process.env.JWT_REFRESH_EXPIRE = '7d';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
if (!process.env.API_VERSION) process.env.API_VERSION = 'v1';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'https://ssfiskate.com';
if (!process.env.APP_URL) process.env.APP_URL = 'https://api.ssfiskate.com';
if (!process.env.ALLOWED_ORIGINS) process.env.ALLOWED_ORIGINS = 'https://ssfiskate.com,https://www.ssfiskate.com';
if (!process.env.SMTP_HOST) process.env.SMTP_HOST = 'smtp.gmail.com';
if (!process.env.SMTP_PORT) process.env.SMTP_PORT = '587';
if (!process.env.SMTP_SECURE) process.env.SMTP_SECURE = 'false';
if (!process.env.SMTP_USER) process.env.SMTP_USER = 'info@ssfiskate.com';
if (!process.env.SMTP_PASS) process.env.SMTP_PASS = 'zaip bsym yzdx zmrk';
if (!process.env.SMTP_FROM_NAME) process.env.SMTP_FROM_NAME = 'SSFI - Skating Sports Federation of India';
if (!process.env.EMAIL_FROM) process.env.EMAIL_FROM = 'info@ssfiskate.com';
if (!process.env.PORT) process.env.PORT = '3000';
if (!process.env.MAX_FILE_SIZE) process.env.MAX_FILE_SIZE = '5242880';
if (!process.env.UPLOAD_PATH) process.env.UPLOAD_PATH = './uploads';
if (!process.env.ALLOWED_IMAGE_TYPES) process.env.ALLOWED_IMAGE_TYPES = 'image/jpeg,image/png,image/jpg,image/webp';
if (!process.env.ALLOWED_DOC_TYPES) process.env.ALLOWED_DOC_TYPES = 'application/pdf,image/jpeg,image/png';
if (!process.env.WEBP_QUALITY) process.env.WEBP_QUALITY = '80';
if (!process.env.IMAGE_MAX_WIDTH) process.env.IMAGE_MAX_WIDTH = '1920';
if (!process.env.THUMBNAIL_SIZE) process.env.THUMBNAIL_SIZE = '300';
if (!process.env.SIGNATURE_SIZE) process.env.SIGNATURE_SIZE = '400';
if (!process.env.RAZORPAY_KEY_ID) process.env.RAZORPAY_KEY_ID = '';
if (!process.env.RAZORPAY_KEY_SECRET) process.env.RAZORPAY_KEY_SECRET = '';
if (!process.env.RAZORPAY_WEBHOOK_SECRET) process.env.RAZORPAY_WEBHOOK_SECRET = 'your_webhook_secret';
if (!process.env.USE_MOCK_PAYMENT) process.env.USE_MOCK_PAYMENT = 'true';
if (!process.env.ENCRYPTION_ALGORITHM) process.env.ENCRYPTION_ALGORITHM = 'aes-256-cbc';
if (!process.env.SEASON_CUTOFF_DATE) process.env.SEASON_CUTOFF_DATE = '2025-01-01';
if (!process.env.RATE_LIMIT_WINDOW_MS) process.env.RATE_LIMIT_WINDOW_MS = '900000';
if (!process.env.RATE_LIMIT_MAX_REQUESTS) process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
if (!process.env.LOG_LEVEL) process.env.LOG_LEVEL = 'info';
if (!process.env.LOG_FILE_PATH) process.env.LOG_FILE_PATH = './logs';
if (!process.env.CERTIFICATE_TEMPLATE_PATH) process.env.CERTIFICATE_TEMPLATE_PATH = './templates/certificate.pdf';
if (!process.env.CERTIFICATE_OUTPUT_PATH) process.env.CERTIFICATE_OUTPUT_PATH = './uploads/certificates';

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes';
// import adminRoutes from './routes/admin.routes';
import registrationWindowRoutes from './routes/registration-window.routes';
import stateSecretaryRoutes from './routes/state-secretary.routes';
import districtSecretaryRoutes from './routes/district-secretary.routes';
import paymentRoutes from './routes/payment.routes';
import reportRoutes from './routes/report.routes';
import stateRoutes from './routes/state.routes';
import districtRoutes from './routes/district.routes';
import clubRoutes from './routes/club.routes';
import studentRoutes from './routes/student.routes';
import eventRoutes from './routes/event.routes';
import affiliationRoutes from './routes/affiliation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cmsRoutes from './routes/cms.routes';
import contactRoutes from './routes/contact.routes';
import newsRoutes from './routes/news.routes';
import settingsRoutes from './routes/settings.routes';
import locationsRoutes from './routes/locations.routes';
import { statsRoutes } from './routes/stats.routes';
import renewalRoutes from './routes/renewal.routes';
import eventRegistrationRoutes from './routes/eventRegistration.routes';
import resultRoutes from './routes/result.routes';
import certificateRoutes from './routes/certificate.routes';
import coachCertRoutes from './routes/coach-cert.routes';
import beginnerCertRoutes from './routes/beginner-cert.routes';
import teamRoutes from './routes/team.routes';
import milestoneRoutes from './routes/milestone.routes';
import uploadRoutes from './routes/upload.routes';

// Import middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Import utils
import logger from './utils/logger.util';

// Import prisma AFTER dotenv is loaded
import prisma from './config/prisma';

const app: Application = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const DEFAULT_ALLOWED_ORIGINS = [
  'https://ssfiskate.com',
  'https://www.ssfiskate.com',
  'http://localhost:3000',
  'http://localhost:5173'
];
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o: string) => o.trim()) || [];
    const allowedOrigins = envOrigins.length > 0 ? envOrigins : DEFAULT_ALLOWED_ORIGINS;
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/verify-otp', authLimiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression Middleware
app.use(compression());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// DB Health Check
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      errorType: error?.constructor?.name || 'UnknownError',
      errorMessage: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/state-secretaries`, stateSecretaryRoutes);
app.use(`/api/${API_VERSION}/district-secretaries`, districtSecretaryRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/states`, stateRoutes);
app.use(`/api/${API_VERSION}/districts`, districtRoutes);
app.use(`/api/${API_VERSION}/clubs`, clubRoutes);
app.use(`/api/${API_VERSION}/students`, studentRoutes);
app.use(`/api/${API_VERSION}/events`, eventRoutes);
app.use(`/api/${API_VERSION}/event-registration`, eventRegistrationRoutes);
app.use(`/api/${API_VERSION}/affiliations`, affiliationRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/registration-windows`, registrationWindowRoutes);
app.use(`/api/${API_VERSION}/cms`, cmsRoutes);
app.use(`/api/${API_VERSION}/contact`, contactRoutes);
app.use(`/api/${API_VERSION}/news`, newsRoutes);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes);
app.use(`/api/${API_VERSION}/locations`, locationsRoutes);
app.use(`/api/${API_VERSION}/stats`, statsRoutes);
app.use(`/api/${API_VERSION}/results`, resultRoutes);
app.use(`/api/${API_VERSION}/certificates`, certificateRoutes);
app.use(`/api/${API_VERSION}/renewal`, renewalRoutes);
app.use(`/api/${API_VERSION}/coach-cert`, coachCertRoutes);
app.use(`/api/${API_VERSION}/beginner-cert`, beginnerCertRoutes);
app.use(`/api/${API_VERSION}/team-members`, teamRoutes);
app.use(`/api/${API_VERSION}/milestones`, milestoneRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SSFI API Server',
    version: API_VERSION,
    documentation: `${process.env.APP_URL || process.env.FRONTEND_URL || 'https://api.ssfiskate.com'}/api-docs`,
    status: 'Running'
  });
});

// 404 Handler
app.use(notFound);

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 SSFI Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 API Version: ${API_VERSION}`);
    logger.info(`🔗 DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
// LEGACY: import galleryRoutes from './routes/gallery.routes'; // Replaced by CMS gallery routes
import newsRoutes from './routes/news.routes';
import settingsRoutes from './routes/settings.routes';
import locationsRoutes from './routes/locations.routes';
import { statsRoutes } from './routes/stats.routes';
import renewalRoutes from './routes/renewal.routes';
// import paymentRoutes from './routes/payment.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/error.middleware';

// Import utils
import logger from './utils/logger.util';

const app: Application = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
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

// Stricter rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
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

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
// app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/state-secretaries`, stateSecretaryRoutes);
app.use(`/api/${API_VERSION}/district-secretaries`, districtSecretaryRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/states`, stateRoutes);
app.use(`/api/${API_VERSION}/districts`, districtRoutes);
app.use(`/api/${API_VERSION}/clubs`, clubRoutes);
app.use(`/api/${API_VERSION}/students`, studentRoutes);
app.use(`/api/${API_VERSION}/events`, eventRoutes);
import eventRegistrationRoutes from './routes/eventRegistration.routes';
app.use(`/api/${API_VERSION}/event-registration`, eventRegistrationRoutes);
app.use(`/api/${API_VERSION}/affiliations`, affiliationRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/registration-windows`, registrationWindowRoutes);
app.use(`/api/${API_VERSION}/cms`, cmsRoutes);
app.use(`/api/${API_VERSION}/contact`, contactRoutes);
// LEGACY: app.use(`/api/${API_VERSION}/gallery`, galleryRoutes); // Use /api/v1/cms/gallery instead
app.use(`/api/${API_VERSION}/news`, newsRoutes);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes);
app.use(`/api/${API_VERSION}/locations`, locationsRoutes);
app.use(`/api/${API_VERSION}/stats`, statsRoutes);
import resultRoutes from './routes/result.routes';
app.use(`/api/${API_VERSION}/results`, resultRoutes);
import certificateRoutes from './routes/certificate.routes';
app.use(`/api/${API_VERSION}/certificates`, certificateRoutes);
app.use(`/api/${API_VERSION}/renewal`, renewalRoutes);
import coachCertRoutes from './routes/coach-cert.routes';
app.use(`/api/${API_VERSION}/coach-cert`, coachCertRoutes);
// app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
import beginnerCertRoutes from './routes/beginner-cert.routes';
import teamRoutes from './routes/team.routes';
import milestoneRoutes from './routes/milestone.routes';
import uploadRoutes from './routes/upload.routes';
app.use(`/api/${API_VERSION}/beginner-cert`, beginnerCertRoutes);
app.use(`/api/${API_VERSION}/team-members`, teamRoutes);
app.use(`/api/${API_VERSION}/milestones`, milestoneRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SSFI API Server',
    version: API_VERSION,
    documentation: `${process.env.APP_URL}/api-docs`,
    status: 'Running'
  });
});

// 404 Handler
app.use(notFound);

// Error Handler (Must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 SSFI Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 API Version: ${API_VERSION}`);
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

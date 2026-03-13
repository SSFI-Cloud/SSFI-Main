import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util';

/**
 * Log requests that exceed a configurable duration threshold.
 */
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const SLOW_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_MS || '3000', 10);

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > SLOW_THRESHOLD_MS) {
      logger.warn(
        `Slow request: ${req.method} ${req.originalUrl} took ${duration}ms (threshold: ${SLOW_THRESHOLD_MS}ms)`
      );
    }
  });

  next();
};

/**
 * Abort requests that exceed a configurable timeout.
 */
export const requestTimeout = (req: Request, res: Response, next: NextFunction) => {
  const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);

  req.setTimeout(TIMEOUT_MS, () => {
    if (!res.headersSent) {
      logger.error(
        `Request timeout: ${req.method} ${req.originalUrl} exceeded ${TIMEOUT_MS}ms`
      );
      res.status(408).json({ success: false, message: 'Request timeout' });
    }
  });

  next();
};

/**
 * Set Cache-Control headers for GET requests.
 */
export const httpCacheHeaders = (maxAgeSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader(
        'Cache-Control',
        `public, max-age=${maxAgeSeconds}, s-maxage=0`
      );
    }
    next();
  };
};

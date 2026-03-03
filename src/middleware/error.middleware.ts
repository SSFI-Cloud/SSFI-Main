import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import logger from '../utils/logger.util';
import { AppError } from '../utils/errors';

/**
 * Handle 404 - Not Found
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global Error Handler
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = null;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // AppError (Custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Prisma Known Request Errors
  else if (err instanceof PrismaClientKnownRequestError) {
    statusCode = 400;
    const prismaErr = err as PrismaClientKnownRequestError;

    switch (prismaErr.code) {
      case 'P2002': {
        const target = prismaErr.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : (target as string) || 'field';
        message = `Duplicate entry: ${field} already exists`;
        break;
      }
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Related record not found';
        break;
      case 'P2014':
        message = 'Required relation is missing';
        break;
      default:
        message = 'Database operation failed';
    }
  }

  // Prisma Initialization Error (e.g. DATABASE_URL missing or DB unreachable)
  else if (err instanceof PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed. Please try again later.';
  }

  // Prisma Unknown Request Error
  else if (err instanceof PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = 'An unknown database error occurred';
  }

  // Prisma Rust Panic Error
  else if (err instanceof PrismaClientRustPanicError) {
    statusCode = 500;
    message = 'A critical database error occurred';
  }

  // Prisma Validation Error
  else if (err instanceof PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer Errors (File Upload)
  else if (err.name === 'MulterError') {
    statusCode = 400;
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload error';
    }
  }

  // Build error response
  const response: any = {
    success: false,
    message,
    ...(errors && { errors })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async Handler Wrapper
 * Catches errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  AppError,
  notFound,
  errorHandler,
  asyncHandler
};

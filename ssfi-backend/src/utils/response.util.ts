import { Response } from 'express';

/**
 * Standard success response format
 */
export const sendSuccess = (
  res: Response,
  statusCode: number = 200,
  message: string = 'Success',
  data: any = null
): Response => {
  const response: any = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response format
 */
export const sendPaginatedResponse = (
  res: Response,
  statusCode: number = 200,
  message: string = 'Success',
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

/**
 * Error response format
 */
export const sendError = (
  res: Response,
  statusCode: number = 500,
  message: string = 'Internal Server Error',
  errors: any = null
): Response => {
  const response: any = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export default {
  sendSuccess,
  sendPaginatedResponse,
  sendError
};

// Alias for backward compatibility
export const successResponse = (
  res: Response,
  options: { statusCode?: number; message?: string; data?: any }
): Response => {
  return sendSuccess(res, options.statusCode, options.message, options.data);
};

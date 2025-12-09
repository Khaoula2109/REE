import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (config.server.env === 'development') {
    return res.status(statusCode).json({
      error: message,
      stack: err.stack,
      details: err.details || null
    });
  }

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'An error occurred' : message
  });
};

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../types/APITypes';

/**
 * Error Handler Middleware
 * 
 * Centralized error handling for API endpoints.
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('API Error:', error);

  // Default error response
  const response: APIResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).context?.requestId || 'unknown',
      version: '1.0.0'
    }
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    response.error = {
      code: 'VALIDATION_ERROR',
      message: error.message
    };
    res.status(400).json(response);
    return;
  }

  if (error.name === 'UnauthorizedError') {
    response.error = {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    };
    res.status(401).json(response);
    return;
  }

  // Default 500 error
  res.status(500).json(response);
} 
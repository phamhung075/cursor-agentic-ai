import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 * 
 * Logs incoming API requests for monitoring and debugging.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = (req as any).context?.requestId || 'unknown';
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Request ID: ${requestId}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - Request ID: ${requestId}`);
  });
  
  next();
} 
import { Request, Response, NextFunction } from 'express';
import { log } from '../../utils';

/**
 * Request Logger Middleware
 * Logs incoming API requests for monitoring and debugging using the Logger utility.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = (req as any).context?.requestId || 'unknown';
  const method = req.method;
  const url = req.originalUrl;
  const body = req.body;
  
  log.info('API', `➡️ ${method} ${url} - Request ID: ${requestId}`, { body });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    log.api(method, url, res.statusCode, duration, { requestId, body });
  });
  
  next();
} 
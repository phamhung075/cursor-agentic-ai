import { Logger } from '../types/LogTypes';

/**
 * Simple console logger implementation
 */
export const consoleLogger: Logger = {
  debug: (context: string, message: string, meta?: any) => {
    console.debug(`[${context}] ${message}`, meta || '');
  },
  
  info: (context: string, message: string, meta?: any) => {
    console.info(`[${context}] ${message}`, meta || '');
  },
  
  warn: (context: string, message: string, meta?: any) => {
    console.warn(`[${context}] ${message}`, meta || '');
  },
  
  error: (context: string, message: string, meta?: any) => {
    console.error(`[${context}] ${message}`, meta || '');
  }
}; 
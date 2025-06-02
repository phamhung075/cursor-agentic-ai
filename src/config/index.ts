/**
 * Application configuration
 */

/**
 * Configuration interface
 */
export interface AppConfig {
  /** The name of the application */
  appName: string;
  /** The environment the application is running in */
  environment: 'development' | 'production' | 'test';
  /** The port the application should listen on */
  port: number;
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  appName: 'TypeScript Modern Project',
  environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  port: parseInt(process.env.PORT || '3000', 10),
}; 
/**
 * Logger Utility
 *
 * Provides standardized logging functionality for the application.
 */

// Simple logger implementation that can be replaced with a more robust solution like winston later
export const logger = {
  /**
   * Log an info message
   * @param message The message to log
   * @param optionalParams Optional parameters
   */
  info: (message: string, ...optionalParams: any[]) => {
    console.info(`[INFO] ${message}`, ...optionalParams);
  },

  /**
   * Log a warning message
   * @param message The message to log
   * @param optionalParams Optional parameters
   */
  warn: (message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  },

  /**
   * Log an error message
   * @param message The message to log
   * @param optionalParams Optional parameters
   */
  error: (message: string, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  },

  /**
   * Log a debug message
   * @param message The message to log
   * @param optionalParams Optional parameters
   */
  debug: (message: string, ...optionalParams: any[]) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }
};
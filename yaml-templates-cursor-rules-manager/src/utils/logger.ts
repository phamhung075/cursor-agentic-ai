import chalk from 'chalk';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success' | 'none';

/**
 * Simple logger utility
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    console.debug(`[DEBUG] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};

/**
 * Simple logger utility
 */
class Logger {
  private level: LogLevel = 'info';

  /**
   * Set the log level
   * @param level - Log level to set
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   * @returns The current log level
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Log an informational message
   * @param message - Message to log
   */
  public info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue('ℹ️  INFO: ') + message);
    }
  }

  /**
   * Log a success message
   * @param message - Message to log
   */
  public success(message: string): void {
    if (this.shouldLog('success')) {
      console.log(chalk.green('✅ SUCCESS: ') + message);
    }
  }

  /**
   * Log a warning message
   * @param message - Message to log
   */
  public warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow('⚠️  WARNING: ') + message);
    }
  }

  /**
   * Log an error message
   * @param message - Message to log
   * @param error - Optional Error object
   */
  public error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red('❌ ERROR: ') + message);
      if (error) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }

  /**
   * Log a debug message
   * @param message - Message to log
   * @param data - Optional data to log
   */
  public debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray('🔍 DEBUG: ') + message);
      if (data !== undefined) {
        console.debug(data);
      }
    }
  }

  /**
   * Check if the current log level should show logs of the specified level
   * @param level - Log level to check
   * @returns True if logs of the specified level should be shown
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.level === 'none') return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'success', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(level);
    
    return targetIndex >= currentIndex && targetIndex !== -1;
  }
}

export const loggerInstance = new Logger(); 
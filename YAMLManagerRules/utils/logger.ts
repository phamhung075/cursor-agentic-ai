/**
 * Logger Utility
 *
 * Provides standardized logging functionality for the application.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  prefix: 'YAMLManager',
  timestamp: true,
  colors: true
};

/**
 * ANSI color codes
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Logger class
 */
class Logger {
  private config: LoggerConfig;

  /**
   * Create a new logger instance
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format a log message
   */
  private format(level: string, message: string): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString();
      if (this.config.colors) {
        parts.push(`${COLORS.gray}${timestamp}${COLORS.reset}`);
      } else {
        parts.push(timestamp);
      }
    }

    // Add prefix if set
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    // Add log level
    parts.push(`[${level}]`);

    // Add message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formattedArgs = args.length > 0 ? args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') : '';

      const formattedMessage = this.format(
        this.config.colors ? `${COLORS.cyan}DEBUG${COLORS.reset}` : 'DEBUG',
        `${message} ${formattedArgs}`.trim()
      );

      console.debug(formattedMessage);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formattedArgs = args.length > 0 ? args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') : '';

      const formattedMessage = this.format(
        this.config.colors ? `${COLORS.green}INFO${COLORS.reset}` : 'INFO',
        `${message} ${formattedArgs}`.trim()
      );

      console.info(formattedMessage);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      const formattedArgs = args.length > 0 ? args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') : '';

      const formattedMessage = this.format(
        this.config.colors ? `${COLORS.yellow}WARN${COLORS.reset}` : 'WARN',
        `${message} ${formattedArgs}`.trim()
      );

      console.warn(formattedMessage);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formattedArgs = args.length > 0 ? args.map(arg =>
        arg instanceof Error
          ? `${arg.message}\n${arg.stack}`
          : typeof arg === 'object'
            ? JSON.stringify(arg, null, 2)
            : String(arg)
      ).join(' ') : '';

      const formattedMessage = this.format(
        this.config.colors ? `${COLORS.red}ERROR${COLORS.reset}` : 'ERROR',
        `${message} ${formattedArgs}`.trim()
      );

      console.error(formattedMessage);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

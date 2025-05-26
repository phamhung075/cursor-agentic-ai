/**
 * @file LogTypes.ts
 * @description Type definitions for the logging system
 * 
 * This file defines the logging interfaces and implementations used
 * throughout the application. It provides a structured approach to
 * logging with consistent formatting and multiple log levels.
 */

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Log message format
 */
export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logger interface
 * 
 * Defines the contract for all logger implementations
 */
export interface Logger {
  /**
   * Log an informational message
   * @param component - The component generating the log
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  info: (component: string, message: string, metadata?: Record<string, unknown>) => void;
  
  /**
   * Log an error message
   * @param component - The component generating the log
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  error: (component: string, message: string, metadata?: Record<string, unknown>) => void;
  
  /**
   * Log a warning message
   * @param component - The component generating the log
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  warn: (component: string, message: string, metadata?: Record<string, unknown>) => void;
  
  /**
   * Log a debug message
   * @param component - The component generating the log
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  debug: (component: string, message: string, metadata?: Record<string, unknown>) => void;
  
  /**
   * Set the minimum log level
   * @param level - The minimum level to log
   */
  setLevel?: (level: LogLevel) => void;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Minimum log level to display
   * @default LogLevel.DEBUG
   */
  level?: LogLevel;
  
  /**
   * Whether to include timestamps in log messages
   * @default true
   */
  showTimestamps?: boolean;
  
  /**
   * Whether to format metadata as JSON
   * @default true
   */
  formatMetadata?: boolean;
  
  /**
   * Whether to use color in log output
   * @default true
   */
  useColors?: boolean;
}

/**
 * Color codes for terminal output
 */
const Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  
  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  
  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  showTimestamps: true,
  formatMetadata: true,
  useColors: true
};

/**
 * Enhanced console logger implementation
 * 
 * Provides formatted, colorized console logging with support for different log levels
 */
export class ConsoleLogger implements Logger {
  private config: LoggerConfig;
  
  /**
   * Create a new console logger
   * @param config - Logger configuration
   */
  constructor(config: LoggerConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Set the minimum log level
   * @param level - The minimum level to log
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }
  
  /**
   * Format a log message
   */
  private formatMessage(level: LogLevel, component: string, message: string, metadata?: Record<string, unknown>): string {
    let result = '';
    
    // Add timestamp if enabled
    if (this.config.showTimestamps) {
      const timestamp = new Date().toISOString();
      result += `[${timestamp}] `;
    }
    
    // Add level with appropriate color
    if (this.config.useColors) {
      const levelColors: Record<number, string> = {
        [LogLevel.DEBUG]: Colors.cyan,
        [LogLevel.INFO]: Colors.green,
        [LogLevel.WARN]: Colors.yellow,
        [LogLevel.ERROR]: Colors.red,
      };
      
      const levelLabels: Record<number, string> = {
        [LogLevel.DEBUG]: 'DEBUG',
        [LogLevel.INFO]: 'INFO',
        [LogLevel.WARN]: 'WARN',
        [LogLevel.ERROR]: 'ERROR',
      };
      
      const color = levelColors[level] || Colors.reset;
      const label = levelLabels[level] || 'UNKNOWN';
      
      result += `${color}[${label}]${Colors.reset} `;
    } else {
      const levelLabels: Record<number, string> = {
        [LogLevel.DEBUG]: 'DEBUG',
        [LogLevel.INFO]: 'INFO',
        [LogLevel.WARN]: 'WARN',
        [LogLevel.ERROR]: 'ERROR',
      };
      result += `[${levelLabels[level] || 'UNKNOWN'}] `;
    }
    
    // Add component name
    if (this.config.useColors) {
      result += `${Colors.bright}${component}:${Colors.reset} `;
    } else {
      result += `${component}: `;
    }
    
    // Add message
    result += message;
    
    return result;
  }
  
  /**
   * Format metadata as a string
   */
  private formatMetadata(metadata?: Record<string, unknown>): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return '';
    }
    
    if (this.config.formatMetadata) {
      return JSON.stringify(metadata, null, 2);
    } else {
      return JSON.stringify(metadata);
    }
  }
  
  /**
   * Log a debug message
   */
  public debug(component: string, message: string, metadata?: Record<string, unknown>): void {
    if ((this.config.level ?? LogLevel.DEBUG) <= LogLevel.DEBUG) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, component, message);
      const formattedMetadata = this.formatMetadata(metadata);
      console.debug(formattedMessage, formattedMetadata);
    }
  }
  
  /**
   * Log an info message
   */
  public info(component: string, message: string, metadata?: Record<string, unknown>): void {
    if ((this.config.level ?? LogLevel.DEBUG) <= LogLevel.INFO) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, component, message);
      const formattedMetadata = this.formatMetadata(metadata);
      console.log(formattedMessage, formattedMetadata);
    }
  }
  
  /**
   * Log a warning message
   */
  public warn(component: string, message: string, metadata?: Record<string, unknown>): void {
    if ((this.config.level ?? LogLevel.DEBUG) <= LogLevel.WARN) {
      const formattedMessage = this.formatMessage(LogLevel.WARN, component, message);
      const formattedMetadata = this.formatMetadata(metadata);
      console.warn(formattedMessage, formattedMetadata);
    }
  }
  
  /**
   * Log an error message
   */
  public error(component: string, message: string, metadata?: Record<string, unknown>): void {
    if ((this.config.level ?? LogLevel.DEBUG) <= LogLevel.ERROR) {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, component, message);
      const formattedMetadata = this.formatMetadata(metadata);
      console.error(formattedMessage, formattedMetadata);
    }
  }
}

/**
 * Create a simple console logger with default settings
 */
export const consoleLogger: Logger = new ConsoleLogger();

/**
 * Create a console logger with no colors (for environments that don't support ANSI color codes)
 */
export const plainLogger: Logger = new ConsoleLogger({ useColors: false });

/**
 * Create a minimal logger with fewer details
 */
export const minimalLogger: Logger = new ConsoleLogger({ 
  showTimestamps: false, 
  formatMetadata: false 
});

/**
 * A silent logger that doesn't output anything
 */
export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  setLevel: () => {}
}; 
/**
 * Comprehensive Logging System
 * 
 * Provides structured logging with different levels, component tracking,
 * and configurable output for monitoring task server activities.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: any;
  metadata?: {
    taskId?: string;
    userId?: string;
    operation?: string;
    duration?: number;
    [key: string]: any;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableStructured: boolean;
  includeStackTrace: boolean;
  maxFileSize?: number;
  maxFiles?: number;
}

export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private static instance: Logger;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableStructured: true,
      includeStackTrace: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Create a component-specific logger
   */
  public createComponentLogger(componentName: string): ComponentLogger {
    return new ComponentLogger(this, componentName);
  }

  /**
   * Log debug message
   */
  public debug(component: string, message: string, context?: any, metadata?: any): void {
    this.log(LogLevel.DEBUG, component, message, context, metadata);
  }

  /**
   * Log info message
   */
  public info(component: string, message: string, context?: any, metadata?: any): void {
    this.log(LogLevel.INFO, component, message, context, metadata);
  }

  /**
   * Log warning message
   */
  public warn(component: string, message: string, context?: any, metadata?: any): void {
    this.log(LogLevel.WARN, component, message, context, metadata);
  }

  /**
   * Log error message
   */
  public error(component: string, message: string, context?: any, metadata?: any): void {
    this.log(LogLevel.ERROR, component, message, context, metadata);
  }

  /**
   * Log operation start
   */
  public startOperation(component: string, operation: string, metadata?: any): string {
    const operationId = `${component}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.info(component, `🚀 Starting operation: ${operation}`, { operationId }, {
      operation,
      operationId,
      ...metadata
    });
    return operationId;
  }

  /**
   * Log operation completion
   */
  public endOperation(component: string, operationId: string, operation: string, duration: number, success: boolean = true, result?: any): void {
    const status = success ? '✅' : '❌';
    this.info(component, `${status} Completed operation: ${operation} (${duration}ms)`, { 
      operationId, 
      result: success ? result : undefined,
      error: !success ? result : undefined
    }, {
      operation,
      operationId,
      duration,
      success
    });
  }

  /**
   * Log task activity
   */
  public logTaskActivity(component: string, taskId: string, action: string, details?: any): void {
    this.info(component, `📋 Task ${action}: ${taskId}`, details, {
      taskId,
      operation: action,
      taskAction: action
    });
  }

  /**
   * Log API request
   */
  public logAPIRequest(method: string, path: string, statusCode: number, duration: number, metadata?: any): void {
    const status = statusCode < 400 ? '✅' : '❌';
    this.info('API', `${status} ${method} ${path} - ${statusCode} (${duration}ms)`, metadata, {
      operation: 'api_request',
      method,
      path,
      statusCode,
      duration,
      ...metadata
    });
  }

  /**
   * Log system event
   */
  public logSystemEvent(event: string, details?: any): void {
    this.info('SYSTEM', `🔔 System event: ${event}`, details, {
      operation: 'system_event',
      event
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformance(component: string, metric: string, value: number, unit: string = 'ms'): void {
    this.info(component, `📊 Performance: ${metric} = ${value}${unit}`, { metric, value, unit }, {
      operation: 'performance_metric',
      metric,
      value,
      unit
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, component: string, message: string, context?: any, metadata?: any): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context,
      metadata
    };

    this.logBuffer.push(logEntry);

    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    if (this.config.enableFile) {
      this.logToFile(logEntry);
    }

    // Keep buffer size manageable
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-500);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.SILENT]: '\x1b[37m' // White
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO ',
      [LogLevel.WARN]: 'WARN ',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.SILENT]: 'SILENT'
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '\x1b[37m'; // Default to white
    const levelName = levelNames[entry.level] ?? 'UNKNOWN';

    if (this.config.enableStructured) {
      const timestamp = entry.timestamp.split('T')[1]?.split('.')[0] ?? '';
      const componentPadded = entry.component.padEnd(12);
      
      console.log(
        `${color}[${timestamp}] ${levelName} ${componentPadded}${reset} ${entry.message}`
      );

      if (entry.context && Object.keys(entry.context).length > 0) {
        console.log(`${color}    Context:${reset}`, entry.context);
      }

      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        console.log(`${color}    Metadata:${reset}`, entry.metadata);
      }
    } else {
      console.log(`${color}[${entry.component}] ${entry.message}${reset}`);
    }
  }

  /**
   * Log to file (placeholder - would need fs module in real implementation)
   */
  private logToFile(entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just store in buffer
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get logs by component
   */
  public getLogsByComponent(component: string, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.component === component)
      .slice(-count);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter(entry => entry.level >= level)
      .slice(-count);
  }

  /**
   * Clear log buffer
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Component-specific logger for easier usage
 */
export class ComponentLogger {
  constructor(
    private logger: Logger,
    private componentName: string
  ) {}

  public debug(message: string, context?: any, metadata?: any): void {
    this.logger.debug(this.componentName, message, context, metadata);
  }

  public info(message: string, context?: any, metadata?: any): void {
    this.logger.info(this.componentName, message, context, metadata);
  }

  public warn(message: string, context?: any, metadata?: any): void {
    this.logger.warn(this.componentName, message, context, metadata);
  }

  public error(message: string, context?: any, metadata?: any): void {
    this.logger.error(this.componentName, message, context, metadata);
  }

  public startOperation(operation: string, metadata?: any): string {
    return this.logger.startOperation(this.componentName, operation, metadata);
  }

  public endOperation(operationId: string, operation: string, duration: number, success: boolean = true, result?: any): void {
    this.logger.endOperation(this.componentName, operationId, operation, duration, success, result);
  }

  public logTaskActivity(taskId: string, action: string, details?: any): void {
    this.logger.logTaskActivity(this.componentName, taskId, action, details);
  }

  public logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.logger.logPerformance(this.componentName, metric, value, unit);
  }
}

/**
 * Global logger instance
 */
export const globalLogger = Logger.getInstance();

/**
 * Convenience functions for quick logging
 */
export const log = {
  debug: (component: string, message: string, context?: any, metadata?: any) => 
    globalLogger.debug(component, message, context, metadata),
  
  info: (component: string, message: string, context?: any, metadata?: any) => 
    globalLogger.info(component, message, context, metadata),
  
  warn: (component: string, message: string, context?: any, metadata?: any) => 
    globalLogger.warn(component, message, context, metadata),
  
  error: (component: string, message: string, context?: any, metadata?: any) => 
    globalLogger.error(component, message, context, metadata),

  task: (component: string, taskId: string, action: string, details?: any) =>
    globalLogger.logTaskActivity(component, taskId, action, details),

  api: (method: string, path: string, statusCode: number, duration: number, metadata?: any) =>
    globalLogger.logAPIRequest(method, path, statusCode, duration, metadata),

  system: (event: string, details?: any) =>
    globalLogger.logSystemEvent(event, details),

  performance: (component: string, metric: string, value: number, unit?: string) =>
    globalLogger.logPerformance(component, metric, value, unit)
};

export default Logger; 
import {
  TestLogger as ITestLogger,
  TestLog
} from '../../types/TestingTypes';

/**
 * Test Logger
 * 
 * Provides logging capabilities for test execution,
 * capturing debug information, errors, and test progress.
 */
export class TestLogger implements ITestLogger {
  private logs: TestLog[] = [];

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.addLog('debug', message, metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.addLog('info', message, metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.addLog('warn', message, metadata);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorString = error ? `${error.name}: ${error.message}\n${error.stack}` : undefined;
    this.addLog('error', message, metadata, errorString);
  }

  /**
   * Get all logs
   */
  public getLogs(): TestLog[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error'): TestLog[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs count
   */
  public getLogsCount(): number {
    return this.logs.length;
  }

  /**
   * Get error count
   */
  public getErrorCount(): number {
    return this.logs.filter(log => log.level === 'error').length;
  }

  /**
   * Get warning count
   */
  public getWarningCount(): number {
    return this.logs.filter(log => log.level === 'warn').length;
  }

  /**
   * Add log entry
   */
  private addLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>,
    error?: string
  ): void {
    const log: TestLog = {
      level,
      message,
      timestamp: new Date().toISOString()
    };

    if (metadata) {
      log.metadata = metadata;
    }

    if (error) {
      log.error = error;
    }

    this.logs.push(log);

    // Also log to console for immediate feedback
    this.logToConsole(log);
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(log: TestLog): void {
    const prefix = `[${log.timestamp}] [${log.level.toUpperCase()}]`;
    const message = `${prefix} ${log.message}`;

    switch (log.level) {
      case 'debug':
        console.debug(message, log.metadata);
        break;
      case 'info':
        console.info(message, log.metadata);
        break;
      case 'warn':
        console.warn(message, log.metadata);
        break;
      case 'error':
        console.error(message, log.error, log.metadata);
        break;
    }
  }
} 
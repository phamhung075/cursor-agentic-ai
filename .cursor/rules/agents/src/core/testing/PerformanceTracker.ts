import {
  PerformanceTracker as IPerformanceTracker,
  PerformanceMetrics
} from '../../types/TestingTypes';

/**
 * Performance Tracker
 * 
 * Tracks performance metrics during test execution including
 * timing, memory usage, and operation measurements.
 */
export class PerformanceTracker implements IPerformanceTracker {
  private operations: Map<string, number> = new Map();
  private marks: Map<string, number> = new Map();
  private measurements: Map<string, number> = new Map();
  private startMemory: NodeJS.MemoryUsage;
  private responseTimes: number[] = [];
  private operationCounts: Map<string, number> = new Map();
  private errors: Array<{ type: string; message: string; timestamp: number }> = [];

  constructor() {
    this.startMemory = process.memoryUsage();
  }

  /**
   * Start timing an operation
   */
  public start(operation: string): void {
    this.operations.set(operation, Date.now());
    
    // Track operation count
    const count = this.operationCounts.get(operation) || 0;
    this.operationCounts.set(operation, count + 1);
  }

  /**
   * End timing an operation and return duration
   */
  public end(operation: string): number {
    const startTime = this.operations.get(operation);
    if (!startTime) {
      throw new Error(`Operation '${operation}' was not started`);
    }

    const duration = Date.now() - startTime;
    this.responseTimes.push(duration);
    this.operations.delete(operation);

    return duration;
  }

  /**
   * Create a performance mark
   */
  public mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);

    if (!startTime) {
      throw new Error(`Start mark '${startMark}' not found`);
    }
    if (!endTime) {
      throw new Error(`End mark '${endMark}' not found`);
    }

    const duration = endTime - startTime;
    this.measurements.set(name, duration);

    return duration;
  }

  /**
   * Record an error
   */
  public recordError(type: string, message: string): void {
    this.errors.push({
      type,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Get comprehensive performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const currentMemory = process.memoryUsage();

    return {
      responseTime: this.calculateResponseTimeMetrics(),
      throughput: this.calculateThroughputMetrics(),
      resource: {
        memoryUsage: currentMemory.heapUsed / (1024 * 1024), // MB
        cpuUsage: this.calculateCpuUsage(),
        diskIO: 0, // Simplified for now
        networkIO: 0 // Simplified for now
      },
      errors: {
        count: this.errors.length,
        rate: this.calculateErrorRate(),
        types: this.calculateErrorTypes()
      }
    };
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.operations.clear();
    this.marks.clear();
    this.measurements.clear();
    this.responseTimes = [];
    this.operationCounts.clear();
    this.errors = [];
    this.startMemory = process.memoryUsage();
  }

  /**
   * Get operation count
   */
  public getOperationCount(operation: string): number {
    return this.operationCounts.get(operation) || 0;
  }

  /**
   * Get all measurements
   */
  public getMeasurements(): Map<string, number> {
    return new Map(this.measurements);
  }

  /**
   * Get average response time
   */
  public getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    return this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(): {
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
  } {
    if (this.responseTimes.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;

    return {
      min: sorted[0] || 0,
      max: sorted[length - 1] || 0,
      average: this.getAverageResponseTime(),
      median: this.calculatePercentile(sorted, 50),
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99)
    };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(): {
    requestsPerSecond: number;
    operationsPerSecond: number;
  } {
    const totalOperations = Array.from(this.operationCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    // Simplified calculation - in real scenario would track time window
    const timeWindow = 1; // 1 second
    
    return {
      requestsPerSecond: this.responseTimes.length / timeWindow,
      operationsPerSecond: totalOperations / timeWindow
    };
  }

  /**
   * Calculate CPU usage (simplified)
   */
  private calculateCpuUsage(): number {
    const cpuUsage = process.cpuUsage();
    return (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const totalOperations = Array.from(this.operationCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (totalOperations === 0) return 0;
    return this.errors.length / totalOperations;
  }

  /**
   * Calculate error types distribution
   */
  private calculateErrorTypes(): Record<string, number> {
    const types: Record<string, number> = {};
    
    for (const error of this.errors) {
      types[error.type] = (types[error.type] || 0) + 1;
    }
    
    return types;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))] || 0;
  }
} 
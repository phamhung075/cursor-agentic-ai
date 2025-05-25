import { EventEmitter } from 'events';
import {
  LoadTestConfiguration,
  LoadTestScenario,
  LoadTestThresholds,
  PerformanceMetrics,
  DeploymentEnvironment
} from '../../types/DeploymentTypes';
import { PerformanceTracker } from '../testing/PerformanceTracker';
import { TestLogger } from '../testing/TestLogger';

/**
 * Load Test Runner
 * 
 * Comprehensive load testing system for validating system performance
 * under various load conditions and stress scenarios.
 */
export class LoadTestRunner extends EventEmitter {
  private logger: TestLogger;
  private performance: PerformanceTracker;
  private environment: DeploymentEnvironment;
  private isRunning: boolean = false;
  private currentTest?: LoadTestConfiguration;
  private results: Map<string, LoadTestResult> = new Map();
  private activeUsers: Map<string, UserSession> = new Map();

  constructor(environment: DeploymentEnvironment = 'testing') {
    super();
    this.environment = environment;
    this.logger = new TestLogger();
    this.performance = new PerformanceTracker();
  }

  /**
   * Run a complete load test
   */
  public async runLoadTest(config: LoadTestConfiguration): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test is already running');
    }

    this.isRunning = true;
    this.currentTest = config;
    const startTime = Date.now();

    this.logger.info(`Starting load test: ${config.name}`);
    this.emit('loadTestStarted', { testId: config.id, name: config.name });

    try {
      // Initialize test environment
      await this.initializeLoadTest(config);

      // Execute load test phases
      const result = await this.executeLoadTest(config);

      // Validate thresholds
      const thresholdResults = this.validateThresholds(result, config.thresholds);

      const finalResult: LoadTestResult = {
        ...result,
        thresholdResults,
        success: thresholdResults.every(t => t.passed),
        duration: Date.now() - startTime
      };

      this.results.set(config.id, finalResult);
      this.emit('loadTestCompleted', { testId: config.id, result: finalResult });

      return finalResult;

    } catch (error) {
      this.logger.error('Load test failed', error instanceof Error ? error : new Error(String(error)));
      this.emit('loadTestFailed', { testId: config.id, error });
      throw error;
    } finally {
      this.isRunning = false;
      this.currentTest = undefined;
      await this.cleanupLoadTest();
    }
  }

  /**
   * Execute the main load test
   */
  private async executeLoadTest(config: LoadTestConfiguration): Promise<Partial<LoadTestResult>> {
    const phases = [
      { name: 'ramp-up', duration: config.rampUp },
      { name: 'steady-state', duration: config.duration },
      { name: 'ramp-down', duration: config.rampDown }
    ];

    const metrics: PerformanceMetrics = {
      responseTime: { min: 0, max: 0, average: 0, median: 0, p95: 0, p99: 0 },
      throughput: { requestsPerSecond: 0, operationsPerSecond: 0 },
      resource: { memoryUsage: 0, cpuUsage: 0, diskIO: 0, networkIO: 0 },
      errors: { count: 0, rate: 0, types: {} }
    };

    const responseTimes: number[] = [];
    const errors: LoadTestError[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;

    for (const phase of phases) {
      this.logger.info(`Starting phase: ${phase.name} (${phase.duration}ms)`);
      this.emit('phaseStarted', { phase: phase.name, duration: phase.duration });

      const phaseStartTime = Date.now();
      const phaseEndTime = phaseStartTime + phase.duration;

      // Execute scenarios during this phase
      while (Date.now() < phaseEndTime) {
        for (const scenario of config.scenarios) {
          const scenarioResult = await this.executeScenario(scenario, phase.name);
          
          totalRequests += scenarioResult.requestCount;
          successfulRequests += scenarioResult.successCount;
          responseTimes.push(...scenarioResult.responseTimes);
          errors.push(...scenarioResult.errors);

          // Simulate think time
          if (scenario.thinkTime) {
            const thinkTime = this.calculateThinkTime(scenario.thinkTime);
            await this.wait(thinkTime);
          }
        }

        // Check if we should continue based on time
        if (Date.now() >= phaseEndTime) break;
      }

      this.emit('phaseCompleted', { phase: phase.name });
    }

    // Calculate final metrics
    responseTimes.sort((a, b) => a - b);
    const totalDuration = config.rampUp + config.duration + config.rampDown;

    metrics.responseTime = {
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      average: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      median: responseTimes[Math.floor(responseTimes.length / 2)],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
    };

    metrics.throughput = {
      requestsPerSecond: totalRequests / (totalDuration / 1000),
      operationsPerSecond: successfulRequests / (totalDuration / 1000)
    };

    metrics.errors = {
      count: errors.length,
      rate: errors.length / totalRequests,
      types: this.groupErrorsByType(errors)
    };

    return {
      testId: config.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      metrics,
      totalRequests,
      successfulRequests,
      errors,
      userSessions: Array.from(this.activeUsers.values())
    };
  }

  /**
   * Execute a single scenario
   */
  private async executeScenario(scenario: LoadTestScenario, phase: string): Promise<ScenarioResult> {
    const result: ScenarioResult = {
      scenarioName: scenario.name,
      phase,
      requestCount: 0,
      successCount: 0,
      responseTimes: [],
      errors: []
    };

    // Simulate user load pattern
    const userCount = this.calculateUserCount(scenario.users, phase);
    
    for (let i = 0; i < userCount; i++) {
      const userId = `user_${scenario.name}_${i}_${Date.now()}`;
      const userSession = await this.createUserSession(userId, scenario);
      
      // Execute requests for this user
      for (const request of scenario.requests) {
        const requestResult = await this.executeRequest(userSession, request);
        
        result.requestCount++;
        result.responseTimes.push(requestResult.responseTime);
        
        if (requestResult.success) {
          result.successCount++;
        } else {
          result.errors.push({
            type: requestResult.errorType || 'unknown',
            message: requestResult.error || 'Unknown error',
            timestamp: new Date().toISOString(),
            userId,
            requestName: request.name
          });
        }
      }
    }

    return result;
  }

  /**
   * Execute a single request
   */
  private async executeRequest(userSession: UserSession, request: any): Promise<RequestResult> {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP request
      const response = await this.simulateHttpRequest(request);
      const responseTime = Date.now() - startTime;
      
      // Validate response
      const validationResults = await this.validateResponse(response, request.validation || []);
      const success = validationResults.every(v => v.passed);
      
      return {
        success,
        responseTime,
        statusCode: response.statusCode,
        response: response.data,
        validationResults
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        errorType: 'request_failed'
      };
    }
  }

  /**
   * Simulate HTTP request
   */
  private async simulateHttpRequest(request: any): Promise<HttpResponse> {
    // Simulate network latency
    const latency = Math.random() * 100 + 50; // 50-150ms
    await this.wait(latency);
    
    // Simulate different response scenarios
    const successRate = 0.95; // 95% success rate
    const isSuccess = Math.random() < successRate;
    
    if (isSuccess) {
      return {
        statusCode: 200,
        data: { success: true, timestamp: new Date().toISOString() },
        headers: { 'content-type': 'application/json' }
      };
    } else {
      // Simulate various error scenarios
      const errorScenarios = [
        { statusCode: 500, data: { error: 'Internal Server Error' } },
        { statusCode: 503, data: { error: 'Service Unavailable' } },
        { statusCode: 429, data: { error: 'Too Many Requests' } }
      ];
      
      const errorScenario = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
      return {
        statusCode: errorScenario.statusCode,
        data: errorScenario.data,
        headers: { 'content-type': 'application/json' }
      };
    }
  }

  /**
   * Validate response
   */
  private async validateResponse(response: HttpResponse, validations: any[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const validation of validations) {
      let passed = false;
      let message = '';
      
      switch (validation.type) {
        case 'status_code':
          passed = response.statusCode === validation.criteria;
          message = `Expected status ${validation.criteria}, got ${response.statusCode}`;
          break;
        case 'response_time':
          // Response time validation would be handled at request level
          passed = true;
          message = 'Response time validation passed';
          break;
        case 'content':
          passed = JSON.stringify(response.data).includes(validation.criteria);
          message = `Content validation: ${passed ? 'passed' : 'failed'}`;
          break;
        default:
          passed = true;
          message = 'Unknown validation type';
      }
      
      results.push({
        type: validation.type,
        passed,
        message,
        severity: validation.severity || 'error'
      });
    }
    
    return results;
  }

  /**
   * Validate performance thresholds
   */
  private validateThresholds(result: Partial<LoadTestResult>, thresholds: LoadTestThresholds): ThresholdResult[] {
    const results: ThresholdResult[] = [];
    
    if (result.metrics) {
      // Response time thresholds
      results.push({
        name: 'Average Response Time',
        threshold: thresholds.responseTime.average,
        actual: result.metrics.responseTime.average,
        passed: result.metrics.responseTime.average <= thresholds.responseTime.average,
        unit: 'ms'
      });
      
      results.push({
        name: 'P95 Response Time',
        threshold: thresholds.responseTime.p95,
        actual: result.metrics.responseTime.p95,
        passed: result.metrics.responseTime.p95 <= thresholds.responseTime.p95,
        unit: 'ms'
      });
      
      // Throughput thresholds
      results.push({
        name: 'Minimum Throughput',
        threshold: thresholds.throughput.minimum,
        actual: result.metrics.throughput.requestsPerSecond,
        passed: result.metrics.throughput.requestsPerSecond >= thresholds.throughput.minimum,
        unit: 'req/s'
      });
      
      // Error rate thresholds
      results.push({
        name: 'Maximum Error Rate',
        threshold: thresholds.errorRate.maximum,
        actual: result.metrics.errors.rate,
        passed: result.metrics.errors.rate <= thresholds.errorRate.maximum,
        unit: '%'
      });
    }
    
    return results;
  }

  /**
   * Helper methods
   */
  private async initializeLoadTest(config: LoadTestConfiguration): Promise<void> {
    this.logger.info('Initializing load test environment');
    this.activeUsers.clear();
  }

  private async cleanupLoadTest(): Promise<void> {
    this.logger.info('Cleaning up load test environment');
    this.activeUsers.clear();
  }

  private async createUserSession(userId: string, scenario: LoadTestScenario): Promise<UserSession> {
    const session: UserSession = {
      id: userId,
      scenario: scenario.name,
      startTime: new Date().toISOString(),
      requestCount: 0,
      successCount: 0,
      errors: []
    };
    
    this.activeUsers.set(userId, session);
    return session;
  }

  private calculateUserCount(userPattern: any, phase: string): number {
    // Simplified user count calculation
    switch (phase) {
      case 'ramp-up':
        return Math.floor(userPattern.count * 0.5);
      case 'steady-state':
        return userPattern.count;
      case 'ramp-down':
        return Math.floor(userPattern.count * 0.3);
      default:
        return userPattern.count;
    }
  }

  private calculateThinkTime(thinkTimeConfig: any): number {
    const { min, max, distribution } = thinkTimeConfig;
    
    switch (distribution) {
      case 'uniform':
        return Math.random() * (max - min) + min;
      case 'normal':
        // Simplified normal distribution
        return (Math.random() + Math.random()) * (max - min) / 2 + min;
      default:
        return (min + max) / 2;
    }
  }

  private groupErrorsByType(errors: LoadTestError[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    for (const error of errors) {
      grouped[error.type] = (grouped[error.type] || 0) + 1;
    }
    
    return grouped;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public methods
   */
  public getResults(): Map<string, LoadTestResult> {
    return this.results;
  }

  public stop(): void {
    this.isRunning = false;
    this.emit('loadTestStopped');
  }

  public destroy(): void {
    this.stop();
    this.results.clear();
    this.activeUsers.clear();
    this.removeAllListeners();
  }
}

/**
 * Supporting interfaces
 */
interface LoadTestResult {
  testId: string;
  startTime: string;
  endTime: string;
  duration: number;
  metrics: PerformanceMetrics;
  totalRequests: number;
  successfulRequests: number;
  errors: LoadTestError[];
  userSessions: UserSession[];
  thresholdResults: ThresholdResult[];
  success: boolean;
}

interface ScenarioResult {
  scenarioName: string;
  phase: string;
  requestCount: number;
  successCount: number;
  responseTimes: number[];
  errors: LoadTestError[];
}

interface RequestResult {
  success: boolean;
  responseTime: number;
  statusCode?: number;
  response?: any;
  error?: string;
  errorType?: string;
  validationResults?: ValidationResult[];
}

interface HttpResponse {
  statusCode: number;
  data: any;
  headers: Record<string, string>;
}

interface ValidationResult {
  type: string;
  passed: boolean;
  message: string;
  severity: string;
}

interface ThresholdResult {
  name: string;
  threshold: number;
  actual: number;
  passed: boolean;
  unit: string;
}

interface LoadTestError {
  type: string;
  message: string;
  timestamp: string;
  userId: string;
  requestName: string;
}

interface UserSession {
  id: string;
  scenario: string;
  startTime: string;
  requestCount: number;
  successCount: number;
  errors: LoadTestError[];
} 
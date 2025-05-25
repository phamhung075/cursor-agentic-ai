import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  TestRunner as ITestRunner,
  TestSuite,
  Test,
  TestResult,
  TestSuiteResult,
  TestReport,
  TestRunOptions,
  TestRunnerStatus,
  TestContext,
  TestEnvironment,
  TestSummary,
  TestStatus,
  TestError
} from '../../types/TestingTypes';
import { MockServiceRegistry } from './MockServiceRegistry';
import { TestDataRegistry } from './TestDataRegistry';
import { AssertionRegistry } from './AssertionRegistry';
import { TestLogger } from './TestLogger';
import { PerformanceTracker } from './PerformanceTracker';
import { CoverageCollector } from './CoverageCollector';

/**
 * Test Runner
 * 
 * Main orchestrator for test execution, providing comprehensive testing
 * capabilities including unit tests, integration tests, and performance testing.
 */
export class TestRunner extends EventEmitter implements ITestRunner {
  private testSuites: Map<string, TestSuite> = new Map();
  private tests: Map<string, Test> = new Map();
  private results: Map<string, TestResult> = new Map();
  private suiteResults: Map<string, TestSuiteResult> = new Map();
  private isRunning: boolean = false;
  private currentSuite?: string | undefined;
  private currentTest?: string | undefined;
  private startTime?: Date | undefined;
  private environment: TestEnvironment;
  private mockRegistry: MockServiceRegistry;
  private dataRegistry: TestDataRegistry;
  private assertionRegistry: AssertionRegistry;
  private coverageCollector: CoverageCollector;

  constructor(environment: TestEnvironment) {
    super();
    this.environment = environment;
    this.mockRegistry = new MockServiceRegistry();
    this.dataRegistry = new TestDataRegistry();
    this.assertionRegistry = new AssertionRegistry();
    this.coverageCollector = new CoverageCollector();
    this.setupEventHandlers();
  }

  /**
   * Register a test suite
   */
  public registerSuite(suite: TestSuite): void {
    this.testSuites.set(suite.id, suite);
    
    // Register individual tests
    for (const test of suite.tests) {
      this.tests.set(test.id, test);
    }

    this.emit('suite_registered', { suite });
  }

  /**
   * Register an individual test
   */
  public registerTest(test: Test): void {
    this.tests.set(test.id, test);
    this.emit('test_registered', { test });
  }

  /**
   * Run a specific test suite
   */
  public async runSuite(suiteId: string, options?: TestRunOptions): Promise<TestSuiteResult> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    this.isRunning = true;
    this.currentSuite = suiteId;
    this.startTime = new Date();

    const startTime = new Date().toISOString();
    const testResults: TestResult[] = [];

    this.emit('suite_started', { suiteId, suite, options });

    try {
      // Setup suite
      if (suite.setup) {
        await this.executeSuiteSetup(suite, options);
      }

      // Run tests
      if (options?.parallel && suite.parallel) {
        testResults.push(...await this.runTestsParallel(suite.tests, options));
      } else {
        testResults.push(...await this.runTestsSequential(suite.tests, options));
      }

      // Teardown suite
      if (suite.teardown) {
        await this.executeSuiteTeardown(suite, options);
      }

    } catch (error) {
      this.emit('suite_error', { suiteId, error });
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const suiteResult: TestSuiteResult = {
      suiteId,
      status: this.calculateSuiteStatus(testResults),
      startTime,
      endTime,
      duration,
      totalTests: testResults.length,
      passedTests: testResults.filter(r => r.status === 'passed').length,
      failedTests: testResults.filter(r => r.status === 'failed').length,
      skippedTests: testResults.filter(r => r.status === 'skipped').length,
      testResults,
      coverage: options?.coverage ? this.coverageCollector.getResults() : undefined,
      summary: this.generateSuiteSummary(testResults)
    };

    this.suiteResults.set(suiteId, suiteResult);
    this.isRunning = false;
    this.currentSuite = undefined;

    this.emit('suite_completed', { suiteId, result: suiteResult });

    return suiteResult;
  }

  /**
   * Run a specific test
   */
  public async runTest(testId: string, options?: TestRunOptions): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    this.isRunning = true;
    this.currentTest = testId;

    const result = await this.executeTest(test, options);
    
    this.results.set(testId, result);
    this.isRunning = false;
    this.currentTest = undefined;

    return result;
  }

  /**
   * Run all registered test suites
   */
  public async runAll(options?: TestRunOptions): Promise<TestReport> {
    this.isRunning = true;
    this.startTime = new Date();

    const reportId = uuidv4();
    const startTime = new Date().toISOString();
    const suiteResults: TestSuiteResult[] = [];

    this.emit('run_started', { reportId, options });

    try {
      for (const [suiteId] of this.testSuites) {
        const result = await this.runSuite(suiteId, options);
        suiteResults.push(result);
      }
    } catch (error) {
      this.emit('run_error', { reportId, error });
    }

    const endTime = new Date().toISOString();
    const summary = this.generateOverallSummary(suiteResults);

    const report: TestReport = {
      id: reportId,
      name: `Test Run ${startTime}`,
      type: 'run',
      timestamp: endTime,
      summary,
      results: suiteResults,
      coverage: options?.coverage ? this.coverageCollector.getResults() : undefined,
      trends: [],
      recommendations: this.generateRecommendations(suiteResults),
      metadata: {
        environment: this.environment.name,
        options,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime()
      }
    };

    this.isRunning = false;
    this.startTime = undefined;

    this.emit('run_completed', { reportId, report });

    return report;
  }

  /**
   * Stop test execution
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.currentSuite = undefined;
    this.currentTest = undefined;
    this.startTime = undefined;

    this.emit('run_stopped');
  }

  /**
   * Get current runner status
   */
  public getStatus(): TestRunnerStatus {
    const totalTests = Array.from(this.testSuites.values())
      .reduce((sum, suite) => sum + suite.tests.length, 0);
    
    const completedTests = this.results.size;

    return {
      running: this.isRunning,
      currentSuite: this.currentSuite,
      currentTest: this.currentTest,
      progress: {
        completed: completedTests,
        total: totalTests,
        percentage: totalTests > 0 ? (completedTests / totalTests) * 100 : 0
      },
      startTime: this.startTime?.toISOString(),
      estimatedCompletion: this.calculateEstimatedCompletion()
    };
  }

  /**
   * Get test results
   */
  public getResults(): Map<string, TestResult> {
    return new Map(this.results);
  }

  /**
   * Get suite results
   */
  public getSuiteResults(): Map<string, TestSuiteResult> {
    return new Map(this.suiteResults);
  }

  /**
   * Clear all results
   */
  public clearResults(): void {
    this.results.clear();
    this.suiteResults.clear();
    this.coverageCollector.reset();
    this.emit('results_cleared');
  }

  /**
   * Execute test setup
   */
  private async executeSuiteSetup(suite: TestSuite, options?: TestRunOptions): Promise<void> {
    if (!suite.setup) return;

    const context = this.createTestContext('setup', suite.id, options);
    
    try {
      await suite.setup(context);
      this.emit('suite_setup_completed', { suiteId: suite.id });
    } catch (error) {
      this.emit('suite_setup_failed', { suiteId: suite.id, error });
      throw error;
    }
  }

  /**
   * Execute test teardown
   */
  private async executeSuiteTeardown(suite: TestSuite, options?: TestRunOptions): Promise<void> {
    if (!suite.teardown) return;

    const context = this.createTestContext('teardown', suite.id, options);
    
    try {
      await suite.teardown(context);
      this.emit('suite_teardown_completed', { suiteId: suite.id });
    } catch (error) {
      this.emit('suite_teardown_failed', { suiteId: suite.id, error });
      throw error;
    }
  }

  /**
   * Run tests in parallel
   */
  private async runTestsParallel(tests: Test[], options?: TestRunOptions): Promise<TestResult[]> {
    const maxConcurrency = options?.maxConcurrency || 4;
    const results: TestResult[] = [];
    
    // Process tests in batches
    for (let i = 0; i < tests.length; i += maxConcurrency) {
      const batch = tests.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(test => this.executeTest(test, options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequential(tests: Test[], options?: TestRunOptions): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const test of tests) {
      const result = await this.executeTest(test, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute individual test
   */
  private async executeTest(test: Test, options?: TestRunOptions): Promise<TestResult> {
    const startTime = new Date().toISOString();
    const logger = new TestLogger();
    const performance = new PerformanceTracker();
    
    this.currentTest = test.id;
    this.emit('test_started', { testId: test.id, test });

    let status: TestStatus = 'pending';
    let error: TestError | undefined;
    const assertions: any[] = [];

    try {
      // Create test context
      const context = this.createTestContext(test.id, test.id, options, logger, performance);

      // Setup test
      if (test.setup) {
        await test.setup(context);
      }

      // Start coverage collection if enabled
      if (options?.coverage) {
        this.coverageCollector.start();
      }

      // Execute test with timeout
      const timeout = options?.timeout || test.timeout || 30000;
      await this.executeWithTimeout(test.testFunction, context, timeout);

      // Collect assertions
      assertions.push(...context.assertions.getResults());

      // Check if all assertions passed
      const failedAssertions = assertions.filter(a => !a.passed);
      if (failedAssertions.length > 0) {
        status = 'failed';
        error = {
          type: 'assertion',
          message: `${failedAssertions.length} assertion(s) failed`,
          metadata: { failedAssertions }
        };
      } else {
        status = 'passed';
      }

      // Teardown test
      if (test.teardown) {
        await test.teardown(context);
      }

    } catch (err) {
      status = 'failed';
      error = {
        type: 'runtime',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      };
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    const result: TestResult = {
      testId: test.id,
      suiteId: test.id, // Will be updated by suite runner
      status,
      startTime,
      endTime,
      duration,
      error,
      assertions,
      coverage: options?.coverage ? this.coverageCollector.getResults() : undefined,
      performance: performance.getMetrics(),
      logs: logger.getLogs(),
      metadata: {
        retries: 0,
        environment: this.environment.name
      }
    };

    this.emit('test_completed', { testId: test.id, result });

    return result;
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: (context: TestContext) => Promise<T> | T,
    context: TestContext,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn(context))
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Create test context
   */
  private createTestContext(
    testId: string,
    suiteId: string,
    options?: TestRunOptions,
    logger?: TestLogger,
    performance?: PerformanceTracker
  ): TestContext {
    return {
      testId,
      suiteId,
      environment: this.environment,
      mockServices: this.mockRegistry,
      testData: this.dataRegistry,
      assertions: this.assertionRegistry,
      logger: logger || new TestLogger(),
      performance: performance || new PerformanceTracker()
    };
  }

  /**
   * Calculate suite status based on test results
   */
  private calculateSuiteStatus(results: TestResult[]): TestStatus {
    if (results.length === 0) return 'skipped';
    if (results.every(r => r.status === 'passed')) return 'passed';
    if (results.some(r => r.status === 'failed')) return 'failed';
    return 'pending';
  }

  /**
   * Generate suite summary
   */
  private generateSuiteSummary(results: TestResult[]): TestSummary {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const total = results.length;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalSuites: 1,
      totalTests: total,
      passed,
      failed,
      skipped,
      duration,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      coverage: 0, // Will be updated by coverage collector
      performance: this.calculatePerformanceRating(results)
    };
  }

  /**
   * Generate overall summary
   */
  private generateOverallSummary(suiteResults: TestSuiteResult[]): TestSummary {
    const totalTests = suiteResults.reduce((sum, r) => sum + r.totalTests, 0);
    const passed = suiteResults.reduce((sum, r) => sum + r.passedTests, 0);
    const failed = suiteResults.reduce((sum, r) => sum + r.failedTests, 0);
    const skipped = suiteResults.reduce((sum, r) => sum + r.skippedTests, 0);
    const duration = suiteResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalSuites: suiteResults.length,
      totalTests,
      passed,
      failed,
      skipped,
      duration,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      coverage: 0, // Will be updated by coverage collector
      performance: 'good' // Simplified for now
    };
  }

  /**
   * Calculate performance rating
   */
  private calculatePerformanceRating(results: TestResult[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    if (avgDuration < 100) return 'excellent';
    if (avgDuration < 500) return 'good';
    if (avgDuration < 2000) return 'fair';
    return 'poor';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(suiteResults: TestSuiteResult[]): any[] {
    const recommendations: any[] = [];
    
    // Check for slow tests
    const slowTests = suiteResults.flatMap(s => s.testResults)
      .filter(r => r.duration > 5000);
    
    if (slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Tests Detected',
        description: `${slowTests.length} tests are taking longer than 5 seconds`,
        action: 'Review and optimize slow tests',
        impact: 'medium',
        effort: 'medium'
      });
    }

    // Check for failed tests
    const failedTests = suiteResults.flatMap(s => s.testResults)
      .filter(r => r.status === 'failed');
    
    if (failedTests.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Failed Tests',
        description: `${failedTests.length} tests are failing`,
        action: 'Fix failing tests to improve reliability',
        impact: 'high',
        effort: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(): string | undefined {
    if (!this.isRunning || !this.startTime) return undefined;

    const elapsed = Date.now() - this.startTime.getTime();
    const status = this.getStatus();
    
    if (status.progress.percentage === 0) return undefined;

    const estimatedTotal = (elapsed / status.progress.percentage) * 100;
    const remaining = estimatedTotal - elapsed;
    const completion = new Date(Date.now() + remaining);

    return completion.toISOString();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.setMaxListeners(100);
    
    // Log important events
    this.on('suite_started', (data) => {
      console.log(`🧪 Starting test suite: ${data.suite.name}`);
    });

    this.on('test_started', (data) => {
      console.log(`  ▶️ Running test: ${data.test.name}`);
    });

    this.on('test_completed', (data) => {
      const icon = data.result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${icon} ${data.result.status.toUpperCase()}: ${data.result.duration}ms`);
    });

    this.on('suite_completed', (data) => {
      const { passedTests, failedTests, totalTests } = data.result;
      console.log(`🏁 Suite completed: ${passedTests}/${totalTests} passed`);
    });
  }
} 
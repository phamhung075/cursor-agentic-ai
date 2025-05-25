/**
 * Testing Framework Type Definitions
 * 
 * Comprehensive type definitions for testing the intelligent task management system
 * including unit tests, integration tests, and end-to-end testing capabilities.
 */

import { Task, TaskOperationResult } from './TaskTypes';
import { AutomationEvent, AutomationExecutionResult } from './AutomationTypes';
import { RealTimeEvent } from './RealTimeTypes';

/**
 * Test types and categories
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'load' | 'security';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'timeout';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Test suite configuration
 */
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  type: TestType;
  priority: TestPriority;
  tests: Test[];
  setup?: TestSetup;
  teardown?: TestTeardown;
  timeout: number;
  retries: number;
  parallel: boolean;
  tags: string[];
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual test definition
 */
export interface Test {
  id: string;
  name: string;
  description: string;
  type: TestType;
  priority: TestPriority;
  testFunction: TestFunction;
  setup?: TestSetup;
  teardown?: TestTeardown;
  timeout: number;
  retries: number;
  tags: string[];
  dependencies: string[];
  expectedResult?: any;
  mockData?: TestMockData;
  assertions: TestAssertion[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Test execution result
 */
export interface TestResult {
  testId: string;
  suiteId: string;
  status: TestStatus;
  startTime: string;
  endTime: string;
  duration: number;
  error?: TestError | undefined;
  assertions: AssertionResult[];
  coverage?: TestCoverage | undefined;
  performance?: PerformanceMetrics | undefined;
  logs: TestLog[];
  metadata: Record<string, any>;
}

/**
 * Test suite execution result
 */
export interface TestSuiteResult {
  suiteId: string;
  status: TestStatus;
  startTime: string;
  endTime: string;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  testResults: TestResult[];
  coverage?: TestCoverage | undefined;
  performance?: PerformanceMetrics | undefined;
  summary: TestSummary;
}

/**
 * Test execution context
 */
export interface TestContext {
  testId: string;
  suiteId: string;
  environment: TestEnvironment;
  mockServices: MockServiceRegistry;
  testData: TestDataRegistry;
  assertions: AssertionRegistry;
  logger: TestLogger;
  performance: PerformanceTracker;
}

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  name: string;
  type: 'development' | 'testing' | 'staging' | 'production';
  database: {
    type: 'memory' | 'file' | 'real';
    config: Record<string, any>;
  };
  services: {
    taskManager: boolean;
    learningService: boolean;
    automationEngine: boolean;
    realTimeSync: boolean;
  };
  mocking: {
    enabled: boolean;
    level: 'none' | 'partial' | 'full';
  };
  isolation: boolean;
  cleanup: boolean;
}

/**
 * Mock service definitions
 */
export interface MockService {
  name: string;
  type: 'task_manager' | 'learning_service' | 'automation_engine' | 'api_client' | 'database';
  methods: MockMethod[];
  state: Record<string, any>;
  behavior: MockBehavior;
}

export interface MockMethod {
  name: string;
  parameters: MockParameter[];
  returnValue: any;
  sideEffects?: MockSideEffect[];
  callCount: number;
  callHistory: MockCall[];
}

export interface MockParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  validation?: (value: any) => boolean;
}

export interface MockBehavior {
  delay?: number;
  errorRate?: number;
  errorTypes?: string[];
  responseVariation?: boolean;
  stateChanges?: Record<string, any>;
}

export interface MockCall {
  timestamp: string;
  parameters: Record<string, any>;
  returnValue: any;
  duration: number;
  error?: string;
}

export interface MockSideEffect {
  type: 'state_change' | 'event_emission' | 'external_call';
  target: string;
  action: string;
  parameters: Record<string, any>;
}

/**
 * Test data management
 */
export interface TestDataSet {
  id: string;
  name: string;
  description: string;
  type: 'tasks' | 'users' | 'automation_rules' | 'learning_data' | 'mixed';
  data: Record<string, any>;
  fixtures: TestFixture[];
  generators: DataGenerator[];
  cleanup: boolean;
}

export interface TestFixture {
  id: string;
  name: string;
  type: string;
  data: any;
  dependencies: string[];
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
}

export interface DataGenerator {
  type: string;
  count: number;
  template: Record<string, any>;
  randomization: RandomizationConfig;
  constraints: Record<string, any>;
}

export interface RandomizationConfig {
  seed?: number;
  fields: Record<string, RandomFieldConfig>;
}

export interface RandomFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'uuid';
  min?: number;
  max?: number;
  options?: any[];
  pattern?: string;
  format?: string;
}

/**
 * Test assertions
 */
export interface TestAssertion {
  id: string;
  type: AssertionType;
  description: string;
  expected: any;
  actual?: any;
  operator: AssertionOperator;
  message?: string;
  metadata?: Record<string, any>;
}

export type AssertionType = 
  | 'equality'
  | 'inequality'
  | 'contains'
  | 'type_check'
  | 'range_check'
  | 'pattern_match'
  | 'custom';

export type AssertionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'matches'
  | 'not_matches'
  | 'is_type'
  | 'is_null'
  | 'is_undefined'
  | 'is_truthy'
  | 'is_falsy'
  | 'custom';

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  expected: any;
  actual: any;
  message: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Test coverage tracking
 */
export interface TestCoverage {
  overall: CoverageMetrics;
  files: Record<string, FileCoverage>;
  functions: Record<string, FunctionCoverage>;
  branches: Record<string, BranchCoverage>;
  statements: Record<string, StatementCoverage>;
}

export interface CoverageMetrics {
  percentage: number;
  covered: number;
  total: number;
  threshold: number;
  passed: boolean;
}

export interface FileCoverage extends CoverageMetrics {
  path: string;
  lines: Record<number, boolean>;
  functions: string[];
  branches: string[];
}

export interface FunctionCoverage extends CoverageMetrics {
  name: string;
  file: string;
  startLine: number;
  endLine: number;
  calls: number;
}

export interface BranchCoverage extends CoverageMetrics {
  file: string;
  line: number;
  condition: string;
  trueCovered: boolean;
  falseCovered: boolean;
}

export interface StatementCoverage extends CoverageMetrics {
  file: string;
  line: number;
  statement: string;
  executed: boolean;
}

/**
 * Performance testing
 */
export interface PerformanceMetrics {
  responseTime: {
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    operationsPerSecond: number;
  };
  resource: {
    memoryUsage: number;
    cpuUsage: number;
    diskIO: number;
    networkIO: number;
  };
  errors: {
    count: number;
    rate: number;
    types: Record<string, number>;
  };
}

export interface LoadTestConfig {
  users: number;
  duration: number;
  rampUp: number;
  rampDown: number;
  scenarios: LoadTestScenario[];
  thresholds: PerformanceThresholds;
}

export interface LoadTestScenario {
  name: string;
  weight: number;
  steps: LoadTestStep[];
}

export interface LoadTestStep {
  action: string;
  parameters: Record<string, any>;
  delay?: number;
  validation?: TestAssertion[];
}

export interface PerformanceThresholds {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    minimum: number;
  };
  errorRate: {
    maximum: number;
  };
  resource: {
    memory: number;
    cpu: number;
  };
}

/**
 * Test reporting
 */
export interface TestReport {
  id: string;
  name: string;
  type: 'suite' | 'run' | 'coverage' | 'performance';
  timestamp: string;
  summary: TestSummary;
  results: TestSuiteResult[];
  coverage?: TestCoverage | undefined;
  performance?: PerformanceMetrics | undefined;
  trends: TestTrend[];
  recommendations: TestRecommendation[];
  metadata: Record<string, any>;
}

export interface TestSummary {
  totalSuites: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  successRate: number;
  coverage: number;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TestTrend {
  metric: string;
  period: string;
  values: Array<{
    timestamp: string;
    value: number;
  }>;
  trend: 'improving' | 'stable' | 'declining';
  change: number;
}

export interface TestRecommendation {
  type: 'coverage' | 'performance' | 'reliability' | 'maintenance';
  priority: TestPriority;
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

/**
 * Test framework interfaces
 */
export interface TestRunner {
  runSuite(suiteId: string, options?: TestRunOptions): Promise<TestSuiteResult>;
  runTest(testId: string, options?: TestRunOptions): Promise<TestResult>;
  runAll(options?: TestRunOptions): Promise<TestReport>;
  stop(): Promise<void>;
  getStatus(): TestRunnerStatus;
}

export interface TestRunOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  retries?: number;
  tags?: string[];
  environment?: string;
  coverage?: boolean;
  performance?: boolean;
  verbose?: boolean;
}

export interface TestRunnerStatus {
  running: boolean;
  currentSuite?: string | undefined;
  currentTest?: string | undefined;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  startTime?: string | undefined;
  estimatedCompletion?: string | undefined;
}

/**
 * Test utilities and helpers
 */
export interface TestLogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  getLogs(): TestLog[];
  clear(): void;
}

export interface TestLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface PerformanceTracker {
  start(operation: string): void;
  end(operation: string): number;
  mark(name: string): void;
  measure(name: string, startMark: string, endMark: string): number;
  getMetrics(): PerformanceMetrics;
  reset(): void;
}

/**
 * Type definitions for test functions
 */
export type TestFunction = (context: TestContext) => Promise<void> | void;
export type TestSetup = (context: TestContext) => Promise<void> | void;
export type TestTeardown = (context: TestContext) => Promise<void> | void;

/**
 * Registry interfaces
 */
export interface MockServiceRegistry {
  register(service: MockService): void;
  get(name: string): MockService | undefined;
  getAll(): MockService[];
  clear(): void;
}

export interface TestDataRegistry {
  register(dataset: TestDataSet): void;
  get(name: string): TestDataSet | undefined;
  generate(type: string, count: number): any[];
  clear(): void;
}

export interface AssertionRegistry {
  assert(assertion: TestAssertion): AssertionResult;
  assertEquals(actual: any, expected: any, message?: string): AssertionResult;
  assertNotEquals(actual: any, expected: any, message?: string): AssertionResult;
  assertTrue(value: any, message?: string): AssertionResult;
  assertFalse(value: any, message?: string): AssertionResult;
  assertNull(value: any, message?: string): AssertionResult;
  assertNotNull(value: any, message?: string): AssertionResult;
  assertType(value: any, type: string, message?: string): AssertionResult;
  assertContains(container: any, item: any, message?: string): AssertionResult;
  assertMatches(value: string, pattern: RegExp, message?: string): AssertionResult;
  custom(predicate: (value: any) => boolean, value: any, message?: string): AssertionResult;
  getResults(): AssertionResult[];
  clear(): void;
  getPassedCount(): number;
  getFailedCount(): number;
}

/**
 * Error types
 */
export interface TestError {
  type: 'assertion' | 'timeout' | 'setup' | 'teardown' | 'runtime' | 'system';
  message: string;
  stack?: string | undefined;
  code?: string;
  metadata?: Record<string, any>;
}

/**
 * Mock data interfaces
 */
export interface TestMockData {
  tasks: Task[];
  users: TestUser[];
  automationEvents: AutomationEvent[];
  realTimeEvents: RealTimeEvent[];
  responses: MockResponse[];
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface MockResponse {
  endpoint: string;
  method: string;
  status: number;
  data: any;
  headers?: Record<string, string>;
  delay?: number;
}

/**
 * Component-specific test interfaces
 */
export interface TaskManagerTestSuite {
  testCreateTask(): Promise<void>;
  testUpdateTask(): Promise<void>;
  testDeleteTask(): Promise<void>;
  testQueryTasks(): Promise<void>;
  testTaskHierarchy(): Promise<void>;
  testTaskValidation(): Promise<void>;
}

export interface LearningServiceTestSuite {
  testEstimationPrediction(): Promise<void>;
  testComplexityAssessment(): Promise<void>;
  testLearningCycle(): Promise<void>;
  testFeedbackProcessing(): Promise<void>;
  testModelAccuracy(): Promise<void>;
}

export interface AutomationEngineTestSuite {
  testRuleExecution(): Promise<void>;
  testWorkflowOrchestration(): Promise<void>;
  testEventProcessing(): Promise<void>;
  testScheduling(): Promise<void>;
  testNotifications(): Promise<void>;
}

export interface RealTimeSyncTestSuite {
  testWebSocketConnection(): Promise<void>;
  testEventBroadcasting(): Promise<void>;
  testConflictResolution(): Promise<void>;
  testPresenceTracking(): Promise<void>;
  testDashboardUpdates(): Promise<void>;
}

export interface APITestSuite {
  testEndpointAvailability(): Promise<void>;
  testRequestValidation(): Promise<void>;
  testResponseFormat(): Promise<void>;
  testErrorHandling(): Promise<void>;
  testAuthentication(): Promise<void>;
  testRateLimit(): Promise<void>;
} 
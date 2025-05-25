/**
 * Deployment and Integration Testing Type Definitions
 * 
 * Comprehensive type definitions for deployment preparation, integration testing,
 * and production environment configuration.
 */

import { TestSuite, TestResult, PerformanceMetrics } from './TestingTypes';
import { Task, TaskOperationResult } from './TaskTypes';

/**
 * Integration test types
 */
export type IntegrationTestType = 'end_to_end' | 'system' | 'api' | 'workflow' | 'performance' | 'security';
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'testing';
export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';

/**
 * Integration test suite configuration
 */
export interface IntegrationTestSuite {
  id: string;
  name: string;
  description: string;
  type: IntegrationTestType;
  environment: DeploymentEnvironment;
  scenarios: IntegrationTestScenario[];
  setup: IntegrationTestSetup;
  teardown: IntegrationTestTeardown;
  timeout: number;
  retries: number;
  parallel: boolean;
  dependencies: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Integration test scenario
 */
export interface IntegrationTestScenario {
  id: string;
  name: string;
  description: string;
  steps: IntegrationTestStep[];
  expectedOutcome: any;
  validations: IntegrationValidation[];
  timeout: number;
  retries: number;
  tags: string[];
}

/**
 * Integration test step
 */
export interface IntegrationTestStep {
  id: string;
  name: string;
  action: IntegrationTestAction;
  parameters: Record<string, any>;
  expectedResult?: any;
  timeout: number;
  retries: number;
  continueOnFailure: boolean;
}

/**
 * Integration test actions
 */
export interface IntegrationTestAction {
  type: 'api_call' | 'database_operation' | 'websocket_event' | 'file_operation' | 'system_command' | 'wait' | 'validation';
  target: string;
  method?: string;
  payload?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Integration test validation
 */
export interface IntegrationValidation {
  type: 'response_validation' | 'database_validation' | 'file_validation' | 'performance_validation' | 'security_validation';
  target: string;
  criteria: ValidationCriteria;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationCriteria {
  statusCode?: number;
  responseTime?: number;
  dataIntegrity?: boolean;
  securityCompliance?: boolean;
  performanceThreshold?: PerformanceThreshold;
  customValidation?: (result: any) => boolean;
}

export interface PerformanceThreshold {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * Integration test setup and teardown
 */
export interface IntegrationTestSetup {
  database: DatabaseSetup;
  services: ServiceSetup[];
  environment: EnvironmentSetup;
  testData: TestDataSetup;
  mocks: MockSetup[];
}

export interface IntegrationTestTeardown {
  cleanupDatabase: boolean;
  stopServices: boolean;
  removeTestData: boolean;
  resetEnvironment: boolean;
  generateReport: boolean;
}

export interface DatabaseSetup {
  type: 'sqlite' | 'postgresql' | 'mysql' | 'memory';
  connectionString?: string;
  migrations: string[];
  seedData: string[];
  cleanup: boolean;
}

export interface ServiceSetup {
  name: string;
  type: 'internal' | 'external' | 'mock';
  config: Record<string, any>;
  healthCheck: HealthCheck;
  dependencies: string[];
}

export interface EnvironmentSetup {
  variables: Record<string, string>;
  configFiles: ConfigFile[];
  ports: PortConfiguration[];
  volumes: VolumeConfiguration[];
}

export interface TestDataSetup {
  fixtures: string[];
  generators: DataGeneratorConfig[];
  cleanup: boolean;
}

export interface MockSetup {
  service: string;
  endpoints: MockEndpoint[];
  behavior: MockBehavior;
}

export interface MockEndpoint {
  path: string;
  method: string;
  response: any;
  statusCode: number;
  delay?: number;
  headers?: Record<string, string>;
}

export interface MockBehavior {
  errorRate: number;
  latency: LatencyConfig;
  failureScenarios: FailureScenario[];
}

/**
 * Deployment configuration
 */
export interface DeploymentConfiguration {
  id: string;
  name: string;
  environment: DeploymentEnvironment;
  version: string;
  infrastructure: InfrastructureConfig;
  application: ApplicationConfig;
  database: DatabaseConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  scaling: ScalingConfig;
  backup: BackupConfig;
  createdAt: string;
  updatedAt: string;
}

export interface InfrastructureConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'docker' | 'kubernetes' | 'local';
  region?: string;
  instances: InstanceConfig[];
  networking: NetworkConfig;
  storage: StorageConfig;
  loadBalancer?: LoadBalancerConfig;
}

export interface InstanceConfig {
  type: string;
  count: number;
  cpu: string;
  memory: string;
  storage: string;
  os: string;
  tags: Record<string, string>;
}

export interface NetworkConfig {
  vpc?: string;
  subnets: string[];
  securityGroups: SecurityGroup[];
  ports: PortConfiguration[];
}

export interface SecurityGroup {
  name: string;
  rules: SecurityRule[];
}

export interface SecurityRule {
  type: 'ingress' | 'egress';
  protocol: string;
  port: number | string;
  source: string;
  description: string;
}

export interface PortConfiguration {
  internal: number;
  external: number;
  protocol: 'tcp' | 'udp';
  description: string;
}

export interface StorageConfig {
  type: 'local' | 'network' | 'cloud';
  size: string;
  backup: boolean;
  encryption: boolean;
  mountPath: string;
}

export interface LoadBalancerConfig {
  type: 'application' | 'network';
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash';
  healthCheck: HealthCheck;
  sslTermination: boolean;
}

export interface ApplicationConfig {
  image: string;
  tag: string;
  replicas: number;
  resources: ResourceConfig;
  environment: Record<string, string>;
  volumes: VolumeConfiguration[];
  healthCheck: HealthCheck;
  readinessProbe: ReadinessProbe;
  livenessProbe: LivenessProbe;
}

export interface ResourceConfig {
  requests: {
    cpu: string;
    memory: string;
  };
  limits: {
    cpu: string;
    memory: string;
  };
}

export interface VolumeConfiguration {
  name: string;
  type: 'configMap' | 'secret' | 'persistentVolume' | 'hostPath';
  mountPath: string;
  readOnly: boolean;
}

export interface HealthCheck {
  path: string;
  port: number;
  interval: number;
  timeout: number;
  retries: number;
  initialDelay: number;
}

export interface ReadinessProbe extends HealthCheck {
  successThreshold: number;
}

export interface LivenessProbe extends HealthCheck {
  failureThreshold: number;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl: boolean;
  poolSize: number;
  timeout: number;
  backup: BackupConfig;
  migrations: MigrationConfig;
}

export interface MigrationConfig {
  enabled: boolean;
  path: string;
  autoRun: boolean;
  rollbackEnabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricsConfig;
  logging: LoggingConfig;
  alerting: AlertingConfig;
  tracing: TracingConfig;
}

export interface MetricsConfig {
  provider: 'prometheus' | 'datadog' | 'newrelic' | 'custom';
  endpoint: string;
  interval: number;
  retention: string;
  dashboards: DashboardConfig[];
}

export interface DashboardConfig {
  name: string;
  type: 'grafana' | 'datadog' | 'custom';
  config: Record<string, any>;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  output: 'console' | 'file' | 'remote';
  retention: string;
  aggregation: LogAggregationConfig;
}

export interface LogAggregationConfig {
  enabled: boolean;
  provider: 'elasticsearch' | 'splunk' | 'datadog' | 'custom';
  endpoint: string;
  index: string;
}

export interface AlertingConfig {
  enabled: boolean;
  provider: 'pagerduty' | 'slack' | 'email' | 'webhook';
  rules: AlertRule[];
  escalation: EscalationPolicy;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: string;
}

export interface EscalationLevel {
  delay: string;
  channels: string[];
}

export interface TracingConfig {
  enabled: boolean;
  provider: 'jaeger' | 'zipkin' | 'datadog' | 'custom';
  endpoint: string;
  samplingRate: number;
}

export interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  firewall: FirewallConfig;
  compliance: ComplianceConfig;
}

export interface AuthenticationConfig {
  provider: 'jwt' | 'oauth' | 'saml' | 'ldap';
  config: Record<string, any>;
  sessionTimeout: number;
  multiFactorAuth: boolean;
}

export interface AuthorizationConfig {
  rbac: boolean;
  policies: PolicyConfig[];
  defaultRole: string;
}

export interface PolicyConfig {
  name: string;
  rules: string[];
  resources: string[];
  actions: string[];
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  algorithm: string;
  keyManagement: KeyManagementConfig;
}

export interface KeyManagementConfig {
  provider: 'aws-kms' | 'azure-keyvault' | 'hashicorp-vault' | 'local';
  rotation: boolean;
  rotationInterval: string;
}

export interface FirewallConfig {
  enabled: boolean;
  rules: FirewallRule[];
  defaultPolicy: 'allow' | 'deny';
}

export interface FirewallRule {
  name: string;
  action: 'allow' | 'deny';
  source: string;
  destination: string;
  port: number | string;
  protocol: string;
}

export interface ComplianceConfig {
  standards: string[];
  auditing: boolean;
  dataRetention: string;
  privacyControls: PrivacyControl[];
}

export interface PrivacyControl {
  type: 'data_masking' | 'data_encryption' | 'access_logging' | 'data_deletion';
  config: Record<string, any>;
}

export interface ScalingConfig {
  autoScaling: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpPolicy: ScalingPolicy;
  scaleDownPolicy: ScalingPolicy;
}

export interface ScalingPolicy {
  threshold: number;
  duration: string;
  cooldown: string;
  step: number;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retention: string;
  storage: BackupStorageConfig;
  encryption: boolean;
  compression: boolean;
}

export interface BackupStorageConfig {
  type: 'local' | 's3' | 'gcs' | 'azure-blob';
  location: string;
  credentials: Record<string, string>;
}

/**
 * CI/CD Pipeline configuration
 */
export interface CICDPipeline {
  id: string;
  name: string;
  description: string;
  triggers: PipelineTrigger[];
  stages: PipelineStage[];
  environment: Record<string, string>;
  notifications: NotificationConfig[];
  artifacts: ArtifactConfig;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineTrigger {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'webhook';
  config: Record<string, any>;
  branches?: string[];
  paths?: string[];
}

export interface PipelineStage {
  name: string;
  type: 'build' | 'test' | 'security' | 'deploy' | 'notify';
  steps: PipelineStep[];
  condition?: string;
  parallel: boolean;
  timeout: number;
  retries: number;
}

export interface PipelineStep {
  name: string;
  action: string;
  parameters: Record<string, any>;
  condition?: string;
  timeout: number;
  retries: number;
  continueOnFailure: boolean;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  events: string[];
}

export interface ArtifactConfig {
  enabled: boolean;
  retention: string;
  storage: ArtifactStorageConfig;
  types: string[];
}

export interface ArtifactStorageConfig {
  type: 'local' | 's3' | 'artifactory' | 'nexus';
  location: string;
  credentials: Record<string, string>;
}

/**
 * Deployment execution
 */
export interface DeploymentExecution {
  id: string;
  configId: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: DeploymentStep[];
  rollback?: RollbackConfig;
  logs: DeploymentLog[];
  metrics: DeploymentMetrics;
  createdBy: string;
  approvedBy?: string;
}

export interface DeploymentStep {
  name: string;
  type: 'preparation' | 'deployment' | 'verification' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: string;
  error?: string;
}

export interface RollbackConfig {
  enabled: boolean;
  automatic: boolean;
  triggers: RollbackTrigger[];
  strategy: 'immediate' | 'gradual' | 'blue_green';
}

export interface RollbackTrigger {
  type: 'error_rate' | 'response_time' | 'health_check' | 'manual';
  threshold: number;
  duration: string;
}

export interface DeploymentLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  component: string;
  metadata?: Record<string, any>;
}

export interface DeploymentMetrics {
  deploymentTime: number;
  successRate: number;
  rollbackRate: number;
  mttr: number; // Mean Time To Recovery
  mtbf: number; // Mean Time Between Failures
  performanceImpact: PerformanceImpact;
}

export interface PerformanceImpact {
  responseTime: {
    before: number;
    after: number;
    change: number;
  };
  throughput: {
    before: number;
    after: number;
    change: number;
  };
  errorRate: {
    before: number;
    after: number;
    change: number;
  };
}

/**
 * Load testing configuration
 */
export interface LoadTestConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'load' | 'stress' | 'spike' | 'volume' | 'endurance';
  scenarios: LoadTestScenario[];
  environment: DeploymentEnvironment;
  duration: number;
  rampUp: number;
  rampDown: number;
  thresholds: LoadTestThresholds;
  monitoring: LoadTestMonitoring;
  createdAt: string;
  updatedAt: string;
}

export interface LoadTestScenario {
  name: string;
  weight: number;
  users: UserLoadPattern;
  requests: RequestPattern[];
  thinkTime: ThinkTimeConfig;
}

export interface UserLoadPattern {
  type: 'constant' | 'ramp' | 'spike' | 'step';
  count: number;
  duration: number;
  rampTime?: number;
}

export interface RequestPattern {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  weight: number;
  validation: RequestValidation[];
}

export interface RequestValidation {
  type: 'status_code' | 'response_time' | 'content' | 'header';
  criteria: any;
  severity: 'error' | 'warning';
}

export interface ThinkTimeConfig {
  min: number;
  max: number;
  distribution: 'uniform' | 'normal' | 'exponential';
}

export interface LoadTestThresholds {
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
  availability: {
    minimum: number;
  };
}

export interface LoadTestMonitoring {
  metrics: string[];
  dashboards: string[];
  alerts: LoadTestAlert[];
}

export interface LoadTestAlert {
  name: string;
  condition: string;
  threshold: number;
  action: 'stop_test' | 'notify' | 'continue';
}

/**
 * Configuration file types
 */
export interface ConfigFile {
  name: string;
  path: string;
  content: string;
  format: 'json' | 'yaml' | 'toml' | 'env' | 'ini';
  template: boolean;
  variables: Record<string, string>;
}

export interface DataGeneratorConfig {
  type: string;
  count: number;
  template: Record<string, any>;
  relationships: RelationshipConfig[];
}

export interface RelationshipConfig {
  field: string;
  target: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
}

export interface LatencyConfig {
  min: number;
  max: number;
  distribution: 'uniform' | 'normal' | 'exponential';
}

export interface FailureScenario {
  name: string;
  probability: number;
  type: 'timeout' | 'error' | 'slow_response' | 'connection_refused';
  config: Record<string, any>;
}

/**
 * Integration test results
 */
export interface IntegrationTestResult {
  suiteId: string;
  scenarioId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  startTime: string;
  endTime: string;
  duration: number;
  steps: IntegrationStepResult[];
  validations: ValidationResult[];
  performance: PerformanceMetrics;
  logs: string[];
  screenshots?: string[];
  artifacts?: string[];
}

export interface IntegrationStepResult {
  stepId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  startTime: string;
  endTime: string;
  duration: number;
  input: any;
  output: any;
  error?: string;
}

export interface ValidationResult {
  validationId: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  expected: any;
  actual: any;
  severity: 'error' | 'warning' | 'info';
}

/**
 * System health and readiness
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: ComponentHealth[];
  overall: HealthMetrics;
  dependencies: DependencyHealth[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

export interface DependencyHealth {
  name: string;
  type: 'database' | 'api' | 'service' | 'external';
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  endpoint?: string;
} 
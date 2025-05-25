// Core Types for AAI System Enhancement
export interface ProjectContext {
  id: string;
  name: string;
  path: string;
  gitUrl?: string;
  branch: string;
  language?: string;
  framework?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  contextData?: ContextData | EnrichedContext;
  settings?: ProjectSettings;
  suggestions?: ContextSuggestion[];
  confidence?: number;
}

export interface ProjectSettings {
  autoSave: boolean;
  contextRetention: number;
  aiAssistance: boolean;
  automationLevel: 'low' | 'medium' | 'high';
  memorySettings: MemorySettings;
}

export interface MemorySettings {
  maxEntries: number;
  retentionDays: number;
  vectorDimensions: number;
  similarityThreshold: number;
}

export interface ContextData {
  filePath: string;
  cursorPosition: Position;
  selectedText?: string;
  openFiles: string[];
  recentFiles: string[];
  workspaceState: WorkspaceState;
  timestamp: Date;
}

export interface EnrichedContext extends ContextData {
  patterns: ContextPattern[];
  relationships: FileRelationship[];
  aiInsights: AIInsight[];
}

export interface Position {
  line: number;
  character: number;
}

export interface WorkspaceState {
  activeEditor?: string;
  visibleEditors: string[];
  focusedPanel?: string;
  sidebarVisible: boolean;
  panelVisible: boolean;
  terminalVisible: boolean;
}

export interface ContextSuggestion {
  type: 'file' | 'action' | 'automation';
  title: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface ContextPattern {
  type: string;
  confidence: number;
  description: string;
  metadata: Record<string, any>;
}

export interface FileRelationship {
  sourceFile: string;
  targetFile: string;
  type: 'import' | 'export' | 'reference' | 'semantic';
  strength: number;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata: Record<string, any>;
}

// Memory Types
export type MemoryType = 'context' | 'code' | 'conversation' | 'pattern';

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  projectId: string;
  embeddingId?: string | undefined;
  filePath?: string | undefined;
  language?: string | undefined;
  framework?: string | undefined;
  tags: string[];
  importance: number;
  accessCount: number;
  userFeedback?: Record<string, any> | undefined;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
}

export interface MemoryQuery {
  semanticQuery?: string;
  textQuery?: string;
  filters?: {
    projectId?: string;
    type?: MemoryType;
    filePath?: string;
    language?: string;
    framework?: string;
    tags?: string[];
    minImportance?: number;
  };
  limit?: number;
  threshold?: number;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
  relevanceReason: string;
}

export interface MemoryAnalytics {
  totalMemories: number;
  memoryByType: Record<MemoryType, number>;
  averageImportance: number;
  topTags: Array<{ tag: string; count: number }>;
  cacheSize: number;
  cacheHitRate: number;
}

// Automation Types
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  pattern: AutomationPattern;
  template: AutomationTemplate;
  isActive: boolean;
  executionCount: number;
  successCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationPattern {
  type: 'file_pattern' | 'context_pattern' | 'user_action';
  conditions: Record<string, any>;
  confidence: number;
}

export interface AutomationTemplate {
  type: 'code_generation' | 'file_creation' | 'command_execution';
  content: string;
  variables: Record<string, any>;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  projectId?: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface PerformanceMetric {
  id: string;
  operationName: string;
  duration: number;
  memoryDelta: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  userId?: string;
  projectId?: string;
  sessionData: Record<string, any>;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface LearningPattern {
  id: string;
  projectId?: string;
  patternType: string;
  patternData: Record<string, any>;
  frequency: number;
  confidence: number;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export class AAIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, any> | undefined;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    metadata?: Record<string, any> | undefined
  ) {
    super(message);
    this.name = 'AAIError';
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }
}

export class ValidationError extends AAIError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, metadata);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AAIError {
  constructor(resource: string, id: string, metadata?: Record<string, any>) {
    super(`${resource} with id '${id}' not found`, 'NOT_FOUND_ERROR', 404, metadata);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends AAIError {
  constructor(message: string = 'Authentication failed', metadata?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, metadata);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AAIError {
  constructor(message: string = 'Access denied', metadata?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, metadata);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends AAIError {
  constructor(message: string = 'Rate limit exceeded', metadata?: Record<string, any>) {
    super(message, 'RATE_LIMIT_ERROR', 429, metadata);
    this.name = 'RateLimitError';
  }
}

// API Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    metadata?: Record<string, any>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Configuration Types
export interface AAIConfig {
  database: {
    path: string;
    maxConnections: number;
    timeout: number;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'local';
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  vector: {
    provider: 'pinecone' | 'weaviate' | 'local';
    apiKey?: string;
    environment?: string;
    indexName?: string;
    dimensions: number;
  };
  server: {
    port: number;
    host: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
    console: boolean;
  };
  features: {
    contextManagement: boolean;
    memorySystem: boolean;
    automation: boolean;
    analytics: boolean;
    realTimeSync: boolean;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export type AsyncFunction<T = any, R = any> = (data: T) => Promise<R>;

export type SyncFunction<T = any, R = any> = (data: T) => R; 
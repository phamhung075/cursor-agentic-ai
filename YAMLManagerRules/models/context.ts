/**
 * Context Models
 *
 * Defines the structure and types for project context detection.
 */

/**
 * Technology type with confidence score
 */
export interface DetectedTechnology {
  /** Name of the technology */
  name: string;
  /** Version of the technology (if available) */
  version?: string;
  /** Confidence score (0-1) for how certain we are about the detection */
  confidence: number;
  /** Additional details or configuration */
  details?: Record<string, any>;
}

/**
 * Project types that can be detected
 */
export enum ProjectType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  LIBRARY = 'library',
  CLI = 'cli',
  MOBILE = 'mobile',
  UNKNOWN = 'unknown'
}

/**
 * Technology categories
 */
export enum TechnologyCategory {
  LANGUAGE = 'language',
  FRAMEWORK = 'framework',
  LIBRARY = 'library',
  BUILD_TOOL = 'build_tool',
  TEST_TOOL = 'test_tool',
  LINTER = 'linter',
  FORMATTER = 'formatter',
  DATABASE = 'database',
  BUNDLER = 'bundler',
  STATE_MANAGEMENT = 'state_management',
  UI_LIBRARY = 'ui_library',
  API = 'api',
  OTHER = 'other'
}

/**
 * File type information detected in project
 */
export interface DetectedFileType {
  /** File extension or type (e.g., '.ts', '.jsx', 'yaml') */
  type: string;
  /** Number of files of this type */
  count: number;
  /** Percentage of this file type in the project */
  percentage: number;
}

/**
 * Project context detected from analysis
 */
export interface ProjectContext {
  /** Path to the project root */
  projectPath: string;
  /** Type of project */
  projectType: ProjectType;
  /** Confidence in the project type detection (0-1) */
  projectTypeConfidence: number;
  /** Detected technologies grouped by category */
  technologies: Record<TechnologyCategory, DetectedTechnology[]>;
  /** File types statistics */
  fileTypes: DetectedFileType[];
  /** Detected dependencies from package.json */
  dependencies?: Record<string, string>;
  /** Detected dev dependencies from package.json */
  devDependencies?: Record<string, string>;
  /** Configuration files found in the project */
  configFiles: string[];
  /** Last time this context was updated */
  lastUpdated: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Options for context detection
 */
export interface ContextDetectionOptions {
  /** Whether to use caching */
  useCache?: boolean;
  /** Max depth for directory recursion */
  maxDepth?: number;
  /** Whether to include dev dependencies in analysis */
  includeDevDependencies?: boolean;
  /** List of directories to exclude from scanning */
  excludeDirs?: string[];
  /** Custom detection strategies to use */
  customStrategies?: string[];
  /** Whether to analyze file types statistics */
  analyzeFileTypes?: boolean;
}

/**
 * Default context detection options
 */
export const defaultContextDetectionOptions: ContextDetectionOptions = {
  useCache: true,
  maxDepth: 5,
  includeDevDependencies: true,
  excludeDirs: ['node_modules', 'dist', 'build', 'coverage', '.git'],
  analyzeFileTypes: true
};

/**
 * Result of a context detection operation
 */
export interface ContextDetectionResult {
  /** The detected context */
  context: ProjectContext;
  /** Whether the context was loaded from cache */
  fromCache: boolean;
  /** Time taken for detection in milliseconds */
  detectionTimeMs?: number;
  /** Any warnings during detection */
  warnings?: string[];
}

/**
 * Strategy result when detecting a specific aspect of context
 */
export interface DetectionStrategyResult {
  /** Technologies detected by this strategy */
  technologies?: DetectedTechnology[];
  /** Project type information if detected */
  projectType?: {
    type: ProjectType;
    confidence: number;
  };
  /** Configuration files detected */
  configFiles?: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

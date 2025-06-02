/**
 * Models Index
 *
 * Exports all model interfaces and types used throughout the application.
 */

/**
 * ProjectContext interface
 * Represents the multi-dimensional context of a project
 */
export interface ProjectContext {
  // Project identification
  projectId: string;
  projectPath: string;

  // Multi-dimensional analysis
  developmentPhase: DevelopmentPhase;
  technologies: Technology[];
  projectDomain?: ProjectDomain;
  projectScale?: ProjectScale;
  teamStructure?: TeamStructure;
  methodology?: DevelopmentMethodology;

  // Analysis metadata
  fileSystem?: FileSystemInfo;
  dependencies?: DependencyInfo;
  codePatterns?: CodePattern[];
  configurations?: ConfigurationInfo[];
  gitInfo?: GitRepositoryInfo;

  // Detection metadata
  detectionTimestamp: number;
  confidence: number;
  analysisVersion: string;
}

/**
 * Rule interface
 * Defines the structure of a rule definition
 */
export interface Rule {
  metadata: RuleMetadata;
  conditions: RuleConditions;
  compatibility: RuleCompatibility;
  cursor_rules: CursorConfiguration;
  dependencies?: RuleDependency[];
  file_structure?: FileStructureTemplate;
  priority: number;
  weight: number;
  confidence?: number;
}

/**
 * Rule Metadata interface
 */
export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  author: string;
  created: string;
  updated: string;
}

/**
 * Rule Conditions interface
 */
export interface RuleConditions {
  phase?: DevelopmentPhase[];
  technologies?: Technology[];
  files_present?: string[];
  dependencies?: string[];
  patterns?: string[];
  project_type?: string[];
}

/**
 * Rule Compatibility interface
 */
export interface RuleCompatibility {
  conflicts_with?: string[];
  requires?: string[];
  enhances?: string[];
  replaces?: string[];
}

// Define enums and other required types
export enum DevelopmentPhase {
  CONCEPTION = 'conception',
  RESEARCH = 'research',
  SETUP = 'setup',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance',
  SCALING = 'scaling'
}

// Placeholder interfaces to be expanded later
export type Technology = string;
export type ProjectDomain = string;
export type ProjectScale = string;
export type TeamStructure = string;
export type DevelopmentMethodology = string;
export interface FileSystemInfo {}
export interface DependencyInfo {}
export interface CodePattern {}
export interface ConfigurationInfo {}
export interface GitRepositoryInfo {}
export interface CursorConfiguration {}
export interface RuleDependency {}
export interface FileStructureTemplate {}

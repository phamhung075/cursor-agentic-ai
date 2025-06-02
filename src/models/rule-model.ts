/**
 * Complex Rule System - Enhanced Rule Data Model
 *
 * This file defines the core interfaces and types for the Complex Rule System,
 * implementing the enhanced rule data model that supports complex metadata,
 * relationships, conditions, and semantic patterns.
 */

/**
 * Base interface for rule relationships defining how rules are connected
 */
export interface RuleRelation {
  /** Type of relationship (dependency, extension, etc.) */
  type: 'dependency' | 'extension' | 'override' | 'composition';
  /** Target rule identifier */
  targetRuleId: string;
  /** Optional properties specific to the relationship type */
  properties?: Record<string, any>;
}

/**
 * Interface for rule conditions that determine when rules should apply
 */
export interface RuleCondition {
  /** Type of condition */
  type: 'filePattern' | 'contextMatch' | 'codePattern' | 'astPattern' | 'custom';
  /** Expression that defines the condition */
  expression: string;
  /** Whether the condition is negated */
  negate?: boolean;
  /** Additional metadata for the condition */
  metadata?: Record<string, any>;
}

/**
 * Interface for rule parameters that allow for flexible rule application
 */
export interface RuleParameter {
  /** Name of the parameter */
  name: string;
  /** Type of the parameter */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Description of the parameter */
  description?: string;
  /** Default value for the parameter */
  defaultValue?: any;
  /** Whether the parameter is required */
  required?: boolean;
  /** Validation rules for the parameter */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Interface for rule sections that organize rule content
 */
export interface RuleSection {
  /** Unique identifier for the section */
  id: string;
  /** Title of the section */
  title: string;
  /** Content of the section */
  content: string;
  /** Order of the section */
  order?: number;
}

/**
 * Interface for semantic patterns that capture code meaning beyond syntax
 */
export interface SemanticPattern {
  /** Unique identifier for the pattern */
  id: string;
  /** Type of semantic pattern */
  type: 'functionCall' | 'variableUsage' | 'dataFlow' | 'controlFlow' | 'dependency' |
        'importExport' | 'classStructure' | 'typeUsage' | 'composite' | 'custom';
  /** Pattern definition */
  pattern: string;
  /** Pattern format (AST, regex, etc.) */
  format: 'ast' | 'regex' | 'jsonpath' | 'xpath' | 'graphquery' | 'custom';
  /** Language the pattern applies to */
  language?: string[];
  /** Additional metadata for the pattern */
  metadata?: Record<string, any>;
}

/**
 * Interface for rule validations that determine if code follows the rule
 */
export interface RuleValidation {
  /** Unique identifier for the validation */
  id: string;
  /** Description of what the validation checks */
  description: string;
  /** Severity of the validation (error, warning, info) */
  severity: 'error' | 'warning' | 'info';
  /** Validation logic reference */
  validationRef: string;
  /** Message to display when validation fails */
  message: string;
  /** Quick fix options */
  fixes?: {
    /** Description of the fix */
    description: string;
    /** Fix action reference */
    fixRef: string;
  }[];
}

/**
 * Interface for rule transformations that modify code
 */
export interface RuleTransformation {
  /** Unique identifier for the transformation */
  id: string;
  /** Description of what the transformation does */
  description: string;
  /** Transformation logic reference */
  transformRef: string;
  /** Whether the transformation requires user confirmation */
  requireConfirmation?: boolean;
  /** Whether the transformation should be applied automatically */
  autoApply?: boolean;
}

/**
 * Main interface for complex rules in the enhanced rule model
 */
export interface ComplexRule {
  /** Unique identifier for the rule */
  id: string;
  /** Rule metadata */
  metadata: {
    /** Human-readable description of the rule */
    description: string;
    /** File patterns the rule applies to */
    globs: string[];
    /** Whether the rule should always be applied */
    alwaysApply: boolean;
    /** Rule priority (higher number = higher priority) */
    priority: number;
    /** Rule category for organization */
    category: string;
    /** Relationships with other rules */
    relations: RuleRelation[];
    /** Conditions for rule application */
    conditions: RuleCondition[];
    /** Parameters for flexible application */
    parameters: RuleParameter[];
    /** Rule version */
    version: string;
    /** Tags for organizing and filtering rules */
    tags?: string[];
  };
  /** Content sections */
  sections: RuleSection[];
  /** Semantic patterns for code analysis */
  semanticPatterns: SemanticPattern[];
  /** Validations to check if code follows the rule */
  validations: RuleValidation[];
  /** Transformations to modify code */
  transformations: RuleTransformation[];
  /** Custom validator references */
  customValidators?: string[];
  /** Custom transformer references */
  customTransformers?: string[];
}

/**
 * Interface for rule validation issues
 */
export interface RuleValidationIssue {
  /** Rule that produced the issue */
  ruleId: string;
  /** Validation that produced the issue */
  validationId: string;
  /** File where the issue was found */
  filePath: string;
  /** Start position of the issue */
  start: { line: number; character: number };
  /** End position of the issue */
  end: { line: number; character: number };
  /** Severity of the issue */
  severity: 'error' | 'warning' | 'info';
  /** Message describing the issue */
  message: string;
  /** Available fixes for the issue */
  fixes?: {
    /** Description of the fix */
    description: string;
    /** Fix action reference */
    fixRef: string;
  }[];
  /** Code snippet where the issue was found */
  codeSnippet?: string;
}

/**
 * Interface for rule resolutions
 */
export interface RuleResolution {
  /** Issue the resolution addresses */
  issueId: string;
  /** Rule that produced the issue */
  ruleId: string;
  /** Type of resolution */
  type: 'fix' | 'ignore' | 'suppress';
  /** Fix reference */
  fixRef?: string;
  /** Reason for the resolution */
  reason?: string;
  /** Scope of the resolution */
  scope: 'line' | 'file' | 'project';
  /** File where the resolution applies */
  filePath: string;
}

/**
 * Interface for rule application results
 */
export interface RuleValidationResult {
  /** Issues found during validation */
  issues: RuleValidationIssue[];
  /** Rules that were applied */
  appliedRules: string[];
  /** Rules that were skipped */
  skippedRules: string[];
  /** Performance metrics */
  performance: {
    /** Total time spent */
    totalTime: number;
    /** Time spent parsing */
    parseTime: number;
    /** Time spent validating */
    validateTime: number;
    /** Time spent resolving */
    resolveTime: number;
  };
}

/**
 * Interface for fix reports
 */
export interface FixReport {
  /** Total number of issues */
  totalIssues: number;
  /** Number of issues fixed */
  fixedIssues: number;
  /** Number of issues ignored */
  ignoredIssues: number;
  /** Number of issues suppressed */
  suppressedIssues: number;
  /** Number of issues remaining */
  remainingIssues: number;
  /** List of files modified */
  modifiedFiles: string[];
  /** List of resolutions applied */
  appliedResolutions: RuleResolution[];
}

/**
 * Type for rule application options
 */
export interface RuleEngineOptions {
  /** Directories to include */
  include: string[];
  /** Directories to exclude */
  exclude?: string[];
  /** Whether to use incremental processing */
  incremental?: boolean;
  /** Maximum number of concurrent processes */
  concurrency?: number;
  /** Cache options */
  cache?: {
    /** Whether to enable caching */
    enabled: boolean;
    /** Cache location */
    location?: string;
    /** Maximum cache size */
    maxSize?: number;
  };
  /** Custom rule providers */
  ruleProviders?: string[];
  /** Custom parser options */
  parserOptions?: Record<string, any>;
}

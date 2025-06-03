/**
 * Rule Interpreter
 *
 * Core module for interpreting and applying rules based on context.
 */

import { Rule } from '../models/rule-schema';
import { logger } from '../utils/logger';

// Project context interface
export interface ProjectContext {
  projectPath: string;
  phase?: string[];
  technologies?: string[];
  filePatterns?: string[];
  dependencies?: Record<string, string>;
  projectType?: string[];
  [key: string]: unknown;
}

export interface RuleMatchResult {
  rule: Rule;
  matchScore: number;
  matchedConditions: string[];
  missingConditions: string[];
}

export interface RuleInterpreterOptions {
  /** Minimum match score threshold (0-1) */
  matchThreshold?: number;
  /** Apply rules with highest score first */
  prioritizeHighScores?: boolean;
  /** Throw error on application failure instead of logging */
  strict?: boolean;
}

const defaultOptions: RuleInterpreterOptions = {
  matchThreshold: 0.7,
  prioritizeHighScores: true,
  strict: false,
};

/**
 * Check if a rule matches the given context
 */
export function matchRule(rule: Rule, context: ProjectContext): RuleMatchResult {
  const matchedConditions: string[] = [];
  const missingConditions: string[] = [];
  let totalConditions = 0;

  // Skip rules without conditions
  if (!rule.conditions) {
    return {
      rule,
      matchScore: 0,
      matchedConditions: [],
      missingConditions: ['No conditions specified']
    };
  }

  // Check phase conditions
  if (rule.conditions.phase && rule.conditions.phase.length > 0) {
    totalConditions++;
    if (context.phase && rule.conditions.phase.some(phase => context.phase?.includes(phase))) {
      matchedConditions.push('phase');
    } else {
      missingConditions.push('phase');
    }
  }

  // Check technology conditions
  if (rule.conditions.technologies && rule.conditions.technologies.length > 0) {
    totalConditions++;
    if (context.technologies && rule.conditions.technologies.some(tech =>
      context.technologies?.includes(tech))) {
      matchedConditions.push('technologies');
    } else {
      missingConditions.push('technologies');
    }
  }

  // Check file pattern conditions
  if (rule.conditions.files_present && rule.conditions.files_present.length > 0) {
    totalConditions++;
    if (context.filePatterns && rule.conditions.files_present.some(pattern =>
      context.filePatterns?.includes(pattern))) {
      matchedConditions.push('files_present');
    } else {
      missingConditions.push('files_present');
    }
  }

  // Check dependency conditions
  if (rule.conditions.dependencies && rule.conditions.dependencies.length > 0) {
    totalConditions++;
    if (context.dependencies && rule.conditions.dependencies.some(dep =>
      Object.keys(context.dependencies || {}).includes(dep))) {
      matchedConditions.push('dependencies');
    } else {
      missingConditions.push('dependencies');
    }
  }

  // Check project type conditions
  if (rule.conditions.project_type && rule.conditions.project_type.length > 0) {
    totalConditions++;
    if (context.projectType && rule.conditions.project_type.some(type =>
      context.projectType?.includes(type))) {
      matchedConditions.push('project_type');
    } else {
      missingConditions.push('project_type');
    }
  }

  // Calculate match score
  const matchScore = totalConditions > 0 ? matchedConditions.length / totalConditions : 0;

  return {
    rule,
    matchScore,
    matchedConditions,
    missingConditions
  };
}

/**
 * Find matching rules from a rule set based on context
 */
export function findMatchingRules(
  rules: Rule[],
  context: ProjectContext,
  options: RuleInterpreterOptions = {}
): RuleMatchResult[] {
  const opts = { ...defaultOptions, ...options };
  const matches: RuleMatchResult[] = [];

  for (const rule of rules) {
    const matchResult = matchRule(rule, context);

    // Only include rules that meet the threshold
    if (matchResult.matchScore >= (opts.matchThreshold || 0)) {
      matches.push(matchResult);
    }
  }

  // Sort by match score if requested
  if (opts.prioritizeHighScores) {
    matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  return matches;
}

/**
 * Apply a rule to generate cursor rules configuration
 */
export function applyRule(rule: Rule): Record<string, unknown> {
  // Extract cursor_rules section from the rule
  if (!rule.cursor_rules) {
    return {};
  }

  return rule.cursor_rules;
}

/**
 * Merge multiple rule configurations into a single configuration
 */
export function mergeRuleConfigurations(
  configs: Record<string, unknown>[]
): Record<string, unknown> {
  // Simple deep merge for now
  const result: Record<string, unknown> = {};

  for (const config of configs) {
    // Merge each configuration into the result
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Deep merge for objects
        result[key] = mergeRuleConfigurations([
          result[key] as Record<string, unknown> || {},
          value as Record<string, unknown>
        ]);
      } else {
        // For other types, just overwrite
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Generate final configuration by applying matching rules
 */
export function generateConfiguration(
  rules: Rule[],
  context: ProjectContext,
  options: RuleInterpreterOptions = {}
): Record<string, unknown> {
  const opts = { ...defaultOptions, ...options };

  try {
    // Find matching rules
    const matches = findMatchingRules(rules, context, opts);

    if (matches.length === 0) {
      logger.warn('No matching rules found for the given context');
      return {};
    }

    // Apply each rule to get configurations
    const configurations = matches.map(match => applyRule(match.rule));

    // Merge configurations
    return mergeRuleConfigurations(configurations);
  } catch (error) {
    const errorMsg = `Error generating configuration: ${error instanceof Error ? error.message : String(error)}`;
    if (opts.strict) {
      throw new Error(errorMsg);
    }
    logger.error(errorMsg);
    return {};
  }
}

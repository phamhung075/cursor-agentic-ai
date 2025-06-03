/**
 * YAML Manager Rules - Core Module
 *
 * Main entry point for the Cursor Rules Management System
 */

import * as path from 'path';
import * as fs from 'fs';
import { RuleEngine, RuleEngineOptions } from './rule-engine';
import { ProjectContext } from './rule-interpreter';
import { logger } from '../utils/logger';

/**
 * Configuration for YAMLManagerRules
 */
export interface YAMLManagerConfig {
  /** Base directory for rules */
  rulesDirectory: string;
  /** Base directory for output */
  outputDirectory: string;
  /** Should rules be validated against schema */
  validateRules: boolean;
  /** Should the system operate in strict mode (throw errors instead of logging) */
  strictMode: boolean;
  /** Should rules be cached in memory */
  cacheEnabled: boolean;
  /** Should the system watch for rule changes */
  watchForChanges: boolean;
  /** Minimum match threshold for rule selection */
  matchThreshold: number;
  /** Debug mode enables verbose logging */
  debugMode: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: YAMLManagerConfig = {
  rulesDirectory: path.join(process.cwd(), 'rules'),
  outputDirectory: path.join(process.cwd(), 'output'),
  validateRules: true,
  strictMode: false,
  cacheEnabled: true,
  watchForChanges: false,
  matchThreshold: 0.7,
  debugMode: false
};

/**
 * Main class for YAML Manager Rules system
 */
export class YAMLManager {
  private config: YAMLManagerConfig;
  private ruleEngine: RuleEngine;

  /**
   * Create a new YAML Manager instance
   */
  constructor(config: Partial<YAMLManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Configure engine options
    const engineOptions: RuleEngineOptions = {
      rulesDir: this.config.rulesDirectory,
      outputDir: this.config.outputDirectory,
      validateSchema: this.config.validateRules,
      strict: this.config.strictMode,
      cacheRules: this.config.cacheEnabled,
      watchForChanges: this.config.watchForChanges,
      matchThreshold: this.config.matchThreshold
    };

    // Initialize rule engine
    this.ruleEngine = new RuleEngine(engineOptions);

    // Setup debug mode if enabled
    if (this.config.debugMode) {
      logger.info('Debug mode enabled');
    }
  }

  /**
   * Generate Cursor rules configuration based on project context
   */
  generateCursorConfig(context: ProjectContext): Record<string, unknown> {
    logger.info(`Generating configuration for project: ${context.projectPath}`);
    return this.ruleEngine.generateConfig(context);
  }

  /**
   * Save generated configuration to a file
   */
  saveConfiguration(config: Record<string, unknown>, filename: string = 'cursor-config.json'): boolean {
    return this.ruleEngine.saveConfig(config, filename);
  }

  /**
   * Generate and save configuration in one step
   */
  generateAndSaveConfig(context: ProjectContext, filename: string = 'cursor-config.json'): boolean {
    const config = this.generateCursorConfig(context);
    return this.saveConfiguration(config, filename);
  }

  /**
   * Add a new rule to the system
   */
  addRule(rule: any): boolean {
    return this.ruleEngine.addRule(rule);
  }

  /**
   * Get a rule by ID
   */
  getRule(id: string): any {
    return this.ruleEngine.getRule(id);
  }

  /**
   * Find rules that match the given context
   */
  findMatchingRules(context: ProjectContext): any[] {
    return this.ruleEngine.findRules(context);
  }

  /**
   * Clear rule cache
   */
  clearCache(): void {
    this.ruleEngine.clearCache();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.ruleEngine.cleanup();
  }
}

// Export RuleEngine and related types for advanced usage
export { RuleEngine } from './rule-engine';
export { parseRuleFile, loadRulesFromDirectory } from './rule-parser';
export type { ProjectContext } from './rule-interpreter';
export type { Rule } from '../models/rule-schema';

// Create singleton instance with default config
export const yamlManager = new YAMLManager();

// Default export
export default YAMLManager;

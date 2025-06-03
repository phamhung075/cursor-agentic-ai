/**
 * Rule Engine
 *
 * Core engine that manages rule loading, parsing, and application.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Rule } from '../models/rule-schema';
import { logger } from '../utils/logger';
import { parseRuleFile, loadRulesFromDirectory, saveRuleToFile, RuleParserOptions } from './rule-parser';
import {
  ProjectContext,
  RuleInterpreterOptions,
  findMatchingRules,
  generateConfiguration
} from './rule-interpreter';

export interface RuleEngineOptions extends RuleParserOptions, RuleInterpreterOptions {
  /** Base directory for rule files */
  rulesDir?: string;
  /** Base directory for output files */
  outputDir?: string;
  /** Cache rules in memory */
  cacheRules?: boolean;
  /** Auto-refresh rules on changes */
  watchForChanges?: boolean;
}

const defaultOptions: RuleEngineOptions = {
  rulesDir: './rules',
  outputDir: './output',
  cacheRules: true,
  watchForChanges: false,
  validateSchema: true,
  strict: false,
  processReferences: true,
  matchThreshold: 0.7,
  prioritizeHighScores: true,
};

/**
 * Rule Engine class for managing the entire rule processing lifecycle
 */
export class RuleEngine {
  private options: RuleEngineOptions;
  private ruleCache: Map<string, Rule> = new Map();
  private watcher: any = null; // Will be set if file watching is enabled

  constructor(options: Partial<RuleEngineOptions> = {}) {
    this.options = { ...defaultOptions, ...options };

    // Create directories if they don't exist
    if (this.options.rulesDir && !fs.existsSync(this.options.rulesDir)) {
      fs.mkdirSync(this.options.rulesDir, { recursive: true });
    }

    if (this.options.outputDir && !fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Setup file watcher if enabled
    this.setupWatcher();
  }

  /**
   * Load all rules from the rules directory
   */
  loadAllRules(): Rule[] {
    if (!this.options.rulesDir) {
      return [];
    }

    try {
      const rules = loadRulesFromDirectory(this.options.rulesDir, this.options);

      // Cache rules if caching is enabled
      if (this.options.cacheRules) {
        rules.forEach(rule => {
          if (rule.metadata?.id) {
            this.ruleCache.set(rule.metadata.id, rule);
          }
        });
      }

      return rules;
    } catch (error) {
      const errorMsg = `Error loading rules: ${error instanceof Error ? error.message : String(error)}`;
      if (this.options.strict) {
        throw new Error(errorMsg);
      }
      logger.error(errorMsg);
      return [];
    }
  }

  /**
   * Get a rule by ID (from cache if available)
   */
  getRule(id: string): Rule | null {
    // Check cache first if enabled
    if (this.options.cacheRules && this.ruleCache.has(id)) {
      return this.ruleCache.get(id) || null;
    }

    // If not in cache, try to load from file
    if (this.options.rulesDir) {
      const potentialPaths = [
        path.join(this.options.rulesDir, `${id}.yaml`),
        path.join(this.options.rulesDir, `${id}.yml`),
        // Try nested directories based on categories
        path.join(this.options.rulesDir, 'language', `${id}.yaml`),
        path.join(this.options.rulesDir, 'framework', `${id}.yaml`),
        path.join(this.options.rulesDir, 'testing', `${id}.yaml`),
      ];

      for (const filePath of potentialPaths) {
        if (fs.existsSync(filePath)) {
          const rule = parseRuleFile(filePath, this.options);

          // Cache if enabled
          if (rule && this.options.cacheRules && rule.metadata?.id) {
            this.ruleCache.set(rule.metadata.id, rule);
          }

          return rule;
        }
      }
    }

    return null;
  }

  /**
   * Find rules that match the given context
   */
  findRules(context: ProjectContext): Rule[] {
    const rules = this.loadAllRules();
    const matches = findMatchingRules(rules, context, this.options);
    return matches.map(match => match.rule);
  }

  /**
   * Generate configuration for the given context
   */
  generateConfig(context: ProjectContext): Record<string, unknown> {
    const rules = this.loadAllRules();
    return generateConfiguration(rules, context, this.options);
  }

  /**
   * Save a configuration to the output directory
   */
  saveConfig(config: Record<string, unknown>, filename: string = 'cursor-config.json'): boolean {
    if (!this.options.outputDir) {
      return false;
    }

    try {
      const outputPath = path.join(this.options.outputDir, filename);
      fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf8');
      logger.info(`Configuration saved to ${outputPath}`);
      return true;
    } catch (error) {
      const errorMsg = `Error saving configuration: ${error instanceof Error ? error.message : String(error)}`;
      if (this.options.strict) {
        throw new Error(errorMsg);
      }
      logger.error(errorMsg);
      return false;
    }
  }

  /**
   * Add a new rule to the rules directory
   */
  addRule(rule: Rule): boolean {
    if (!this.options.rulesDir || !rule.metadata?.id) {
      return false;
    }

    try {
      const filename = `${rule.metadata.id}.yaml`;
      const filePath = path.join(this.options.rulesDir, filename);

      const result = saveRuleToFile(rule, filePath, this.options);

      // Update cache if enabled
      if (result && this.options.cacheRules && rule.metadata?.id) {
        this.ruleCache.set(rule.metadata.id, rule);
      }

      return result;
    } catch (error) {
      const errorMsg = `Error adding rule: ${error instanceof Error ? error.message : String(error)}`;
      if (this.options.strict) {
        throw new Error(errorMsg);
      }
      logger.error(errorMsg);
      return false;
    }
  }

  /**
   * Setup file watcher for rules directory
   */
  private setupWatcher(): void {
    if (this.options.watchForChanges && this.options.rulesDir) {
      try {
        // This would use chokidar or similar library in a real implementation
        // For now, we'll just set a placeholder and log
        this.watcher = true;
        logger.info(`Watching for changes in ${this.options.rulesDir}`);
      } catch (error) {
        logger.error(`Error setting up file watcher: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Stop file watching
   */
  stopWatching(): void {
    if (this.watcher) {
      // In a real implementation, this would stop the chokidar watcher
      this.watcher = null;
      logger.info('Stopped watching for rule changes');
    }
  }

  /**
   * Clear the rule cache
   */
  clearCache(): void {
    this.ruleCache.clear();
    logger.info('Rule cache cleared');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopWatching();
    this.clearCache();
  }
}

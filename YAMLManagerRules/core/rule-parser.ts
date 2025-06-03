/**
 * Rule Parser
 *
 * Core module for parsing and loading YAML rule files.
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { Rule } from '../models/rule-schema';
import { logger } from '../utils/logger';

export interface RuleParserOptions {
  /** Validate rules against schema */
  validateSchema?: boolean;
  /** Throw error on validation failure instead of logging */
  strict?: boolean;
  /** Process includes and references */
  processReferences?: boolean;
  /** Base directory for resolving relative paths */
  baseDir?: string;
}

const defaultOptions: RuleParserOptions = {
  validateSchema: true,
  strict: false,
  processReferences: true,
  baseDir: process.cwd(),
};

/**
 * Parse a YAML rule file and return a Rule object
 */
export function parseRuleFile(filePath: string, options: RuleParserOptions = {}): Rule | null {
  const opts = { ...defaultOptions, ...options };

  try {
    // Resolve absolute path
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(opts.baseDir || process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      const errorMsg = `Rule file not found: ${resolvedPath}`;
      if (opts.strict) {
        throw new Error(errorMsg);
      }
      logger.error(errorMsg);
      return null;
    }

    // Read file content
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');

    // Parse YAML content
    const parsedRule = yaml.load(fileContent) as Rule;

    // Validate rule against schema if required
    if (opts.validateSchema) {
      // TODO: Add schema validation using Zod
      // This will be implemented when schema is finalized
    }

    // Process includes and references if required
    if (opts.processReferences) {
      // TODO: Process includes and references
      // This will be implemented in a later task
    }

    return parsedRule;
  } catch (error) {
    const errorMsg = `Error parsing rule file ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
    if (opts.strict) {
      throw new Error(errorMsg);
    }
    logger.error(errorMsg);
    return null;
  }
}

/**
 * Load multiple rule files from a directory
 */
export function loadRulesFromDirectory(dirPath: string, options: RuleParserOptions = {}): Rule[] {
  const opts = { ...defaultOptions, ...options };
  const rules: Rule[] = [];

  try {
    // Resolve absolute path
    const resolvedPath = path.isAbsolute(dirPath)
      ? dirPath
      : path.resolve(opts.baseDir || process.cwd(), dirPath);

    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      const errorMsg = `Rules directory not found: ${resolvedPath}`;
      if (opts.strict) {
        throw new Error(errorMsg);
      }
      logger.error(errorMsg);
      return rules;
    }

    // Get all YAML files from directory
    const files = fs.readdirSync(resolvedPath)
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

    // Parse each file
    for (const file of files) {
      const filePath = path.join(resolvedPath, file);
      const rule = parseRuleFile(filePath, opts);
      if (rule) {
        rules.push(rule);
      }
    }

    return rules;
  } catch (error) {
    const errorMsg = `Error loading rules from directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`;
    if (opts.strict) {
      throw new Error(errorMsg);
    }
    logger.error(errorMsg);
    return rules;
  }
}

/**
 * Save a rule to a YAML file
 */
export function saveRuleToFile(rule: Rule, filePath: string, options: RuleParserOptions = {}): boolean {
  const opts = { ...defaultOptions, ...options };

  try {
    // Resolve absolute path
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(opts.baseDir || process.cwd(), filePath);

    // Create directory if it doesn't exist
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert rule to YAML
    const yamlContent = yaml.dump(rule, {
      indent: 2,
      lineWidth: 100,
      noRefs: true
    });

    // Write to file
    fs.writeFileSync(resolvedPath, yamlContent, 'utf8');

    return true;
  } catch (error) {
    const errorMsg = `Error saving rule to file ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
    if (opts.strict) {
      throw new Error(errorMsg);
    }
    logger.error(errorMsg);
    return false;
  }
}

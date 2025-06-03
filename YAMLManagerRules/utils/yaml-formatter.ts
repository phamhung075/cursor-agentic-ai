/**
 * YAML Formatter and Validator
 *
 * Utilities for parsing, validating, and formatting YAML rule files.
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { Rule, RuleSchema } from '../models/rule-schema';
import { logger } from './logger';

/**
 * Options for YAML formatting and validation
 */
interface YAMLFormatterOptions {
  /** Should the formatter throw errors for validation failures (true) or just log them (false) */
  strict?: boolean;
  /** Should comments be preserved during formatting */
  preserveComments?: boolean;
  /** Indentation level for YAML output */
  indent?: number;
  /** Whether to output the schema validation errors */
  verbose?: boolean;
}

/**
 * Default options for YAML formatting
 */
const defaultOptions: YAMLFormatterOptions = {
  strict: true,
  preserveComments: true,
  indent: 2,
  verbose: false
};

/**
 * Result of a YAML validation operation
 */
interface ValidationResult {
  /** Whether the YAML is valid according to the schema */
  valid: boolean;
  /** Any validation errors encountered */
  errors?: string[];
  /** The parsed rule if validation was successful */
  rule?: Rule;
}

/**
 * Parse a YAML string into a JavaScript object
 *
 * @param yamlContent The YAML content to parse
 * @param options Formatting options
 * @returns The parsed JavaScript object
 */
export function parseYAML(yamlContent: string, options: YAMLFormatterOptions = defaultOptions): any {
  try {
    return yaml.load(yamlContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error parsing YAML: ${errorMessage}`);
    if (options.strict) {
      throw error;
    }
    return null;
  }
}

/**
 * Validate a rule object against the schema
 *
 * @param ruleObject The rule object to validate
 * @param options Validation options
 * @returns Validation result with errors if any
 */
export function validateRule(ruleObject: any, options: YAMLFormatterOptions = defaultOptions): ValidationResult {
  try {
    const result = RuleSchema.safeParse(ruleObject);

    if (result.success) {
      return { valid: true, rule: result.data };
    } else {
      const errors = result.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      );

      if (options.verbose) {
        errors.forEach(err => logger.error(`Validation error: ${err}`));
      }

      return { valid: false, errors };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error during schema validation: ${errorMessage}`);
    return {
      valid: false,
      errors: [`Unexpected error during validation: ${errorMessage}`]
    };
  }
}

/**
 * Format a rule object as YAML
 *
 * @param ruleObject The rule object to format
 * @param options Formatting options
 * @returns Formatted YAML string
 */
export function formatAsYAML(ruleObject: any, options: YAMLFormatterOptions = defaultOptions): string {
  try {
    const yamlOptions: yaml.DumpOptions = {
      indent: options.indent,
      noRefs: true,
      quotingType: '"'
    };

    return yaml.dump(ruleObject, yamlOptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error formatting YAML: ${errorMessage}`);
    if (options.strict) {
      throw error;
    }
    return '';
  }
}

/**
 * Read a YAML rule file, validate it, and return the parsed rule
 *
 * @param filePath Path to the YAML rule file
 * @param options Validation options
 * @returns The parsed and validated rule
 */
export function readRuleFile(filePath: string, options: YAMLFormatterOptions = defaultOptions): Rule | null {
  try {
    if (!fs.existsSync(filePath)) {
      logger.error(`Rule file not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseYAML(content, options);

    if (!parsed) {
      return null;
    }

    const validation = validateRule(parsed, options);

    if (!validation.valid) {
      logger.error(`Rule file ${filePath} failed validation`);
      validation.errors?.forEach(err => logger.error(`  - ${err}`));

      if (options.strict) {
        throw new Error(`Rule validation failed for ${filePath}`);
      }

      return null;
    }

    return validation.rule as Rule;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error reading rule file ${filePath}: ${errorMessage}`);

    if (options.strict) {
      throw error;
    }

    return null;
  }
}

/**
 * Write a rule object to a YAML file
 *
 * @param rule The rule object to write
 * @param filePath The file path to write to
 * @param options Formatting options
 * @returns True if the write was successful
 */
export function writeRuleFile(rule: Rule, filePath: string, options: YAMLFormatterOptions = defaultOptions): boolean {
  try {
    // Validate rule before writing
    const validation = validateRule(rule, options);

    if (!validation.valid) {
      logger.error(`Cannot write invalid rule to ${filePath}`);
      validation.errors?.forEach(err => logger.error(`  - ${err}`));

      if (options.strict) {
        throw new Error(`Rule validation failed for ${filePath}`);
      }

      return false;
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Format and write the file
    const yamlContent = formatAsYAML(rule, options);
    fs.writeFileSync(filePath, yamlContent, 'utf8');

    logger.info(`Successfully wrote rule file: ${filePath}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error writing rule file ${filePath}: ${errorMessage}`);

    if (options.strict) {
      throw error;
    }

    return false;
  }
}

/**
 * Find and validate all rule files in a directory
 *
 * @param directory The directory to search for rule files
 * @param options Validation options
 * @returns A map of file paths to validation results
 */
export function validateRuleDirectory(directory: string, options: YAMLFormatterOptions = defaultOptions): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  try {
    if (!fs.existsSync(directory)) {
      logger.error(`Directory not found: ${directory}`);
      return results;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);

      // Skip directories and non-YAML files
      if (fs.statSync(filePath).isDirectory() ||
          !(file.endsWith('.yaml') || file.endsWith('.yml'))) {
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = parseYAML(content, { ...options, strict: false });

        if (parsed) {
          const validation = validateRule(parsed, { ...options, strict: false });
          results.set(filePath, validation);
        } else {
          results.set(filePath, {
            valid: false,
            errors: ['Failed to parse YAML content']
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.set(filePath, {
          valid: false,
          errors: [`Error processing file: ${errorMessage}`]
        });
      }
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error validating directory ${directory}: ${errorMessage}`);

    if (options.strict) {
      throw error;
    }

    return results;
  }
}

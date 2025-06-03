/**
 * YAML Formatter
 *
 * Utilities for formatting and validating YAML files.
 */

import * as yaml from 'js-yaml';
import { logger } from './logger';

/**
 * YAML Formatter options
 */
export interface YamlFormatterOptions {
  indent?: number;
  lineWidth?: number;
  noRefs?: boolean;
  sortKeys?: boolean;
  schema?: yaml.Schema;
}

/**
 * Default options for the YAML formatter
 */
const defaultOptions: YamlFormatterOptions = {
  indent: 2,
  lineWidth: 100,
  noRefs: true,
  sortKeys: false
};

/**
 * YAML Formatter
 */
export const yamlFormatter = {
  /**
   * Parse a YAML string into an object
   */
  parse(yamlString: string): any {
    try {
      return yaml.load(yamlString);
    } catch (error) {
      logger.error(`Error parsing YAML: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Validate a YAML string
   */
  validate(yamlString: string): { valid: boolean; error?: string } {
    try {
      yaml.load(yamlString);
      return { valid: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: errorMsg
      };
    }
  },

  /**
   * Stringify an object to YAML
   */
  stringify(data: any, options?: YamlFormatterOptions): string {
    const opts = { ...defaultOptions, ...options };
    try {
      return yaml.dump(data, {
        indent: opts.indent,
        lineWidth: opts.lineWidth,
        noRefs: opts.noRefs,
        sortKeys: opts.sortKeys,
        schema: opts.schema
      });
    } catch (error) {
      logger.error(`Error stringifying YAML: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to stringify YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Format a YAML string (parse and re-stringify)
   */
  format(yamlString: string, options?: YamlFormatterOptions): string {
    const parsedData = this.parse(yamlString);
    return this.stringify(parsedData, options);
  },

  /**
   * Detect if a string is valid YAML
   */
  isYaml(content: string): boolean {
    try {
      yaml.load(content);
      return true;
    } catch (error) {
      return false;
    }
  }
};

export default yamlFormatter;

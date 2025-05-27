import { load, dump } from 'js-yaml';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from '../utils/logger';

/**
 * Interface for YAML schema validation
 */
export interface SchemaOptions {
  required?: string[];
  type?: Record<string, string | string[]>;
  validate?: Record<string, (value: any) => boolean>;
  properties?: Record<string, SchemaOptions>;
  items?: SchemaOptions;
  minItems?: number;
  maxItems?: number;
  pattern?: Record<string, string | RegExp>;
  enum?: Record<string, any[]>;
  ref?: string;
}

/**
 * Interface for validation errors
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Interface for parsed YAML with references
 */
export interface ParsedYaml<T> {
  data: T;
  references: Map<string, any>;
}

/**
 * YamlParser class for parsing and validating YAML files
 */
export class YamlParser {
  private static referenceRegex = /\$ref\((.*?)\)/;
  private static pathRegex = /\$path\((.*?)\)/;

  /**
   * Parse a YAML file and return the parsed object
   * @param filePath - Path to the YAML file
   * @returns Parsed YAML object
   */
  public static parseFile<T>(filePath: string): T {
    try {
      const fileContent = readFileSync(filePath, 'utf8');
      return YamlParser.parseString<T>(fileContent);
    } catch (error) {
      logger.error(`Failed to parse YAML file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Parse a YAML file with reference resolution
   * @param filePath - Path to the YAML file
   * @returns ParsedYaml object with data and resolved references
   */
  public static parseFileWithReferences<T>(filePath: string): ParsedYaml<T> {
    try {
      const fileContent = readFileSync(filePath, 'utf8');
      const baseDir = dirname(filePath);
      return YamlParser.parseStringWithReferences<T>(fileContent, baseDir);
    } catch (error) {
      logger.error(`Failed to parse YAML file with references: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Parse a YAML string and return the parsed object
   * @param content - YAML content as string
   * @returns Parsed YAML object
   */
  public static parseString<T>(content: string): T {
    try {
      return load(content) as T;
    } catch (error) {
      logger.error('Failed to parse YAML string', error as Error);
      throw error;
    }
  }

  /**
   * Parse a YAML string with reference resolution
   * @param content - YAML content as string
   * @param baseDir - Base directory for resolving file references
   * @returns ParsedYaml object with data and resolved references
   */
  public static parseStringWithReferences<T>(content: string, baseDir?: string): ParsedYaml<T> {
    try {
      const data = load(content) as T;
      const references = new Map<string, any>();
      
      // Process references
      YamlParser.processReferences(data, references, baseDir || process.cwd());
      
      return { data, references };
    } catch (error) {
      logger.error('Failed to parse YAML string with references', error as Error);
      throw error;
    }
  }

  /**
   * Process and resolve references in a parsed YAML object
   * @param obj - Object to process
   * @param references - Map to store references
   * @param baseDir - Base directory for resolving file references
   */
  private static processReferences(obj: any, references: Map<string, any>, baseDir: string): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item) => YamlParser.processReferences(item, references, baseDir));
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const refMatch = value.match(YamlParser.referenceRegex);
        if (refMatch) {
          const refKey = refMatch[1].trim();
          references.set(refKey, obj[key]);
          // Replace the reference with its key for later resolution
          obj[key] = `$ref:${refKey}`;
        }

        const pathMatch = value.match(YamlParser.pathRegex);
        if (pathMatch && baseDir) {
          const filePath = pathMatch[1].trim();
          const fullPath = join(baseDir, filePath);
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, 'utf8');
            references.set(filePath, content);
            obj[key] = `$path:${filePath}`;
          } else {
            logger.warn(`Referenced file not found: ${fullPath}`);
          }
        }
      } else if (value && typeof value === 'object') {
        YamlParser.processReferences(value, references, baseDir);
      }
    }
  }

  /**
   * Resolve references in a parsed YAML object
   * @param obj - Object to resolve references in
   * @param references - Map of references
   * @returns Object with resolved references
   */
  public static resolveReferences(obj: any, references: Map<string, any>): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'string') {
          if (item.startsWith('$ref:')) {
            const refKey = item.substring(5);
            return references.get(refKey) || item;
          } else if (item.startsWith('$path:')) {
            const pathKey = item.substring(6);
            return references.get(pathKey) || item;
          }
        }
        return YamlParser.resolveReferences(item, references);
      });
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (value.startsWith('$ref:')) {
          const refKey = value.substring(5);
          result[key] = references.get(refKey) || value;
        } else if (value.startsWith('$path:')) {
          const pathKey = value.substring(6);
          result[key] = references.get(pathKey) || value;
        } else {
          result[key] = value;
        }
      } else if (value && typeof value === 'object') {
        result[key] = YamlParser.resolveReferences(value, references);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Convert an object to YAML string
   * @param data - Object to convert to YAML
   * @returns YAML string
   */
  public static toYaml(data: unknown): string {
    try {
      return dump(data, { indent: 2 });
    } catch (error) {
      logger.error('Failed to convert object to YAML', error as Error);
      throw error;
    }
  }

  /**
   * Save an object as a YAML file
   * @param data - Object to save as YAML
   * @param filePath - Path to save the YAML file
   */
  public static saveToFile(data: unknown, filePath: string): void {
    try {
      const yamlContent = YamlParser.toYaml(data);
      writeFileSync(filePath, yamlContent, 'utf8');
    } catch (error) {
      logger.error(`Failed to save YAML file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Validate a YAML object against a schema
   * @param data - Object to validate
   * @param schema - Schema options for validation
   * @param path - Current path in the object (for error reporting)
   * @returns True if valid, throws error if invalid
   */
  public static validate(
    data: Record<string, any>,
    schema: SchemaOptions,
    path: string = 'root'
  ): boolean {
    const errors: ValidationError[] = [];
    YamlParser.validateRecursive(data, schema, path, errors);

    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.path}: ${e.message}`).join('\n');
      throw new Error(`Validation failed:\n${errorMessages}`);
    }

    return true;
  }

  /**
   * Validate a YAML object against a schema with detailed error collection
   * @param data - Object to validate
   * @param schema - Schema options for validation
   * @param path - Current path in the object (for error reporting)
   * @param errors - Array to collect validation errors
   */
  private static validateRecursive(
    data: any,
    schema: SchemaOptions,
    path: string,
    errors: ValidationError[]
  ): void {
    // Check data type
    if (data === undefined) {
      return;
    }

    // Check required fields
    if (schema.required && typeof data === 'object' && !Array.isArray(data)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push({
            path: `${path}`,
            message: `Missing required field: ${field}`
          });
        }
      }
    }

    // Check field types
    if (schema.type && typeof data === 'object' && !Array.isArray(data)) {
      for (const [field, type] of Object.entries(schema.type)) {
        if (field in data) {
          const value = data[field];
          const types = Array.isArray(type) ? type : [type];
          const typeMatches = types.some(t => typeof value === t);
          
          if (!typeMatches) {
            errors.push({
              path: `${path}.${field}`,
              message: `Should be of type ${types.join(' or ')}, got ${typeof value}`
            });
          }
        }
      }
    }

    // Check array items
    if (schema.items && Array.isArray(data)) {
      // Check min/max items
      if (schema.minItems !== undefined && data.length < schema.minItems) {
        errors.push({
          path,
          message: `Array should have at least ${schema.minItems} items, got ${data.length}`
        });
      }
      
      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        errors.push({
          path,
          message: `Array should have at most ${schema.maxItems} items, got ${data.length}`
        });
      }
      
      // Validate each item
      data.forEach((item, index) => {
        YamlParser.validateRecursive(item, schema.items!, `${path}[${index}]`, errors);
      });
    }

    // Check pattern constraints
    if (schema.pattern && typeof data === 'object' && !Array.isArray(data)) {
      for (const [field, pattern] of Object.entries(schema.pattern)) {
        if (field in data && typeof data[field] === 'string') {
          const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
          if (!regex.test(data[field])) {
            errors.push({
              path: `${path}.${field}`,
              message: `Should match pattern: ${regex}`
            });
          }
        }
      }
    }

    // Check enum values
    if (schema.enum && typeof data === 'object' && !Array.isArray(data)) {
      for (const [field, allowedValues] of Object.entries(schema.enum)) {
        if (field in data && !allowedValues.includes(data[field])) {
          errors.push({
            path: `${path}.${field}`,
            message: `Should be one of: ${allowedValues.join(', ')}`
          });
        }
      }
    }

    // Run custom validators
    if (schema.validate && typeof data === 'object' && !Array.isArray(data)) {
      for (const [field, validator] of Object.entries(schema.validate)) {
        if (field in data) {
          const value = data[field];
          if (!validator(value)) {
            errors.push({
              path: `${path}.${field}`,
              message: 'Failed custom validation'
            });
          }
        }
      }
    }

    // Recursively validate nested properties
    if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
      for (const [field, propertySchema] of Object.entries(schema.properties)) {
        if (field in data) {
          YamlParser.validateRecursive(data[field], propertySchema, `${path}.${field}`, errors);
        }
      }
    }
  }
} 
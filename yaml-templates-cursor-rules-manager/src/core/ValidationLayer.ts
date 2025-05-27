import { ConfigFile, ConfigLevel } from './ConfigManager';
import { logger } from '../utils/logger';

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string[];
  message: string;
  level?: ConfigLevel;
  configName?: string;
  value?: any;
  severity: 'error' | 'warning';
}

/**
 * Schema validator interface for custom validators
 */
export interface SchemaValidator {
  (value: any, path: string[]): ValidationError[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Class responsible for validating configurations
 */
export class ValidationLayer {
  private validators: Map<string, SchemaValidator> = new Map();
  private requiredProperties: Map<ConfigLevel, string[]> = new Map();
  private typeValidators: Map<string, (value: any) => boolean> = new Map();

  constructor() {
    // Set up built-in type validators
    this.typeValidators.set('string', (value) => typeof value === 'string');
    this.typeValidators.set('number', (value) => typeof value === 'number');
    this.typeValidators.set('boolean', (value) => typeof value === 'boolean');
    this.typeValidators.set('array', (value) => Array.isArray(value));
    this.typeValidators.set('object', (value) => typeof value === 'object' && value !== null && !Array.isArray(value));
    
    // Set up default required properties
    this.requiredProperties.set(ConfigLevel.Organization, ['name', 'level']);
    this.requiredProperties.set(ConfigLevel.Team, ['name', 'level']);
    this.requiredProperties.set(ConfigLevel.Project, ['name', 'level']);
  }

  /**
   * Register a custom schema validator
   * @param name - Name of the validator
   * @param validator - Validator function
   */
  public registerValidator(name: string, validator: SchemaValidator): void {
    this.validators.set(name, validator);
  }

  /**
   * Set required properties for a specific configuration level
   * @param level - Configuration level
   * @param properties - Array of required property names
   */
  public setRequiredProperties(level: ConfigLevel, properties: string[]): void {
    this.requiredProperties.set(level, [...properties]);
  }

  /**
   * Add a custom type validator
   * @param typeName - Name of the type
   * @param validator - Function to validate values of this type
   */
  public addTypeValidator(typeName: string, validator: (value: any) => boolean): void {
    this.typeValidators.set(typeName, validator);
  }

  /**
   * Validate a configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  public validateConfig(config: ConfigFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Check required properties
    if (config.level) {
      const requiredProps = this.requiredProperties.get(config.level) || [];
      
      for (const prop of requiredProps) {
        if (!(prop in config) || config[prop as keyof ConfigFile] === undefined) {
          errors.push({
            path: [prop],
            message: `Missing required property: ${prop}`,
            level: config.level,
            configName: config.name,
            severity: 'error'
          });
        }
      }
    } else {
      // Level is required for all configurations
      errors.push({
        path: ['level'],
        message: 'Missing required property: level',
        configName: config.name,
        severity: 'error'
      });
    }
    
    // Run custom validators
    for (const [name, validator] of this.validators) {
      try {
        const validationErrors = validator(config, []);
        
        for (const error of validationErrors) {
          if (error.severity === 'error') {
            errors.push({
              ...error,
              configName: config.name,
              level: config.level
            });
          } else {
            warnings.push({
              ...error,
              configName: config.name,
              level: config.level
            });
          }
        }
      } catch (err) {
        errors.push({
          path: [],
          message: `Validator '${name}' failed: ${(err as Error).message}`,
          configName: config.name,
          level: config.level,
          severity: 'error'
        });
      }
    }
    
    // Check content
    if (config.content) {
      const contentErrors = this.validateContent(config.content, ['content'], config.level, config.name);
      errors.push(...contentErrors.filter(e => e.severity === 'error'));
      warnings.push(...contentErrors.filter(e => e.severity === 'warning'));
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Recursively validate configuration content
   * @param content - Content to validate
   * @param path - Current path in the object
   * @param level - Configuration level
   * @param configName - Configuration name
   * @returns Array of validation errors
   */
  private validateContent(
    content: any, 
    path: string[] = [], 
    level?: ConfigLevel,
    configName?: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof content !== 'object' || content === null) {
      return errors;
    }
    
    // Check for level-specific content rules
    if (level) {
      // Each level might have specific validation rules
      switch (level) {
        case ConfigLevel.Organization:
          // Organization-specific validations
          break;
          
        case ConfigLevel.Team:
          // Team-specific validations
          break;
          
        case ConfigLevel.Project:
          // Project-specific validations
          break;
      }
    }
    
    // Check any specified types in the content
    if ('__type' in content) {
      const typeName = content.__type;
      const typeValidator = this.typeValidators.get(typeName);
      
      if (typeValidator) {
        // Extract the value to validate (excluding __type)
        const { __type, ...valueToValidate } = content;
        
        if (!typeValidator(valueToValidate)) {
          errors.push({
            path: [...path],
            message: `Value does not match type '${typeName}'`,
            level,
            configName,
            value: content,
            severity: 'error'
          });
        }
      } else {
        errors.push({
          path: [...path, '__type'],
          message: `Unknown type: ${typeName}`,
          level,
          configName,
          value: typeName,
          severity: 'warning'
        });
      }
    }
    
    // Recursively validate nested objects
    for (const [key, value] of Object.entries(content)) {
      if (key === '__type') {
        continue; // Already processed above
      }
      
      const currentPath = [...path, key];
      
      if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects or arrays
        const nestedErrors = this.validateContent(value, currentPath, level, configName);
        errors.push(...nestedErrors);
      }
    }
    
    return errors;
  }

  /**
   * Log validation errors
   * @param result - Validation result
   * @param includeWarnings - Whether to include warnings in the log
   */
  public logValidationResult(result: ValidationResult, includeWarnings = true): void {
    if (!result.isValid) {
      logger.error(`Validation failed with ${result.errors.length} errors`);
      
      for (const error of result.errors) {
        const pathStr = error.path.join('.');
        logger.error(`[${error.configName || 'unknown'}] ${pathStr}: ${error.message}`);
      }
    } else {
      logger.info('Validation successful');
    }
    
    if (includeWarnings && result.warnings.length > 0) {
      logger.warn(`Validation had ${result.warnings.length} warnings`);
      
      for (const warning of result.warnings) {
        const pathStr = warning.path.join('.');
        logger.warn(`[${warning.configName || 'unknown'}] ${pathStr}: ${warning.message}`);
      }
    }
  }
} 
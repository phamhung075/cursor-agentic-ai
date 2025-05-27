import { SchemaOptions } from '../core/YamlParser';

/**
 * Schema for rule definition
 */
export const ruleSchema: SchemaOptions = {
  required: ['description', 'content'],
  type: {
    description: 'string',
    globs: ['object'],
    alwaysApply: 'boolean',
    content: ['string', 'object'],
    template: 'string',
  },
  properties: {
    globs: {
      items: {
        type: {
          '*': 'string',
        },
      },
    },
    content: {
      // Content can be either a string or an object with nested properties
      // This is validated at runtime
    },
  },
  validate: {
    globs: (value) => {
      if (value === undefined) return true;
      return Array.isArray(value);
    },
  },
};

/**
 * Schema for configuration file
 */
export const configSchema: SchemaOptions = {
  required: ['name'],
  type: {
    name: 'string',
    description: 'string',
    version: 'string',
    templates: ['object'],
    rules: 'object',
    extends: ['object'],
  },
  properties: {
    templates: {
      items: {
        type: {
          '*': 'string',
        },
      },
    },
    extends: {
      items: {
        type: {
          '*': 'string',
        },
      },
    },
    rules: {
      // Each key is a rule name, and the value is a rule definition
      // We validate each rule definition separately
    },
  },
  validate: {
    templates: (value) => {
      if (value === undefined) return true;
      return Array.isArray(value);
    },
    extends: (value) => {
      if (value === undefined) return true;
      return Array.isArray(value);
    },
    rules: (value) => {
      if (value === undefined) return true;
      if (typeof value !== 'object' || value === null) return false;
      
      // Each rule should follow the rule schema, but we'll validate this separately
      return true;
    },
  },
};

/**
 * Validate a configuration object against the schema
 * @param config - Configuration object to validate
 * @returns Validation errors, empty array if valid
 */
export function validateConfig(config: any): string[] {
  const errors: string[] = [];
  
  try {
    // Basic structure validation
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return errors;
    }
    
    // Required fields
    if (!config.name) {
      errors.push('Configuration must have a name');
    }
    
    // Rules validation
    if (config.rules) {
      if (typeof config.rules !== 'object') {
        errors.push('Rules must be an object');
      } else {
        Object.entries(config.rules).forEach(([ruleName, rule]) => {
          if (!rule || typeof rule !== 'object') {
            errors.push(`Rule '${ruleName}' must be an object`);
            return;
          }
          
          // Required rule fields
          if (!('description' in rule)) {
            errors.push(`Rule '${ruleName}' must have a description`);
          }
          
          if (!('content' in rule)) {
            errors.push(`Rule '${ruleName}' must have content`);
          }
          
          // Validate globs if present
          if ('globs' in rule && !Array.isArray(rule.globs)) {
            errors.push(`Rule '${ruleName}' globs must be an array`);
          }
          
          // Validate alwaysApply if present
          if ('alwaysApply' in rule && typeof rule.alwaysApply !== 'boolean') {
            errors.push(`Rule '${ruleName}' alwaysApply must be a boolean`);
          }
        });
      }
    }
    
    // Templates validation
    if (config.templates) {
      if (!Array.isArray(config.templates)) {
        errors.push('Templates must be an array');
      } else {
        config.templates.forEach((template: any, index: number) => {
          if (typeof template !== 'string') {
            errors.push(`Template at index ${index} must be a string`);
          }
        });
      }
    }
    
    // Extends validation
    if (config.extends) {
      if (!Array.isArray(config.extends)) {
        errors.push('Extends must be an array');
      } else {
        config.extends.forEach((extend: any, index: number) => {
          if (typeof extend !== 'string') {
            errors.push(`Extend at index ${index} must be a string`);
          }
        });
      }
    }
  } catch (error) {
    errors.push(`Validation error: ${(error as Error).message}`);
  }
  
  return errors;
} 
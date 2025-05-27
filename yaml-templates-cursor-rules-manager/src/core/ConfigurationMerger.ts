import { ConfigFile, ConfigManager } from './ConfigManager';
import { InheritanceModel, MergeStrategy, OverrideDirective } from './InheritanceModel';
import { logger } from '../utils/logger';
import * as deepmerge from 'deepmerge';

/**
 * Class responsible for merging configurations according to inheritance rules
 */
export class ConfigurationMerger {
  private configManager: ConfigManager;

  /**
   * Create a new ConfigurationMerger
   * @param configManager - The ConfigManager instance to use
   */
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Merge a configuration with all its parents
   * @param configName - Name of the configuration to merge
   * @returns The merged configuration, or null if errors occurred
   */
  public mergeConfiguration(configName: string): ConfigFile | null {
    const configs = this.configManager.getAllConfigs();
    const config = configs.get(configName);
    
    if (!config) {
      logger.error(`Configuration "${configName}" not found`);
      return null;
    }
    
    // Check for cycles in the inheritance chain
    if (InheritanceModel.detectCycles(configName, configs)) {
      logger.error(`Circular dependency detected in configuration "${configName}"`);
      return null;
    }
    
    // Get all configurations this config extends
    const extendsConfigs = InheritanceModel.getAllExtends(configName, configs);
    
    // Build array of configurations to merge in correct order (lowest priority first)
    const configsToMerge: ConfigFile[] = [];
    
    // Add all extended configurations in reverse precedence order
    for (const extendName of extendsConfigs) {
      const extendConfig = configs.get(extendName);
      if (extendConfig) {
        configsToMerge.push(extendConfig);
      }
    }
    
    // Add the base configuration last (highest priority)
    configsToMerge.push(config);
    
    // Merge all configurations
    return this.mergeConfigs(configsToMerge);
  }

  /**
   * Merge an array of configurations
   * @param configs - Array of configurations to merge (in priority order, lowest first)
   * @returns The merged configuration
   */
  private mergeConfigs(configs: ConfigFile[]): ConfigFile {
    if (configs.length === 0) {
      throw new Error('No configurations to merge');
    }
    
    if (configs.length === 1) {
      // No merging needed
      return { ...configs[0] };
    }
    
    // Start with an empty configuration
    let result: ConfigFile = {
      content: {}
    };
    
    // Merge each configuration in order
    for (const config of configs) {
      result = this.mergeConfig(result, config);
    }
    
    return result;
  }

  /**
   * Merge two configurations
   * @param target - Target configuration (lower priority)
   * @param source - Source configuration (higher priority)
   * @returns The merged configuration
   */
  private mergeConfig(target: ConfigFile, source: ConfigFile): ConfigFile {
    // Create a new config object
    const result: ConfigFile = {
      // Prefer source name, level, etc.
      name: source.name || target.name,
      level: source.level || target.level,
      filepath: source.filepath || target.filepath,
      
      // Merge extends arrays if both exist
      extends: this.mergeExtends(target.extends, source.extends),
      
      // Deep merge content objects
      content: this.mergeContents(target.content, source.content)
    };
    
    return result;
  }

  /**
   * Merge extends arrays
   * @param targetExtends - Target extends array
   * @param sourceExtends - Source extends array
   * @returns Merged extends array
   */
  private mergeExtends(
    targetExtends: string[] | undefined, 
    sourceExtends: string[] | undefined
  ): string[] | undefined {
    if (!targetExtends && !sourceExtends) {
      return undefined;
    }
    
    if (!targetExtends) {
      return sourceExtends;
    }
    
    if (!sourceExtends) {
      return targetExtends;
    }
    
    // Combine both arrays and remove duplicates
    return [...new Set([...targetExtends, ...sourceExtends])];
  }

  /**
   * Merge configuration contents
   * @param targetContent - Target content object
   * @param sourceContent - Source content object
   * @returns Merged content object
   */
  private mergeContents(
    targetContent: Record<string, any>,
    sourceContent: Record<string, any>
  ): Record<string, any> {
    // Start with a deep copy of the target content
    const result = { ...targetContent };
    
    // Process each property in the source content
    for (const [key, value] of Object.entries(sourceContent)) {
      result[key] = this.mergeValues(result[key], value);
    }
    
    return result;
  }

  /**
   * Merge two values according to type and override directives
   * @param targetValue - Target value (lower priority)
   * @param sourceValue - Source value (higher priority)
   * @returns Merged value
   */
  private mergeValues(targetValue: any, sourceValue: any): any {
    // Check if the source value has an override directive
    const directive = InheritanceModel.getOverrideDirective(sourceValue);
    if (directive) {
      return this.applyOverrideDirective(targetValue, directive);
    }
    
    // Handle undefined target value
    if (targetValue === undefined) {
      return sourceValue;
    }
    
    // Handle undefined source value
    if (sourceValue === undefined) {
      return targetValue;
    }
    
    // Handle different value types
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      // Merge arrays (by default, just append source to target)
      return [...targetValue, ...sourceValue];
    } else if (
      typeof sourceValue === 'object' && sourceValue !== null &&
      typeof targetValue === 'object' && targetValue !== null
    ) {
      // Deep merge objects
      return deepmerge(targetValue, sourceValue, {
        // Custom merge function for arrays
        arrayMerge: (target, source) => {
          return [...target, ...source];
        }
      });
    } else {
      // For primitive values, simply use the source (higher priority)
      return sourceValue;
    }
  }

  /**
   * Apply an override directive to a value
   * @param targetValue - Target value to override
   * @param directive - Override directive
   * @returns The result of applying the directive
   */
  private applyOverrideDirective(targetValue: any, directive: OverrideDirective): any {
    const { value, strategy } = directive;
    
    switch (strategy) {
      case MergeStrategy.Replace:
        // Completely replace the target value
        return value;
        
      case MergeStrategy.Extend:
        // Handle arrays and objects differently
        if (Array.isArray(targetValue) && Array.isArray(value)) {
          // For arrays, concatenate them
          return [...targetValue, ...value];
        } else if (
          typeof targetValue === 'object' && targetValue !== null &&
          typeof value === 'object' && value !== null
        ) {
          // For objects, merge them
          return { ...targetValue, ...value };
        } else {
          // For other types, just replace
          return value;
        }
        
      case MergeStrategy.Merge:
        // Deep merge objects
        if (
          typeof targetValue === 'object' && targetValue !== null &&
          typeof value === 'object' && value !== null
        ) {
          return deepmerge(targetValue, value);
        } else {
          // For non-objects, just replace
          return value;
        }
        
      case MergeStrategy.Prepend:
        // Prepend to arrays
        if (Array.isArray(targetValue) && Array.isArray(value)) {
          return [...value, ...targetValue];
        } else {
          // For non-arrays, just replace
          return value;
        }
        
      case MergeStrategy.Append:
        // Append to arrays
        if (Array.isArray(targetValue) && Array.isArray(value)) {
          return [...targetValue, ...value];
        } else {
          // For non-arrays, just replace
          return value;
        }
        
      default:
        logger.warn(`Unknown merge strategy: ${strategy}`);
        return value;
    }
  }
} 
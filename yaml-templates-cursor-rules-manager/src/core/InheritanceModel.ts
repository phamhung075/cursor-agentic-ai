import { ConfigLevel, ConfigFile } from './ConfigManager';
import { logger } from '../utils/logger';

/**
 * Configuration merge strategy options
 */
export enum MergeStrategy {
  Replace = 'replace',  // Completely replace the value
  Extend = 'extend',    // Add to the existing value (arrays/objects)
  Merge = 'merge',      // Recursively merge objects
  Prepend = 'prepend',  // Add to the beginning (arrays)
  Append = 'append'     // Add to the end (arrays)
}

/**
 * Override directive for explicitly controlling how a value is merged
 */
export interface OverrideDirective {
  value: any;
  strategy: MergeStrategy;
}

/**
 * Configuration precedence order - highest priority first
 */
export const PRECEDENCE_ORDER = [
  ConfigLevel.Project,    // Project-specific settings (highest priority)
  ConfigLevel.Team,       // Team-wide settings
  ConfigLevel.Organization // Organization-wide settings (lowest priority)
];

/**
 * InheritanceModel class for managing configuration inheritance
 */
export class InheritanceModel {
  /**
   * Determine the precedence order for a list of configurations
   * @param configs - Map of configurations by name
   * @returns Array of configuration names in precedence order
   */
  public static getPrecedenceOrder(configs: Map<string, ConfigFile>): string[] {
    // Create a map of configs by level
    const configsByLevel = new Map<ConfigLevel, ConfigFile[]>();
    
    // Initialize the map with empty arrays for each level
    for (const level of Object.values(ConfigLevel)) {
      configsByLevel.set(level as ConfigLevel, []);
    }
    
    // Group configs by level
    for (const [name, config] of configs) {
      if (config.level) {
        const levelConfigs = configsByLevel.get(config.level) || [];
        levelConfigs.push(config);
        configsByLevel.set(config.level, levelConfigs);
      } else {
        // Default to project level if not specified
        const projectConfigs = configsByLevel.get(ConfigLevel.Project) || [];
        projectConfigs.push(config);
        configsByLevel.set(ConfigLevel.Project, projectConfigs);
      }
    }
    
    // Create a flat array of config names in precedence order
    const result: string[] = [];
    for (const level of PRECEDENCE_ORDER) {
      const levelConfigs = configsByLevel.get(level) || [];
      for (const config of levelConfigs) {
        if (config.name) {
          result.push(config.name);
        }
      }
    }
    
    return result;
  }

  /**
   * Check if a value contains an override directive
   * @param value - Value to check
   * @returns Whether the value is an override directive
   */
  public static isOverrideDirective(value: any): boolean {
    return value !== null && 
           typeof value === 'object' && 
           'value' in value && 
           'strategy' in value &&
           Object.values(MergeStrategy).includes(value.strategy);
  }

  /**
   * Extract the override directive from a value
   * @param value - Value to extract from
   * @returns The override directive or null if not a directive
   */
  public static getOverrideDirective(value: any): OverrideDirective | null {
    if (InheritanceModel.isOverrideDirective(value)) {
      return value as OverrideDirective;
    }
    return null;
  }

  /**
   * Detect cycles in the inheritance chain
   * @param configName - Starting configuration name
   * @param configs - Map of configurations by name
   * @param visited - Set of already visited configurations
   * @returns Whether a cycle was detected
   */
  public static detectCycles(
    configName: string, 
    configs: Map<string, ConfigFile>, 
    visited = new Set<string>()
  ): boolean {
    // If we've already visited this config, we have a cycle
    if (visited.has(configName)) {
      return true;
    }
    
    // Mark this config as visited
    visited.add(configName);
    
    // Get the config
    const config = configs.get(configName);
    if (!config || !config.extends || config.extends.length === 0) {
      return false;
    }
    
    // Check each parent for cycles
    for (const parentName of config.extends) {
      // Create a new visited set for each branch to avoid false positives
      const branchVisited = new Set(visited);
      if (InheritanceModel.detectCycles(parentName, configs, branchVisited)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all configurations that a config extends, including indirect dependencies
   * @param configName - Configuration name
   * @param configs - Map of configurations by name
   * @returns Array of configuration names that this config extends
   */
  public static getAllExtends(configName: string, configs: Map<string, ConfigFile>): string[] {
    const result = new Set<string>();
    const config = configs.get(configName);
    
    if (!config || !config.extends || config.extends.length === 0) {
      return [];
    }
    
    // Process direct parents
    for (const parentName of config.extends) {
      result.add(parentName);
      
      // Process indirect parents (recursive)
      const indirectParents = InheritanceModel.getAllExtends(parentName, configs);
      for (const indirectParent of indirectParents) {
        result.add(indirectParent);
      }
    }
    
    return Array.from(result);
  }
} 
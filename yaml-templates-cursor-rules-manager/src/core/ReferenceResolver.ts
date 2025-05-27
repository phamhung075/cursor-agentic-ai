import { ConfigFile, ConfigReference } from './ConfigManager';
import { logger } from '../utils/logger';

/**
 * Reference format string: ${config:configName.path.to.property}
 */
const REFERENCE_REGEX = /\${config:([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_.-]+))?}/g;

/**
 * Class responsible for resolving references in configurations
 */
export class ReferenceResolver {
  private resolvedConfigs: Map<string, ConfigFile> = new Map();

  /**
   * Parse a string to find configuration references
   * @param text - Text to parse for references
   * @returns Array of configuration references
   */
  public static parseReferences(text: string): ConfigReference[] {
    const references: ConfigReference[] = [];
    let match;
    
    // Reset regex to start from beginning
    REFERENCE_REGEX.lastIndex = 0;
    
    while ((match = REFERENCE_REGEX.exec(text)) !== null) {
      const configName = match[1];
      const pathStr = match[2] || '';
      const path = pathStr ? pathStr.split('.') : [];
      
      references.push({
        configName,
        path
      });
    }
    
    return references;
  }

  /**
   * Find all references in a configuration recursively
   * @param config - Configuration to scan for references
   * @returns Array of configuration references
   */
  public static findAllReferences(config: ConfigFile): ConfigReference[] {
    const references: ConfigReference[] = [];
    
    // Convert the config to a JSON string to simplify reference finding
    const configStr = JSON.stringify(config.content);
    
    // Find all references in the string
    const foundRefs = ReferenceResolver.parseReferences(configStr);
    references.push(...foundRefs);
    
    return references;
  }

  /**
   * Resolve all references in a set of configurations
   * @param configs - Map of configurations by name
   * @returns Map of resolved configurations
   */
  public resolveAllReferences(configs: Map<string, ConfigFile>): Map<string, ConfigFile> {
    this.resolvedConfigs = new Map();
    
    // First pass: detect circular references
    const referenceGraph = new Map<string, Set<string>>();
    
    for (const [name, config] of configs) {
      const references = ReferenceResolver.findAllReferences(config);
      const referencedConfigs = new Set<string>();
      
      for (const ref of references) {
        referencedConfigs.add(ref.configName);
      }
      
      referenceGraph.set(name, referencedConfigs);
    }
    
    // Check for circular references
    for (const [name] of configs) {
      if (this.detectCircularReferences(name, referenceGraph, new Set())) {
        logger.error(`Circular reference detected in configuration: ${name}`);
        return configs; // Return original configs if circular references found
      }
    }
    
    // Second pass: resolve references
    for (const [name, config] of configs) {
      this.resolveConfigReferences(name, configs);
    }
    
    return this.resolvedConfigs;
  }

  /**
   * Detect circular references in the reference graph
   * @param configName - Starting configuration name
   * @param referenceGraph - Map of configuration references
   * @param visited - Set of already visited configurations
   * @returns Whether a circular reference was detected
   */
  private detectCircularReferences(
    configName: string,
    referenceGraph: Map<string, Set<string>>,
    visited: Set<string>
  ): boolean {
    if (visited.has(configName)) {
      return true; // Circular reference detected
    }
    
    visited.add(configName);
    const references = referenceGraph.get(configName);
    
    if (!references) {
      return false;
    }
    
    for (const ref of references) {
      // Create a new visited set for each branch to avoid false positives
      const branchVisited = new Set(visited);
      if (this.detectCircularReferences(ref, referenceGraph, branchVisited)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Resolve references in a specific configuration
   * @param configName - Name of the configuration to resolve
   * @param configs - Map of configurations by name
   * @returns Resolved configuration
   */
  private resolveConfigReferences(
    configName: string,
    configs: Map<string, ConfigFile>
  ): ConfigFile {
    // If already resolved, return the cached result
    if (this.resolvedConfigs.has(configName)) {
      return this.resolvedConfigs.get(configName)!;
    }
    
    const config = configs.get(configName);
    if (!config) {
      logger.error(`Configuration not found: ${configName}`);
      throw new Error(`Configuration not found: ${configName}`);
    }
    
    // Create a copy of the config to avoid modifying the original
    const resolvedConfig: ConfigFile = {
      ...config,
      content: JSON.parse(JSON.stringify(config.content)) // Deep copy
    };
    
    // Store the resolved config before processing to break potential circular references
    this.resolvedConfigs.set(configName, resolvedConfig);
    
    // Resolve references in the content
    resolvedConfig.content = this.resolveObject(resolvedConfig.content, configs);
    
    return resolvedConfig;
  }

  /**
   * Recursively resolve references in an object
   * @param obj - Object to resolve references in
   * @param configs - Map of configurations by name
   * @returns Object with resolved references
   */
  private resolveObject(obj: any, configs: Map<string, ConfigFile>): any {
    if (typeof obj === 'string') {
      return this.resolveString(obj, configs);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveObject(item, configs));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.resolveObject(value, configs);
      }
      
      return result;
    }
    
    return obj;
  }

  /**
   * Resolve references in a string
   * @param str - String to resolve references in
   * @param configs - Map of configurations by name
   * @returns String with resolved references
   */
  private resolveString(str: string, configs: Map<string, ConfigFile>): string {
    return str.replace(REFERENCE_REGEX, (match, configName, pathStr) => {
      try {
        // Get the referenced configuration
        let config: ConfigFile;
        
        if (this.resolvedConfigs.has(configName)) {
          config = this.resolvedConfigs.get(configName)!;
        } else {
          config = this.resolveConfigReferences(configName, configs);
        }
        
        // Extract the referenced value
        const path = pathStr ? pathStr.split('.') : [];
        let value = config.content;
        
        for (const segment of path) {
          if (value === undefined || value === null) {
            throw new Error(`Reference path ${pathStr} not found in ${configName}`);
          }
          
          value = value[segment];
        }
        
        if (value === undefined) {
          throw new Error(`Reference path ${pathStr} not found in ${configName}`);
        }
        
        // Convert the value to a string
        if (typeof value === 'object') {
          return JSON.stringify(value);
        } else {
          return String(value);
        }
      } catch (error) {
        logger.error(`Error resolving reference ${match}:`, error);
        return match; // Keep the original reference on error
      }
    });
  }
} 
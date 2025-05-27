import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { YamlParser, ParsedYaml } from './YamlParser';
import { logger } from '../utils/logger';
import { configSchema, validateConfig } from '../utils/schemaValidation';

/**
 * Configuration levels
 */
export enum ConfigLevel {
  Organization = 'organization',
  Team = 'team',
  Project = 'project',
}

/**
 * Configuration file schema
 */
export interface ConfigFile {
  name: string;
  description?: string;
  version?: string;
  templates?: string[];
  rules?: Record<string, RuleDefinition>;
  extends?: string[];
  level?: ConfigLevel;
}

/**
 * Rule definition schema
 */
export interface RuleDefinition {
  description: string;
  globs?: string[];
  alwaysApply?: boolean;
  content: string | Record<string, any>;
  template?: string;
}

/**
 * ConfigManager class for managing YAML configurations
 */
export class ConfigManager {
  private configDir: string;
  private configs: Map<string, ConfigFile> = new Map();
  private mergedConfigs: Map<string, ConfigFile> = new Map();
  private references: Map<string, any> = new Map();
  private loadErrors: Map<string, string[]> = new Map();

  /**
   * Create a new ConfigManager instance
   * @param configDir - Directory containing configuration files
   */
  constructor(configDir: string) {
    this.configDir = resolve(configDir);
    
    if (!existsSync(this.configDir)) {
      logger.info(`Config directory not found, creating: ${this.configDir}`);
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Load all configuration files from the config directory
   */
  public loadConfigurations(): void {
    try {
      // Get all YAML files in the config directory
      const files = readdirSync(this.configDir).filter(file => 
        file.endsWith('.yaml') || file.endsWith('.yml')
      );

      logger.info(`Found ${files.length} configuration files in ${this.configDir}`);

      // Parse each configuration file
      for (const file of files) {
        const filePath = join(this.configDir, file);
        try {
          // Parse with reference resolution
          const parsed = YamlParser.parseFileWithReferences<ConfigFile>(filePath);
          const config = parsed.data;
          
          // Add references to the global references map
          parsed.references.forEach((value, key) => {
            this.references.set(key, value);
          });
          
          // Validate the configuration
          const errors = validateConfig(config);
          if (errors.length > 0) {
            this.loadErrors.set(file, errors);
            logger.warn(`Configuration file validation errors in ${file}:`);
            errors.forEach(error => logger.warn(`  - ${error}`));
            continue;
          }
          
          if (!config.name) {
            logger.warn(`Configuration file is missing 'name' field: ${filePath}`);
            continue;
          }

          this.configs.set(config.name, config);
          logger.debug(`Loaded configuration: ${config.name}`);
        } catch (error) {
          logger.error(`Failed to load configuration file: ${filePath}`, error as Error);
          this.loadErrors.set(file, [(error as Error).message]);
        }
      }

      // Merge configurations based on 'extends' field
      this.mergeConfigurations();
    } catch (error) {
      logger.error('Failed to load configurations', error as Error);
      throw error;
    }
  }

  /**
   * Get validation errors for configurations
   * @returns Map of file names to error arrays
   */
  public getValidationErrors(): Map<string, string[]> {
    return new Map(this.loadErrors);
  }

  /**
   * Merge configurations based on the 'extends' field
   */
  private mergeConfigurations(): void {
    for (const [name, config] of this.configs) {
      if (!config.extends || config.extends.length === 0) {
        // No extends, just use the config as is
        this.mergedConfigs.set(name, { ...config });
        continue;
      }

      // Start with base config
      const mergedConfig: ConfigFile = { ...config };
      
      // Process extends in order (later ones override earlier ones)
      for (const extendName of config.extends) {
        const extendConfig = this.configs.get(extendName);
        if (!extendConfig) {
          logger.warn(`Configuration '${name}' extends non-existent config '${extendName}'`);
          continue;
        }

        // Merge rules
        if (extendConfig.rules) {
          if (!mergedConfig.rules) {
            mergedConfig.rules = {};
          }
          
          // First, copy all rules from the extended config
          for (const [ruleName, rule] of Object.entries(extendConfig.rules)) {
            // Only add if not already present in the current config
            if (!mergedConfig.rules[ruleName]) {
              mergedConfig.rules[ruleName] = { ...rule };
            }
          }
          
          // Then, overlay with the current config's rules
          for (const [ruleName, rule] of Object.entries(config.rules || {})) {
            mergedConfig.rules[ruleName] = { ...rule };
          }
        }

        // Merge templates
        if (extendConfig.templates) {
          if (!mergedConfig.templates) {
            mergedConfig.templates = [];
          }
          
          // Add templates from the extended config that don't already exist
          for (const template of extendConfig.templates) {
            if (!mergedConfig.templates.includes(template)) {
              mergedConfig.templates.push(template);
            }
          }
        }
      }

      this.mergedConfigs.set(name, mergedConfig);
      logger.debug(`Merged configuration: ${name}`);
    }
  }

  /**
   * Resolve references in all configurations
   */
  public resolveReferences(): void {
    for (const [name, config] of this.mergedConfigs) {
      const resolvedConfig = YamlParser.resolveReferences(config, this.references);
      this.mergedConfigs.set(name, resolvedConfig);
    }
  }

  /**
   * Get a configuration by name
   * @param name - Configuration name
   * @returns Configuration file or undefined if not found
   */
  public getConfig(name: string): ConfigFile | undefined {
    return this.mergedConfigs.get(name);
  }

  /**
   * Get all configuration names
   * @returns Array of configuration names
   */
  public getConfigNames(): string[] {
    return Array.from(this.mergedConfigs.keys());
  }

  /**
   * Get all configurations
   * @returns Map of configurations
   */
  public getAllConfigs(): Map<string, ConfigFile> {
    return new Map(this.mergedConfigs);
  }

  /**
   * Get all raw (unmerged) configurations
   * @returns Map of raw configurations
   */
  public getRawConfigs(): Map<string, ConfigFile> {
    return new Map(this.configs);
  }

  /**
   * Save a configuration to a file
   * @param config - Configuration to save
   */
  public saveConfig(config: ConfigFile): void {
    if (!config.name) {
      throw new Error('Configuration must have a name');
    }

    // Validate the configuration
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration validation errors:\n${errors.join('\n')}`);
    }

    const filePath = join(this.configDir, `${config.name}.yaml`);
    YamlParser.saveToFile(config, filePath);
    
    // Update internal maps
    this.configs.set(config.name, { ...config });
    
    // Re-merge configurations
    this.mergeConfigurations();
    
    logger.info(`Saved configuration: ${config.name}`);
  }
} 
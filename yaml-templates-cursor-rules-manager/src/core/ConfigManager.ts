import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

/**
 * Configuration levels in order of increasing specificity
 */
export enum ConfigLevel {
  Organization = 'organization',
  Team = 'team',
  Project = 'project'
}

/**
 * Configuration file interface
 */
export interface ConfigFile {
  name?: string;             // Unique identifier for the configuration
  level?: ConfigLevel;       // Level in the hierarchy
  extends?: string[];        // Names of other configurations this one extends
  content: Record<string, any>; // The actual configuration content
  filepath?: string;         // Path to the original file
}

/**
 * Configuration reference interface for resolving cross-references
 */
export interface ConfigReference {
  configName: string;        // Name of the referenced configuration
  path: string[];            // Path to the referenced property
}

/**
 * Manager for loading and accessing configuration files
 */
export class ConfigManager {
  private configs: Map<string, ConfigFile> = new Map();
  private configDir: string;

  /**
   * Create a new ConfigManager
   * @param configDir - Directory containing configuration files
   */
  constructor(configDir: string) {
    this.configDir = configDir;
  }

  /**
   * Load all configuration files from the configured directory
   */
  public loadAllConfigs(): void {
    if (!fs.existsSync(this.configDir)) {
      logger.warn(`Config directory ${this.configDir} does not exist`);
      return;
    }

    const files = fs.readdirSync(this.configDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    for (const file of files) {
      try {
        const filepath = path.join(this.configDir, file);
        const config = this.loadConfigFile(filepath);
        if (config && config.name) {
          this.configs.set(config.name, config);
        }
      } catch (error) {
        logger.error(`Error loading config file ${file}:`, error);
      }
    }
  }

  /**
   * Load a specific configuration file
   * @param filepath - Path to the configuration file
   * @returns The loaded configuration
   */
  public loadConfigFile(filepath: string): ConfigFile | null {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const parsed = yaml.load(content) as Record<string, any>;
      
      // Extract metadata
      const name = parsed.name;
      const level = parsed.level as ConfigLevel;
      const extends_ = parsed.extends || [];
      
      // Remove metadata from content
      const { name: _, level: __, extends: ___, ...configContent } = parsed;
      
      return {
        name,
        level,
        extends: Array.isArray(extends_) ? extends_ : [extends_],
        content: configContent,
        filepath
      };
    } catch (error) {
      logger.error(`Error parsing config file ${filepath}:`, error);
      return null;
    }
  }

  /**
   * Get a configuration by name
   * @param name - Configuration name
   * @returns The configuration or undefined if not found
   */
  public getConfig(name: string): ConfigFile | undefined {
    return this.configs.get(name);
  }

  /**
   * Get all loaded configurations
   * @returns Map of configurations by name
   */
  public getAllConfigs(): Map<string, ConfigFile> {
    return this.configs;
  }

  /**
   * Add or update a configuration
   * @param config - Configuration to add or update
   */
  public setConfig(config: ConfigFile): void {
    if (!config.name) {
      throw new Error('Configuration must have a name');
    }
    this.configs.set(config.name, config);
  }

  /**
   * Check if a configuration exists
   * @param name - Configuration name
   * @returns Whether the configuration exists
   */
  public hasConfig(name: string): boolean {
    return this.configs.has(name);
  }

  /**
   * Save a configuration to disk
   * @param name - Configuration name
   * @param overwrite - Whether to overwrite existing files
   * @returns Path to the saved file
   */
  public saveConfig(name: string, overwrite = false): string | null {
    const config = this.configs.get(name);
    if (!config) {
      logger.error(`Config ${name} not found`);
      return null;
    }

    let filepath = config.filepath;
    if (!filepath) {
      // Create a default filepath if none exists
      filepath = path.join(this.configDir, `${name}.yml`);
      config.filepath = filepath;
    }

    if (!overwrite && fs.existsSync(filepath)) {
      logger.error(`File ${filepath} already exists and overwrite=false`);
      return null;
    }

    // Prepare the content to save
    const content = {
      name: config.name,
      level: config.level,
      extends: config.extends && config.extends.length > 0 ? config.extends : undefined,
      ...config.content
    };

    // Ensure the directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the file
    fs.writeFileSync(filepath, yaml.dump(content));
    return filepath;
  }
} 
import { ConfigFile, ConfigManager } from './ConfigManager';
import { InheritanceModel } from './InheritanceModel';
import { ConfigurationMerger } from './ConfigurationMerger';
import { ReferenceResolver } from './ReferenceResolver';
import { ConflictResolver } from './ConflictResolver';
import { ValidationLayer, ValidationResult } from './ValidationLayer';
import { logger } from '../utils/logger';

/**
 * Options for the configuration inheritance system
 */
export interface ConfigInheritanceOptions {
  validateAfterMerge?: boolean;
  resolveReferences?: boolean;
  autoResolveConflicts?: boolean;
  logValidationErrors?: boolean;
}

/**
 * Main class for the configuration inheritance system
 */
export class ConfigurationInheritanceSystem {
  private configManager: ConfigManager;
  private merger: ConfigurationMerger;
  private referenceResolver: ReferenceResolver;
  private conflictResolver: ConflictResolver;
  private validator: ValidationLayer;
  private options: ConfigInheritanceOptions;

  /**
   * Create a new configuration inheritance system
   * @param configDir - Directory containing configuration files
   * @param options - System options
   */
  constructor(configDir: string, options: ConfigInheritanceOptions = {}) {
    this.configManager = new ConfigManager(configDir);
    this.merger = new ConfigurationMerger(this.configManager);
    this.referenceResolver = new ReferenceResolver();
    this.conflictResolver = new ConflictResolver();
    this.validator = new ValidationLayer();
    
    this.options = {
      validateAfterMerge: true,
      resolveReferences: true,
      autoResolveConflicts: true,
      logValidationErrors: true,
      ...options
    };
  }

  /**
   * Initialize the system and load configurations
   */
  public initialize(): void {
    // Load all configurations
    this.configManager.loadAllConfigs();
    logger.info('Configurations loaded');
  }

  /**
   * Process a configuration by applying inheritance, resolving references, and validating
   * @param configName - Name of the configuration to process
   * @returns The processed configuration, or null if errors occurred
   */
  public processConfiguration(configName: string): ConfigFile | null {
    try {
      logger.info(`Processing configuration: ${configName}`);
      
      // Merge the configuration with its parents
      let config = this.merger.mergeConfiguration(configName);
      if (!config) {
        logger.error(`Failed to merge configuration: ${configName}`);
        return null;
      }
      
      // Resolve references if enabled
      if (this.options.resolveReferences) {
        const allConfigs = this.configManager.getAllConfigs();
        const configMap = new Map<string, ConfigFile>();
        configMap.set(configName, config);
        
        const resolvedConfigs = this.referenceResolver.resolveAllReferences(configMap);
        config = resolvedConfigs.get(configName) || config;
      }
      
      // Detect and resolve conflicts
      if (this.options.autoResolveConflicts) {
        const resolvedConfig = this.resolveConflicts(config);
        if (resolvedConfig) {
          config = resolvedConfig;
        }
      }
      
      // Validate if enabled
      if (this.options.validateAfterMerge) {
        const validationResult = this.validator.validateConfig(config);
        
        if (this.options.logValidationErrors) {
          this.validator.logValidationResult(validationResult);
        }
        
        if (!validationResult.isValid) {
          logger.error(`Configuration ${configName} is invalid after processing`);
          return null;
        }
      }
      
      return config;
    } catch (error) {
      logger.error(`Error processing configuration ${configName}:`, error);
      return null;
    }
  }

  /**
   * Get the ConfigManager instance
   * @returns The ConfigManager
   */
  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * Get the ValidationLayer instance
   * @returns The ValidationLayer
   */
  public getValidator(): ValidationLayer {
    return this.validator;
  }

  /**
   * Get the ConflictResolver instance
   * @returns The ConflictResolver
   */
  public getConflictResolver(): ConflictResolver {
    return this.conflictResolver;
  }

  /**
   * Process and resolve conflicts in a configuration
   * @param config - Configuration to process
   * @returns The configuration with resolved conflicts, or null if errors occurred
   */
  private resolveConflicts(config: ConfigFile): ConfigFile | null {
    try {
      // Find other configurations this might conflict with
      const allConfigs = this.configManager.getAllConfigs();
      
      // Detect conflicts with all configurations
      for (const [otherName, otherConfig] of allConfigs) {
        if (otherName !== config.name) {
          this.conflictResolver.detectConflicts(config, otherConfig);
        }
      }
      
      // Resolve all conflicts
      const unresolvedConflicts = this.conflictResolver.getUnresolvedConflicts();
      
      if (unresolvedConflicts.length > 0) {
        logger.info(`Resolving ${unresolvedConflicts.length} conflicts in ${config.name}`);
        this.conflictResolver.resolveAllConflicts();
      }
      
      // Apply resolutions to the configuration
      return this.conflictResolver.applyResolutions(config);
    } catch (error) {
      logger.error(`Error resolving conflicts in ${config.name}:`, error);
      return null;
    }
  }
} 
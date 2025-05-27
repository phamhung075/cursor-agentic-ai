import chokidar from 'chokidar';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { ConfigManager, ConfigFile, RuleDefinition } from './ConfigManager';
import { TemplateProcessor } from './TemplateProcessor';
import { YamlParser } from './YamlParser';
import { logger } from '../utils/logger';

/**
 * Options for the SyncService
 */
export interface SyncOptions {
  configDir: string;
  templatesDir: string;
  outputDir: string;
  watch?: boolean;
}

/**
 * SyncService class for handling synchronization between YAML configs and MDC files
 */
export class SyncService {
  private configManager: ConfigManager;
  private templateProcessor: TemplateProcessor;
  private options: SyncOptions;
  private watcher: chokidar.FSWatcher | null = null;

  /**
   * Create a new SyncService instance
   * @param options - Options for the sync service
   */
  constructor(options: SyncOptions) {
    this.options = options;
    this.configManager = new ConfigManager(options.configDir);
    this.templateProcessor = new TemplateProcessor();

    // Ensure output directory exists
    if (!existsSync(options.outputDir)) {
      logger.info(`Output directory not found, creating: ${options.outputDir}`);
      mkdirSync(options.outputDir, { recursive: true });
    }
  }

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    // Load configurations
    this.configManager.loadConfigurations();

    // Load templates
    this.loadTemplates();

    // If watch mode is enabled, set up file watchers
    if (this.options.watch) {
      this.setupWatchers();
    }
  }

  /**
   * Load templates from the templates directory
   */
  private loadTemplates(): void {
    try {
      // Get all config files
      const configs = this.configManager.getAllConfigs();

      // Extract all template names
      const templateNames = new Set<string>();
      for (const config of configs.values()) {
        if (config.templates) {
          for (const template of config.templates) {
            templateNames.add(template);
          }
        }
        
        if (config.rules) {
          for (const rule of Object.values(config.rules)) {
            if (rule.template) {
              templateNames.add(rule.template);
            }
          }
        }
      }

      // Load each template
      for (const templateName of templateNames) {
        const templatePath = join(this.options.templatesDir, `${templateName}.hbs`);
        if (existsSync(templatePath)) {
          this.templateProcessor.loadTemplate(templateName, templatePath);
        } else {
          logger.warn(`Template not found: ${templatePath}`);
        }
      }
    } catch (error) {
      logger.error('Failed to load templates', error as Error);
    }
  }

  /**
   * Set up file watchers for automatic synchronization
   */
  private setupWatchers(): void {
    // Watch YAML config files
    const configGlob = join(this.options.configDir, '**/*.{yaml,yml}');
    // Watch template files
    const templateGlob = join(this.options.templatesDir, '**/*.hbs');

    this.watcher = chokidar.watch([configGlob, templateGlob], {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (path) => this.handleFileChange(path))
      .on('change', (path) => this.handleFileChange(path))
      .on('unlink', (path) => this.handleFileDelete(path));

    logger.info(`Watching for changes in: ${configGlob}, ${templateGlob}`);
  }

  /**
   * Handle file change events from the watcher
   * @param path - Path to the changed file
   */
  private handleFileChange(path: string): void {
    logger.info(`File changed: ${path}`);

    // Determine if it's a config or template file
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      // Reload configurations
      this.configManager.loadConfigurations();
      // Regenerate all MDC files
      this.synchronize();
    } else if (path.endsWith('.hbs')) {
      // Reload template
      const templateName = basename(path, '.hbs');
      this.templateProcessor.loadTemplate(templateName, path);
      // Regenerate all MDC files that use this template
      this.synchronize();
    }
  }

  /**
   * Handle file deletion events from the watcher
   * @param path - Path to the deleted file
   */
  private handleFileDelete(path: string): void {
    logger.info(`File deleted: ${path}`);

    // Determine if it's a config or template file
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      // Reload configurations
      this.configManager.loadConfigurations();
      // Regenerate all MDC files
      this.synchronize();
    }
    // No need to handle deleted templates, they will fail when trying to render
  }

  /**
   * Synchronize YAML configurations to MDC files
   */
  public synchronize(): void {
    try {
      // Get all configs
      const configs = this.configManager.getAllConfigs();

      // Process each config
      for (const config of configs.values()) {
        this.processConfig(config);
      }

      logger.success('Synchronization complete');
    } catch (error) {
      logger.error('Synchronization failed', error as Error);
    }
  }

  /**
   * Process a single configuration
   * @param config - Configuration to process
   */
  private processConfig(config: ConfigFile): void {
    if (!config.rules) {
      return;
    }

    // Process each rule in the config
    for (const [ruleName, rule] of Object.entries(config.rules)) {
      this.processRule(ruleName, rule, config);
    }
  }

  /**
   * Process a single rule
   * @param ruleName - Name of the rule
   * @param rule - Rule definition
   * @param config - Parent configuration
   */
  private processRule(ruleName: string, rule: RuleDefinition, config: ConfigFile): void {
    try {
      // Determine the template to use
      const templateName = rule.template || 'default';

      // Prepare data for the template
      const data = {
        name: ruleName,
        config: config,
        rule: rule,
      };

      // Generate the output
      let output: string;
      if (typeof rule.content === 'string') {
        // Direct content
        output = rule.content;
      } else {
        // Use template
        output = this.templateProcessor.render(templateName, data);
      }

      // Write to file
      const outputPath = join(this.options.outputDir, `${ruleName}.mdc`);
      
      // Ensure the directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Write the output
      const outputFile = basename(outputPath);
      this.templateProcessor.renderToFile(templateName, data, outputPath);
      logger.debug(`Generated MDC file: ${outputFile}`);
    } catch (error) {
      logger.error(`Failed to process rule: ${ruleName}`, error as Error);
    }
  }

  /**
   * Stop the sync service and close watchers
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      logger.info('File watcher closed');
    }
  }
} 
#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { YamlParser } from './core/YamlParser';
import { TemplateProcessor } from './core/TemplateProcessor';
import { ConfigManager, ConfigFile, RuleDefinition } from './core/ConfigManager';
import { SyncService, SyncOptions } from './core/SyncService';
import { logger } from './utils/logger';
import { registerHelpers } from './utils/handlebarsHelpers';

// Register Handlebars helpers
registerHelpers();

// Get package version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8'),
);

// Create CLI program
const program = new Command();

program
  .name('yaml-templates-cursor-rules-manager')
  .description('Manage cursor rules and MDC files using YAML and Handlebars')
  .version(packageJson.version);

// Initialize command
program
  .command('init')
  .description('Initialize a new YAML templates configuration')
  .option('-d, --dir <directory>', 'Directory to initialize', '.')
  .action((options) => {
    logger.info('Initializing new YAML templates configuration...');
    
    const baseDir = resolve(options.dir);
    const configDir = join(baseDir, 'config');
    const templatesDir = join(baseDir, 'templates');
    const outputDir = join(baseDir, 'output');
    
    // Create directories
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
      logger.info(`Created config directory: ${configDir}`);
    }
    
    if (!existsSync(templatesDir)) {
      mkdirSync(templatesDir, { recursive: true });
      logger.info(`Created templates directory: ${templatesDir}`);
    }
    
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      logger.info(`Created output directory: ${outputDir}`);
    }
    
    // Create example template
    const defaultTemplatePath = join(templatesDir, 'default.hbs');
    if (!existsSync(defaultTemplatePath)) {
      const defaultTemplate = `---
description: {{rule.description}}
{{#if rule.globs}}
globs: {{#each rule.globs}}{{#unless @first}}, {{/unless}}{{this}}{{/each}}
{{/if}}
{{#if rule.alwaysApply}}
alwaysApply: {{rule.alwaysApply}}
{{/if}}
---

{{#if rule.content}}
{{#if (isString rule.content)}}
{{{rule.content}}}
{{else}}
{{#each rule.content}}
{{#if @key}}
- **{{@key}}**
{{/if}}
  {{#if (isString this)}}
  {{this}}
  {{else}}
  {{#each this}}
  - {{this}}
  {{/each}}
  {{/if}}
{{/each}}
{{/if}}
{{/if}}`;
      
      const templateProcessor = new TemplateProcessor();
      templateProcessor.loadTemplateFromString('default', defaultTemplate);
      
      // Create example config
      const exampleConfig: ConfigFile = {
        name: 'example',
        description: 'Example configuration',
        version: '1.0.0',
        templates: ['default'],
        rules: {
          'example-rule': {
            description: 'Example rule for demonstration purposes',
            globs: ['src/**/*.ts', 'src/**/*.tsx'],
            alwaysApply: true,
            content: {
              'Main Points': [
                'This is an example rule',
                'It demonstrates the basic structure',
                'Use this as a template for your own rules'
              ],
              'Examples': [
                '```typescript\n// Example code\nfunction example() {\n  console.log("Hello, world!");\n}\n```'
              ]
            }
          }
        }
      };
      
      const configPath = join(configDir, 'example.yaml');
      YamlParser.saveToFile(exampleConfig, configPath);
      logger.info(`Created example configuration: ${configPath}`);
    }
    
    logger.success('Initialization complete!');
  });

// Generate command
program
  .command('generate')
  .description('Generate MDC files from YAML configurations')
  .option('-c, --config <path>', 'Path to config directory', './config')
  .option('-t, --templates <path>', 'Path to templates directory', './templates')
  .option('-o, --output <path>', 'Output directory for MDC files', './output')
  .action(async (options) => {
    logger.info('Generating MDC files from YAML configurations...');
    
    const syncOptions: SyncOptions = {
      configDir: resolve(options.config),
      templatesDir: resolve(options.templates),
      outputDir: resolve(options.output),
      watch: false
    };
    
    const syncService = new SyncService(syncOptions);
    await syncService.initialize();
    syncService.synchronize();
    
    logger.success('Generation complete!');
  });

// Sync command
program
  .command('sync')
  .description('Synchronize YAML configurations and MDC files')
  .option('-c, --config <path>', 'Path to config directory', './config')
  .option('-t, --templates <path>', 'Path to templates directory', './templates')
  .option('-o, --output <path>', 'Output directory for MDC files', './output')
  .option('-w, --watch', 'Watch for changes and sync automatically', false)
  .action(async (options) => {
    const syncOptions: SyncOptions = {
      configDir: resolve(options.config),
      templatesDir: resolve(options.templates),
      outputDir: resolve(options.output),
      watch: options.watch
    };
    
    const syncService = new SyncService(syncOptions);
    await syncService.initialize();
    
    if (options.watch) {
      logger.info('Watching for changes and syncing automatically...');
      logger.info('Press Ctrl+C to stop watching');
      
      // Keep process alive
      process.on('SIGINT', () => {
        syncService.stop();
        logger.info('Stopped watching');
        process.exit(0);
      });
    } else {
      logger.info('Synchronizing YAML configurations and MDC files...');
      syncService.synchronize();
      logger.success('Synchronization complete!');
    }
  });

// Import command
program
  .command('import')
  .description('Import existing MDC files to YAML configurations')
  .requiredOption('-i, --input <path>', 'Path to MDC files directory')
  .option('-o, --output <path>', 'Output directory for YAML files', './config')
  .option('-n, --name <name>', 'Configuration name', 'imported')
  .action((options) => {
    logger.info('Importing MDC files to YAML configurations...');
    logger.info(`Input directory: ${options.input}`);
    logger.info(`Output directory: ${options.output}`);
    
    // TODO: Implement MDC import logic
    
    logger.success('Import complete!');
  });

// Parse command line arguments
program.parse();

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export core classes
export { ConfigurationInheritanceSystem, ConfigInheritanceOptions } from './core/ConfigurationInheritanceSystem';
export { ConfigManager, ConfigFile, ConfigLevel, ConfigReference } from './core/ConfigManager';
export { InheritanceModel, MergeStrategy, OverrideDirective } from './core/InheritanceModel';
export { ConfigurationMerger } from './core/ConfigurationMerger';
export { ReferenceResolver } from './core/ReferenceResolver';
export { ConflictResolver, ConflictType, ResolutionStrategy, ConfigConflict, ConflictResolutionFn } from './core/ConflictResolver';
export { ValidationLayer, ValidationError, ValidationResult, SchemaValidator } from './core/ValidationLayer';

// Export utils
export { logger } from './utils/logger'; 
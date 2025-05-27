import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { logger } from '../utils/logger';

/**
 * Interface for rendering options
 */
export interface RenderOptions {
  /**
   * Optional template name to use
   */
  template?: string;
  
  /**
   * Optional partials to include
   */
  partials?: Record<string, string>;

  /**
   * Optional helpers to register for this render only
   */
  helpers?: Record<string, Handlebars.HelperDelegate>;
}

/**
 * Interface for template registration options
 */
export interface TemplateRegistrationOptions {
  /**
   * Optional namespace for the template
   */
  namespace?: string;
  
  /**
   * Whether to precompile the template
   */
  precompile?: boolean;
}

/**
 * TemplateProcessor class for handling Handlebars templates
 */
export class TemplateProcessor {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private partials: Map<string, string> = new Map();
  private templateDir: string | null = null;
  private defaultTemplate = 'default';

  /**
   * Create a new TemplateProcessor
   * @param templateDir - Optional path to template directory
   */
  constructor(templateDir?: string) {
    if (templateDir) {
      this.setTemplateDirectory(templateDir);
    }
  }

  /**
   * Set the template directory and load all templates
   * @param templateDir - Path to template directory
   */
  public setTemplateDirectory(templateDir: string): void {
    this.templateDir = templateDir;
    
    if (!existsSync(templateDir)) {
      logger.warn(`Template directory does not exist: ${templateDir}`);
      return;
    }
    
    try {
      // Load all .hbs files from the template directory
      const files = readdirSync(templateDir).filter(file => file.endsWith('.hbs'));
      
      logger.info(`Found ${files.length} template files in ${templateDir}`);
      
      for (const file of files) {
        const name = basename(file, extname(file));
        const filePath = join(templateDir, file);
        this.loadTemplate(name, filePath);
      }
    } catch (error) {
      logger.error(`Failed to load templates from directory: ${templateDir}`, error as Error);
    }
  }

  /**
   * Set the default template name
   * @param name - Default template name
   */
  public setDefaultTemplate(name: string): void {
    if (!this.templates.has(name)) {
      logger.warn(`Template not found for default: ${name}`);
    }
    this.defaultTemplate = name;
  }

  /**
   * Register a helper function with Handlebars
   * @param name - Name of the helper
   * @param fn - Helper function
   */
  public registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn);
    logger.debug(`Registered Handlebars helper: ${name}`);
  }

  /**
   * Register multiple helpers with Handlebars
   * @param helpers - Record of helper names and functions
   */
  public registerHelpers(helpers: Record<string, Handlebars.HelperDelegate>): void {
    for (const [name, fn] of Object.entries(helpers)) {
      this.registerHelper(name, fn);
    }
    logger.debug(`Registered ${Object.keys(helpers).length} Handlebars helpers`);
  }

  /**
   * Register a partial template with Handlebars
   * @param name - Name of the partial
   * @param template - Partial template content
   */
  public registerPartial(name: string, template: string): void {
    Handlebars.registerPartial(name, template);
    this.partials.set(name, template);
    logger.debug(`Registered Handlebars partial: ${name}`);
  }

  /**
   * Register multiple partials with Handlebars
   * @param partials - Record of partial names and content
   */
  public registerPartials(partials: Record<string, string>): void {
    for (const [name, template] of Object.entries(partials)) {
      this.registerPartial(name, template);
    }
    logger.debug(`Registered ${Object.keys(partials).length} Handlebars partials`);
  }

  /**
   * Load partials from a directory
   * @param partialsDir - Directory containing partial templates
   */
  public loadPartialsFromDirectory(partialsDir: string): void {
    if (!existsSync(partialsDir)) {
      logger.warn(`Partials directory does not exist: ${partialsDir}`);
      return;
    }
    
    try {
      // Load all .hbs files from the partials directory
      const files = readdirSync(partialsDir).filter(file => file.endsWith('.hbs'));
      
      logger.info(`Found ${files.length} partial files in ${partialsDir}`);
      
      for (const file of files) {
        const name = basename(file, extname(file));
        const filePath = join(partialsDir, file);
        try {
          const templateContent = readFileSync(filePath, 'utf8');
          this.registerPartial(name, templateContent);
        } catch (error) {
          logger.error(`Failed to load partial from file: ${filePath}`, error as Error);
        }
      }
    } catch (error) {
      logger.error(`Failed to load partials from directory: ${partialsDir}`, error as Error);
    }
  }

  /**
   * Load a template from a file
   * @param name - Name to associate with the template
   * @param filePath - Path to the template file
   * @param options - Optional registration options
   */
  public loadTemplate(name: string, filePath: string, options?: TemplateRegistrationOptions): void {
    try {
      const templateContent = readFileSync(filePath, 'utf8');
      this.loadTemplateFromString(name, templateContent, options);
    } catch (error) {
      logger.error(`Failed to load template from file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Load a template from a string
   * @param name - Name to associate with the template
   * @param content - Template content
   * @param options - Optional registration options
   */
  public loadTemplateFromString(name: string, content: string, options?: TemplateRegistrationOptions): void {
    try {
      const fullName = options?.namespace ? `${options.namespace}/${name}` : name;
      const template = Handlebars.compile(content);
      this.templates.set(fullName, template);
      logger.debug(`Loaded template: ${fullName}`);
    } catch (error) {
      logger.error(`Failed to compile template: ${name}`, error as Error);
      throw error;
    }
  }

  /**
   * Check if a template exists
   * @param name - Name of the template to check
   * @returns True if the template exists
   */
  public hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Get all template names
   * @returns Array of template names
   */
  public getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Render a template with data
   * @param name - Name of the template to render
   * @param data - Data to use for rendering
   * @param options - Optional rendering options
   * @returns Rendered template as string
   */
  public render(name: string, data: Record<string, any>, options?: RenderOptions): string {
    // Determine which template to use
    const templateName = options?.template || name;
    const template = this.templates.get(templateName);
    
    if (!template) {
      // Try default template if the specified one doesn't exist
      if (templateName !== this.defaultTemplate) {
        const defaultTemplate = this.templates.get(this.defaultTemplate);
        if (defaultTemplate) {
          logger.warn(`Template not found: ${templateName}, using default: ${this.defaultTemplate}`);
          return this.renderWithTemplate(defaultTemplate, data, options);
        }
      }
      throw new Error(`Template not found: ${templateName}`);
    }

    return this.renderWithTemplate(template, data, options);
  }

  /**
   * Render with a specific template function
   * @param template - Template function
   * @param data - Data to use for rendering
   * @param options - Optional rendering options
   * @returns Rendered template as string
   */
  private renderWithTemplate(
    template: Handlebars.TemplateDelegate,
    data: Record<string, any>,
    options?: RenderOptions
  ): string {
    try {
      // Register temporary partials if provided
      const registeredPartials: string[] = [];
      if (options?.partials) {
        for (const [name, content] of Object.entries(options.partials)) {
          Handlebars.registerPartial(name, content);
          registeredPartials.push(name);
        }
      }

      // Register temporary helpers if provided
      const registeredHelpers: string[] = [];
      if (options?.helpers) {
        for (const [name, fn] of Object.entries(options.helpers)) {
          Handlebars.registerHelper(name, fn);
          registeredHelpers.push(name);
        }
      }

      // Render the template
      const result = template(data);

      // Clean up temporary partials and helpers
      registeredPartials.forEach(name => Handlebars.unregisterPartial(name));
      registeredHelpers.forEach(name => Handlebars.unregisterHelper(name));

      return result;
    } catch (error) {
      logger.error('Failed to render template', error as Error);
      throw error;
    }
  }

  /**
   * Render a template to a file
   * @param name - Name of the template to render
   * @param data - Data to use for rendering
   * @param outputPath - Path to save the rendered output
   * @param options - Optional rendering options
   */
  public renderToFile(
    name: string,
    data: Record<string, any>,
    outputPath: string,
    options?: RenderOptions
  ): void {
    try {
      const rendered = this.render(name, data, options);
      
      // Create directory if it doesn't exist
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        logger.debug(`Creating directory: ${dir}`);
        const mkdirSync = require('fs').mkdirSync;
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(outputPath, rendered, 'utf8');
      logger.debug(`Rendered template to file: ${outputPath}`);
    } catch (error) {
      logger.error(`Failed to render template to file: ${outputPath}`, error as Error);
      throw error;
    }
  }

  /**
   * Render a string template directly with data
   * @param template - Template string
   * @param data - Data to use for rendering
   * @param options - Optional rendering options
   * @returns Rendered template as string
   */
  public static renderString(
    template: string,
    data: Record<string, any>,
    options?: RenderOptions
  ): string {
    try {
      // Register temporary partials if provided
      const registeredPartials: string[] = [];
      if (options?.partials) {
        for (const [name, content] of Object.entries(options.partials)) {
          Handlebars.registerPartial(name, content);
          registeredPartials.push(name);
        }
      }

      // Register temporary helpers if provided
      const registeredHelpers: string[] = [];
      if (options?.helpers) {
        for (const [name, fn] of Object.entries(options.helpers)) {
          Handlebars.registerHelper(name, fn);
          registeredHelpers.push(name);
        }
      }

      // Compile and render the template
      const compiled = Handlebars.compile(template);
      const result = compiled(data);

      // Clean up temporary partials and helpers
      registeredPartials.forEach(name => Handlebars.unregisterPartial(name));
      registeredHelpers.forEach(name => Handlebars.unregisterHelper(name));

      return result;
    } catch (error) {
      logger.error('Failed to render template string', error as Error);
      throw error;
    }
  }

  /**
   * Check if a partial exists
   * @param name - Name of the partial
   * @returns True if the partial exists
   */
  public hasPartial(name: string): boolean {
    return Handlebars.partials && Handlebars.partials[name] !== undefined;
  }
} 
/**
 * Context Template Parser
 *
 * Utilities for parsing templates and generating context files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from './logger';

// Supported template formats
type TemplateFormat = 'yaml' | 'json' | 'markdown';

// Context data structure (simplified for type checking)
interface ContextData {
  metadata: {
    task_id: string;
    title: string;
    last_updated: string;
    session: number;
    tool_calls_used: number;
    tool_calls_limit: number;
    [key: string]: any;
  };
  current_status: {
    phase: string;
    progress_percentage: number;
    progress_summary: string;
    next_action: string;
    [key: string]: any;
  };
  session_history?: Array<{
    timestamp: string;
    session_number: number;
    actions: Array<{
      description: string;
      type: string;
      details: string;
    }>;
  }>;
  [key: string]: any;
}

/**
 * Options for template generation
 */
interface TemplateOptions {
  format?: TemplateFormat;
  outputPath?: string;
  templatePath?: string;
}

/**
 * Default template options
 */
const defaultTemplateOptions: TemplateOptions = {
  format: 'yaml',
  outputPath: './contexts/',
  templatePath: '../templates/'
};

/**
 * Read a template file based on the specified format
 *
 * @param format The format of the template (yaml, json, markdown)
 * @param templatePath Optional custom template path
 * @returns The template content as a string
 */
export function readTemplate(format: TemplateFormat = 'yaml', templatePath?: string): string {
  const templatesDir = templatePath || path.resolve(__dirname, defaultTemplateOptions.templatePath as string);
  const filename = `context-template.${format}`;
  const templateFilePath = path.join(templatesDir, filename);

  try {
    return fs.readFileSync(templateFilePath, 'utf-8');
  } catch (error) {
    logger.error(`Failed to read template file: ${templateFilePath}`, error);
    throw new Error(`Template file not found: ${filename}`);
  }
}

/**
 * Parse a template string and replace placeholders with actual values
 *
 * @param template The template string
 * @param data The data to inject into the template
 * @param format The format of the template
 * @returns The processed template with placeholders replaced
 */
export function parseTemplate(template: string, data: Partial<ContextData>, format: TemplateFormat = 'yaml'): string {
  if (format === 'markdown') {
    // For markdown, do simple string replacement
    let result = template;

    // Handle metadata
    if (data.metadata) {
      result = result.replace('[TASK_ID]', data.metadata.task_id || '')
                     .replace('[TASK_TITLE]', data.metadata.title || '')
                     .replace('[TIMESTAMP]', data.metadata.last_updated || new Date().toISOString())
                     .replace('[SESSION_NUMBER]', String(data.metadata.session || 1))
                     .replace('[USED]', String(data.metadata.tool_calls_used || 0))
                     .replace('[LIMIT]', String(data.metadata.tool_calls_limit || 25));
    }

    // Handle current status
    if (data.current_status) {
      result = result.replace('[Analysis/Planning/Implementation/Testing/Complete]', data.current_status.phase || 'Planning')
                     .replace('[PERCENTAGE]', String(data.current_status.progress_percentage || 0))
                     .replace('[BRIEF_SUMMARY]', data.current_status.progress_summary || '')
                     .replace('[NEXT_ACTION]', data.current_status.next_action || '');
    }

    // Other placeholders would be replaced similarly based on the data provided
    // For now, we'll keep other placeholders as is

    return result;
  } else if (format === 'yaml') {
    // For YAML, parse the template, merge with data, and convert back to YAML
    try {
      const templateObj = yaml.load(template) as Record<string, any>;
      const merged = deepMerge(templateObj, data);
      return yaml.dump(merged, { indent: 2 });
    } catch (error) {
      logger.error('Failed to parse YAML template', error);
      throw new Error('Failed to process YAML template');
    }
  } else if (format === 'json') {
    // For JSON, parse the template, merge with data, and convert back to JSON
    try {
      const templateObj = JSON.parse(template);
      const merged = deepMerge(templateObj, data);
      return JSON.stringify(merged, null, 2);
    } catch (error) {
      logger.error('Failed to parse JSON template', error);
      throw new Error('Failed to process JSON template');
    }
  }

  throw new Error(`Unsupported template format: ${format}`);
}

/**
 * Generate a context file from a template with the provided data
 *
 * @param data The data to inject into the template
 * @param options Options for template generation
 * @returns The path to the generated context file
 */
export function generateContextFile(data: Partial<ContextData>, options: TemplateOptions = {}): string {
  const format = options.format || defaultTemplateOptions.format as TemplateFormat;
  const outputDir = options.outputPath || defaultTemplateOptions.outputPath as string;

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read the template
  const template = readTemplate(format, options.templatePath);

  // Parse the template with the provided data
  const content = parseTemplate(template, data, format);

  // Generate filename based on task ID
  const taskId = data.metadata?.task_id || 'unknown';
  const filename = `context_${taskId}.${format}`;
  const outputPath = path.join(outputDir, filename);

  // Write the file
  fs.writeFileSync(outputPath, content, 'utf-8');

  logger.info(`Generated context file: ${outputPath}`);
  return outputPath;
}

/**
 * Update an existing context file with new data
 *
 * @param taskId The task ID to update
 * @param data The new data to merge into the existing context
 * @param options Options for template generation
 * @returns The path to the updated context file
 */
export function updateContextFile(taskId: string, data: Partial<ContextData>, options: TemplateOptions = {}): string {
  const format = options.format || defaultTemplateOptions.format as TemplateFormat;
  const outputDir = options.outputPath || defaultTemplateOptions.outputPath as string;

  // Generate filename based on task ID
  const filename = `context_${taskId}.${format}`;
  const filePath = path.join(outputDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // If it doesn't exist, generate a new one
    return generateContextFile({
      ...data,
      metadata: {
        task_id: taskId,
        title: data.metadata?.title || '',
        last_updated: data.metadata?.last_updated || new Date().toISOString(),
        session: data.metadata?.session || 1,
        tool_calls_used: data.metadata?.tool_calls_used || 0,
        tool_calls_limit: data.metadata?.tool_calls_limit || 25,
        ...data.metadata
      }
    }, options);
  }

  // Read existing file
  const existingContent = fs.readFileSync(filePath, 'utf-8');

  // Parse existing content based on format
  let existingData: any;
  try {
    if (format === 'yaml') {
      existingData = yaml.load(existingContent);
    } else if (format === 'json') {
      existingData = JSON.parse(existingContent);
    } else if (format === 'markdown') {
      // For markdown, we'll just append the new session data
      // This is a simplified approach; a more robust solution would parse the markdown

      // Update metadata section
      let updatedContent = existingContent;

      if (data.metadata) {
        // Update session and tool calls
        updatedContent = updatedContent.replace(/\*\*Session:\*\* \d+/, `**Session:** ${data.metadata.session || 1}`)
                                      .replace(/\*\*Tool Calls Used:\*\* \d+\/\d+/,
                                              `**Tool Calls Used:** ${data.metadata.tool_calls_used || 0}/${data.metadata.tool_calls_limit || 25}`)
                                      .replace(/\*\*Last Updated:\*\* .*/,
                                              `**Last Updated:** ${data.metadata.last_updated || new Date().toISOString()}`);
      }

      // Update current status section
      if (data.current_status) {
        // Find current status section and update it
        const statusPattern = /## Current Status[\s\S]*?(?=\n## |$)/;
        const newStatus = `## Current Status
* **Phase:** ${data.current_status.phase || 'Planning'}
* **Progress:** ${data.current_status.progress_percentage || 0}% - ${data.current_status.progress_summary || ''}
* **Next Action:** ${data.current_status.next_action || ''}
`;

        if (statusPattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(statusPattern, newStatus);
        } else {
          // If no status section exists, add it after the metadata
          updatedContent = updatedContent.replace(/\*\*Tool Calls Used:\*\* \d+\/\d+\n\n/,
                                                `**Tool Calls Used:** ${data.metadata?.tool_calls_used || 0}/${data.metadata?.tool_calls_limit || 25}\n\n${newStatus}\n`);
        }
      }

      // Add new session entry if provided in data
      if (data.metadata?.session && data.session_history && data.session_history.length > 0) {
        const sessionActions = data.session_history[0].actions || [];
        const actionsText = sessionActions.map((action: { description: string }) => `- ${action.description || ''}`).join('\n');

        const sessionSection = `
### Session ${data.metadata.session} - ${new Date().toISOString().split('T')[0]}
${actionsText}
`;

        // Find "What I Did" section
        const whatIDidPattern = /## What I Did[\s\S]*?(?=\n## |$)/;
        if (whatIDidPattern.test(updatedContent)) {
          // Append to existing section
          updatedContent = updatedContent.replace(whatIDidPattern, match => `${match.trim()}\n${sessionSection}\n`);
        } else {
          // Add new section after current status
          updatedContent = updatedContent.replace(/## Current Status[\s\S]*?(?=\n## |$)/,
                                                match => `${match.trim()}\n\n## What I Did${sessionSection}\n`);
        }
      }

      // Write updated content to file
      fs.writeFileSync(filePath, updatedContent, 'utf-8');

      logger.info(`Updated markdown context file: ${filePath}`);
      return filePath;
    }
  } catch (error) {
    logger.error(`Failed to parse existing context file: ${filePath}`, error);
    throw new Error(`Failed to update context file: ${taskId}`);
  }

  // For YAML and JSON, merge the existing data with the new data
  if (existingData) {
    const mergedData = deepMerge(existingData, data);

    // Convert merged data back to string
    let updatedContent: string;
    if (format === 'yaml') {
      updatedContent = yaml.dump(mergedData, { indent: 2 });
    } else {
      updatedContent = JSON.stringify(mergedData, null, 2);
    }

    // Write updated content to file
    fs.writeFileSync(filePath, updatedContent, 'utf-8');

    logger.info(`Updated context file: ${filePath}`);
    return filePath;
  }

  throw new Error(`Failed to update context file: ${taskId}`);
}

/**
 * Utility function to deeply merge objects
 *
 * @param target The target object
 * @param source The source object to merge into the target
 * @returns The merged object
 */
function deepMerge(target: any, source: any): any {
  if (!source) return target;

  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        // For arrays, append source items to target array
        output[key] = [...target[key], ...source[key]];
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Check if a value is an object
 *
 * @param item The value to check
 * @returns True if the value is an object, false otherwise
 */
function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export default {
  readTemplate,
  parseTemplate,
  generateContextFile,
  updateContextFile
};

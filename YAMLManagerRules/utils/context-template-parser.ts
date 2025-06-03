/**
 * Context Template Parser
 *
 * Utilities for parsing and generating context files from templates.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { logger } from './logger';
import {
  ContextData,
  ContextFileOptions
} from '../models/context-data';

/**
 * Supported template formats
 */
export type TemplateFormat = 'yaml' | 'json' | 'markdown';

/**
 * Default options
 */
const defaultOptions: ContextFileOptions = {
  format: 'markdown',
  outputPath: path.join(process.cwd(), 'contexts'),
  templateDir: path.join(process.cwd(), 'templates')
};

/**
 * Context Template Parser
 */
const contextTemplateParser = {
  /**
   * Read a template file
   */
  readTemplate(format: TemplateFormat, templateDir: string = defaultOptions.templateDir || ''): string {
    try {
      const templatePath = path.join(templateDir, `context-template.${format}`);
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error(`Error reading template file: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Template file not found');
    }
  },

  /**
   * Parse a template with data
   */
  parseTemplate(template: string, data: Partial<ContextData>, format: TemplateFormat): string {
    switch (format) {
      case 'yaml': {
        // Parse YAML template
        const yamlObj = yaml.load(template) as Record<string, any>;

        // Deep merge data
        const mergedObj = this.deepMerge(yamlObj, data);

        // Convert back to YAML
        return yaml.dump(mergedObj);
      }

      case 'json': {
        // Parse JSON template
        const jsonObj = JSON.parse(template);

        // Deep merge data
        const mergedObj = this.deepMerge(jsonObj, data);

        // Convert back to JSON
        return JSON.stringify(mergedObj, null, 2);
      }

      case 'markdown': {
        // Replace placeholders in markdown template
        let result = template;

        // Replace metadata placeholders
        if (data.metadata) {
          result = result.replace('[TASK_ID]', data.metadata.task_id || '')
            .replace('[TASK_TITLE]', data.metadata.title || '')
            .replace('[TIMESTAMP]', data.metadata.last_updated || '')
            .replace('[SESSION_NUMBER]', String(data.metadata.session || ''))
            .replace('[USED]', String(data.metadata.tool_calls_used || ''))
            .replace('[LIMIT]', String(data.metadata.tool_calls_limit || ''));
        }

        // Replace status placeholders
        if (data.current_status) {
          result = result.replace('[Analysis/Planning/Implementation/Testing/Complete]', data.current_status.phase || '')
            .replace('[PERCENTAGE]', String(data.current_status.progress_percentage || ''))
            .replace('[BRIEF_SUMMARY]', data.current_status.progress_summary || '')
            .replace('[NEXT_ACTION]', data.current_status.next_action || '');
        }

        // Add session history if available
        if (data.session_history && data.session_history.length > 0) {
          let sessionContent = '';

          for (const session of data.session_history) {
            sessionContent += `\n### Session ${session.session_number} - ${session.timestamp}\n`;

            for (const action of session.actions) {
              sessionContent += `- ${action.description}\n`;
            }
          }

          // Insert session content after the Current Status section
          const statusSectionEnd = result.indexOf('* **Next Action:**') + '* **Next Action:**'.length + 50;
          result = result.slice(0, statusSectionEnd) + '\n\n' + sessionContent + result.slice(statusSectionEnd);
        }

        return result;
      }

      default:
        throw new Error('Unsupported template format');
    }
  },

  /**
   * Generate a context file
   */
  generateContextFile(data: Partial<ContextData>, options: ContextFileOptions = {}): string {
    const opts = { ...defaultOptions, ...options };
    const format = opts.format || 'markdown';
    const outputPath = opts.outputPath || 'contexts';

    // Ensure task_id is available in metadata
    if (!data.metadata?.task_id) {
      throw new Error('Task ID is required in metadata');
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Read template
    const template = this.readTemplate(format as TemplateFormat, opts.templateDir);

    // Parse template with data
    const content = this.parseTemplate(template, data, format as TemplateFormat);

    // Generate output file path
    const outputFile = path.join(outputPath, `context_${data.metadata.task_id}.${format}`);

    // Write to file
    fs.writeFileSync(outputFile, content, 'utf-8');

    return outputFile;
  },

  /**
   * Update an existing context file or create a new one
   */
  updateContextFile(taskId: string, data: Partial<ContextData>, options: ContextFileOptions = {}): string {
    const opts = { ...defaultOptions, ...options };
    const format = opts.format || 'markdown';
    const outputPath = opts.outputPath || 'contexts';

    // Ensure task ID is included in the data
    const updatedData = {
      ...data,
      metadata: {
        ...(data.metadata || {}),
        task_id: taskId
      }
    };

    // Check if file exists
    const filePath = path.join(outputPath, `context_${taskId}.${format}`);

    if (!fs.existsSync(filePath)) {
      // If file doesn't exist, create a new one
      return this.generateContextFile(updatedData as ContextData, opts);
    }

    // Read existing file
    const existingContent = fs.readFileSync(filePath, 'utf-8');

    // Parse existing content based on format
    let existingData: Record<string, any>;

    switch (format) {
      case 'yaml':
        existingData = yaml.load(existingContent) as Record<string, any>;
        break;

      case 'json':
        existingData = JSON.parse(existingContent);
        break;

      case 'markdown':
        // For markdown, we'll just append new content rather than trying to parse
        let updatedContent = existingContent;

        // Update metadata section
        if (data.metadata) {
          updatedContent = updatedContent
            .replace(/\*\*Last Updated:\*\*.*/, `**Last Updated:** ${data.metadata.last_updated || ''}`)
            .replace(/\*\*Session:\*\*.*/, `**Session:** ${data.metadata.session || ''}`)
            .replace(/\*\*Tool Calls Used:\*\*.*/, `**Tool Calls Used:** ${data.metadata.tool_calls_used || ''}/${data.metadata.tool_calls_limit || ''}`);

          // Update title if provided
          if (data.metadata.title) {
            updatedContent = updatedContent.replace(/# Context for Task \d+ - .*/, `# Context for Task ${taskId} - ${data.metadata.title}`);
          }
        }

        // Update status section
        if (data.current_status) {
          if (data.current_status.phase) {
            updatedContent = updatedContent.replace(/\* \*\*Phase:\*\*.*/, `* **Phase:** ${data.current_status.phase}`);
          }

          if (data.current_status.progress_percentage !== undefined) {
            const summary = data.current_status.progress_summary ? ` - ${data.current_status.progress_summary}` : '';
            updatedContent = updatedContent.replace(/\* \*\*Progress:\*\*.*/, `* **Progress:** ${data.current_status.progress_percentage}%${summary}`);
          }

          if (data.current_status.next_action) {
            updatedContent = updatedContent.replace(/\* \*\*Next Action:\*\*.*/, `* **Next Action:** ${data.current_status.next_action}`);
          }
        }

        // Add session history if available
        if (data.session_history && data.session_history.length > 0) {
          let sessionContent = '';

          for (const session of data.session_history) {
            sessionContent += `\n### Session ${session.session_number} - ${session.timestamp}\n`;

            for (const action of session.actions) {
              sessionContent += `- ${action.description}\n`;
            }
          }

          // Find where to insert the session content
          const nextActionIndex = updatedContent.indexOf('* **Next Action:**');
          if (nextActionIndex !== -1) {
            // Find the end of the line
            const lineEnd = updatedContent.indexOf('\n', nextActionIndex);

            // Insert session content after the Next Action line
            updatedContent = updatedContent.slice(0, lineEnd + 1) +
              '\n' + sessionContent +
              updatedContent.slice(lineEnd + 1);
          } else {
            // If Next Action not found, just append to the end
            updatedContent += '\n' + sessionContent;
          }
        }

        // Write updated content
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        return filePath;
    }

    // For YAML and JSON, merge data
    const mergedData = this.deepMerge(existingData, updatedData);

    // Convert back to string
    let newContent: string;

    if (format === 'yaml') {
      newContent = yaml.dump(mergedData);
    } else {
      newContent = JSON.stringify(mergedData, null, 2);
    }

    // Write to file
    fs.writeFileSync(filePath, newContent, 'utf-8');

    return filePath;
  },

  /**
   * Deep merge two objects
   */
  deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }
};

/**
 * Check if a value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default contextTemplateParser;

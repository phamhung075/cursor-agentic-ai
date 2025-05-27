import Handlebars from 'handlebars';
import { logger } from './logger';

/**
 * Register all custom Handlebars helpers
 */
export function registerHelpers(): void {
  // Type checking helpers
  Handlebars.registerHelper('isString', function(value) {
    return typeof value === 'string';
  });

  Handlebars.registerHelper('isArray', function(value) {
    return Array.isArray(value);
  });

  Handlebars.registerHelper('isObject', function(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  });

  Handlebars.registerHelper('isNumber', function(value) {
    return typeof value === 'number';
  });

  Handlebars.registerHelper('isBoolean', function(value) {
    return typeof value === 'boolean';
  });

  // Date and time helpers
  Handlebars.registerHelper('formatDate', function(date) {
    const now = date ? new Date(date) : new Date();
    if (isNaN(now.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  Handlebars.registerHelper('formatDateTime', function(date) {
    const now = date ? new Date(date) : new Date();
    if (isNaN(now.getTime())) {
      return new Date().toISOString().replace('T', ' ').split('.')[0];
    }
    return now.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:MM:SS
  });

  // String formatting helpers
  Handlebars.registerHelper('titleCase', function(str) {
    if (typeof str !== 'string') return '';
    return str
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  Handlebars.registerHelper('camelCase', function(str) {
    if (typeof str !== 'string') return '';
    return str
      .split(/[\s_-]+/)
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  });

  Handlebars.registerHelper('kebabCase', function(str) {
    if (typeof str !== 'string') return '';
    return str
      .split(/[\s_]+/)
      .map(word => word.toLowerCase())
      .join('-');
  });

  Handlebars.registerHelper('snakeCase', function(str) {
    if (typeof str !== 'string') return '';
    return str
      .split(/[\s-]+/)
      .map(word => word.toLowerCase())
      .join('_');
  });

  // MDC-specific formatting helpers
  Handlebars.registerHelper('mdBold', function(str) {
    if (typeof str !== 'string') return '';
    return `**${str}**`;
  });

  Handlebars.registerHelper('mdItalic', function(str) {
    if (typeof str !== 'string') return '';
    return `*${str}*`;
  });

  Handlebars.registerHelper('mdCode', function(str) {
    if (typeof str !== 'string') return '';
    return `\`${str}\``;
  });

  Handlebars.registerHelper('mdCodeBlock', function(str, language) {
    if (typeof str !== 'string') return '';
    const lang = typeof language === 'string' ? language : '';
    return `\`\`\`${lang}\n${str}\n\`\`\``;
  });

  Handlebars.registerHelper('mdLink', function(text, url) {
    if (typeof text !== 'string' || typeof url !== 'string') return '';
    return `[${text}](${url})`;
  });

  Handlebars.registerHelper('mdcLink', function(text, path) {
    if (typeof text !== 'string' || typeof path !== 'string') return '';
    return `[${text}](mdc:${path})`;
  });

  Handlebars.registerHelper('mdList', function(items) {
    if (!Array.isArray(items)) return '';
    return items.map(item => `- ${item}`).join('\n');
  });

  Handlebars.registerHelper('mdNumberedList', function(items) {
    if (!Array.isArray(items)) return '';
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  });

  // Conditional and comparison helpers
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });

  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper('lte', function(a, b) {
    return a <= b;
  });

  Handlebars.registerHelper('gte', function(a, b) {
    return a >= b;
  });

  Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });

  Handlebars.registerHelper('not', function(value) {
    return !value;
  });

  // Collection and object helpers
  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
  });

  Handlebars.registerHelper('get', function(obj, key) {
    if (!obj || typeof obj !== 'object') return undefined;
    return obj[key];
  });

  Handlebars.registerHelper('keys', function(obj) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  });

  Handlebars.registerHelper('values', function(obj) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.values(obj);
  });

  Handlebars.registerHelper('entries', function(obj) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj);
  });

  Handlebars.registerHelper('join', function(arr, separator) {
    if (!Array.isArray(arr)) return '';
    return arr.join(separator);
  });

  Handlebars.registerHelper('concat', function() {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.join('');
  });

  // MDC-specific structural helpers
  Handlebars.registerHelper('mdcHeader', function(options) {
    const title = options.hash.title || '';
    const description = options.hash.description || '';
    const globs = options.hash.globs || '';
    const alwaysApply = options.hash.alwaysApply !== undefined ? options.hash.alwaysApply : false;
    
    let header = '---\n';
    if (title) header += `title: ${title}\n`;
    if (description) header += `description: ${description}\n`;
    if (globs) header += `globs: ${globs}\n`;
    if (alwaysApply) header += `alwaysApply: ${alwaysApply}\n`;
    header += '---\n\n';
    
    return new Handlebars.SafeString(header);
  });

  Handlebars.registerHelper('mdcSection', function(title, options) {
    const content = options.fn(this);
    let section = '';
    
    if (title) {
      section += `## ${title}\n\n`;
    }
    
    section += `${content}\n`;
    
    return new Handlebars.SafeString(section);
  });

  Handlebars.registerHelper('mdcCodeExample', function(options) {
    const language = options.hash.language || 'typescript';
    const good = options.hash.good || '';
    const bad = options.hash.bad || '';
    
    let example = '';
    
    if (good) {
      example += `\`\`\`${language}\n// ✅ DO: ${options.hash.goodTitle || 'Good example'}\n${good}\n\`\`\`\n\n`;
    }
    
    if (bad) {
      example += `\`\`\`${language}\n// ❌ DON'T: ${options.hash.badTitle || 'Bad example'}\n${bad}\n\`\`\`\n`;
    }
    
    return new Handlebars.SafeString(example);
  });

  // Log available helpers for debugging
  logger.debug(`Registered ${Object.keys(Handlebars.helpers).length} Handlebars helpers`);
} 
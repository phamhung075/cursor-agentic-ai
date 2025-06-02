/**
 * Default Configuration
 *
 * Default configuration settings for the Cursor Rules Management System.
 */

export default {
  /**
   * Application settings
   */
  app: {
    name: 'Cursor Rules Management System',
    version: '0.1.0',
  },

  /**
   * Rule library settings
   */
  ruleLibrary: {
    basePath: '.cursor/rules',
    scanPaths: [
      '.cursor/rules/**/*.mdc',
      '.cursor/rules/**/*.yaml',
      '.cursor/rules/**/*.yml',
    ],
    excludePaths: [
      '**/node_modules/**',
      '**/.git/**',
    ],
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour in milliseconds
  },

  /**
   * Context detection settings
   */
  contextDetection: {
    maxFilesToScan: 10000,
    scanTimeoutMs: 5000,
    confidenceThreshold: 0.7,
  },

  /**
   * Composition engine settings
   */
  compositionEngine: {
    priorityLevels: {
      base: { min: 100, max: 199 },
      technology: { min: 200, max: 299 },
      domain: { min: 300, max: 399 },
      crossCutting: { min: 400, max: 499 },
      quality: { min: 500, max: 599 },
      deployment: { min: 600, max: 699 },
    },
    mergeStrategy: 'intelligent',
  },

  /**
   * Logging settings
   */
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    format: 'text', // 'text' | 'json'
    timestamps: true,
  },
};

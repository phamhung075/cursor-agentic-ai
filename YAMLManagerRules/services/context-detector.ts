/**
 * Context Detector Service
 *
 * Service for detecting project context by analyzing project files and structure.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectContext,
  ProjectType,
  TechnologyCategory,
  DetectedFileType,
  ContextDetectionOptions,
  defaultContextDetectionOptions,
  ContextDetectionResult,
  DetectionStrategyResult
} from '../models/context';
import { logger } from '../utils/logger';
import { DetectionStrategy } from './strategies/detection-strategy';
import { PackageJsonStrategy } from './strategies/package-json-strategy';
import { TypeScriptStrategy } from './strategies/typescript-strategy';
import { TestingStrategy } from './strategies/testing-strategy';
import { FrontendStrategy } from './strategies/frontend-strategy';

/**
 * Cache item for context detection
 */
interface ContextCacheItem {
  /** Detected context */
  context: ProjectContext;
  /** Timestamp when the cache was created */
  timestamp: number;
  /** Map of file paths to modification times */
  fileModificationTimes: Map<string, number>;
}

/**
 * Context Detector Service
 */
export class ContextDetector {
  private strategies: DetectionStrategy[] = [];
  private cache = new Map<string, ContextCacheItem>();
  private options: ContextDetectionOptions;

  /**
   * Create a new context detector
   */
  constructor(options: Partial<ContextDetectionOptions> = {}) {
    this.options = { ...defaultContextDetectionOptions, ...options };
    this.registerDefaultStrategies();
  }

  /**
   * Register default detection strategies
   */
  private registerDefaultStrategies(): void {
    // Register built-in strategies
    this.registerStrategy(new PackageJsonStrategy());
    this.registerStrategy(new TypeScriptStrategy());
    this.registerStrategy(new TestingStrategy());
    this.registerStrategy(new FrontendStrategy());

    // More strategies will be added here
  }

  /**
   * Register a detection strategy
   */
  public registerStrategy(strategy: DetectionStrategy): void {
    this.strategies.push(strategy);

    // Sort strategies by priority (highest first)
    this.strategies.sort((a, b) => b.priority - a.priority);

    logger.debug(`Registered detection strategy: ${strategy.name} (priority: ${strategy.priority})`);
  }

  /**
   * Get all registered strategies
   */
  public getStrategies(): DetectionStrategy[] {
    return [...this.strategies];
  }

  /**
   * Clear the context cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.debug('Context cache cleared');
  }

  /**
   * Check if a cached context is still valid
   */
  private isCacheValid(projectPath: string, cacheItem: ContextCacheItem): boolean {
    // Cache expiration (12 hours)
    const cacheExpirationMs = 12 * 60 * 60 * 1000;
    const now = Date.now();

    if (now - cacheItem.timestamp > cacheExpirationMs) {
      logger.debug(`Cache expired for ${projectPath}`);
      return false;
    }

    // Check if important files have been modified
    for (const [filePath, modTime] of cacheItem.fileModificationTimes.entries()) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs > modTime) {
            logger.debug(`File changed, invalidating cache: ${filePath}`);
            return false;
          }
        } else {
          // File was deleted
          logger.debug(`File deleted, invalidating cache: ${filePath}`);
          return false;
        }
      } catch (error) {
        logger.debug(`Error checking file ${filePath}, invalidating cache: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Create a cache entry for a context
   */
  private createCacheEntry(projectPath: string, context: ProjectContext): ContextCacheItem {
    const fileModificationTimes = new Map<string, number>();

    // Track package.json, tsconfig.json, and other important files
    const importantFiles = [
      'package.json',
      'tsconfig.json',
      'angular.json',
      'next.config.js',
      'vue.config.js',
      '.eslintrc.js',
      '.eslintrc.json',
      'jest.config.js',
      'webpack.config.js'
    ];

    // Add modification times for important files
    for (const file of importantFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          fileModificationTimes.set(filePath, stats.mtimeMs);
        } catch (error) {
          logger.debug(`Error getting stats for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Add config files from context
    for (const configFile of context.configFiles) {
      if (!fileModificationTimes.has(configFile) && fs.existsSync(configFile)) {
        try {
          const stats = fs.statSync(configFile);
          fileModificationTimes.set(configFile, stats.mtimeMs);
        } catch (error) {
          logger.debug(`Error getting stats for ${configFile}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      context,
      timestamp: Date.now(),
      fileModificationTimes
    };
  }

  /**
   * Detect the context of a project
   */
  public async detectContext(projectPath: string): Promise<ContextDetectionResult> {
    const startTime = Date.now();
    const absolutePath = path.resolve(projectPath);
    const warnings: string[] = [];

    // Check if directory exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Project directory does not exist: ${absolutePath}`);
    }

    // Check cache if enabled
    if (this.options.useCache && this.cache.has(absolutePath)) {
      const cacheItem = this.cache.get(absolutePath)!;

      if (this.isCacheValid(absolutePath, cacheItem)) {
        logger.debug(`Using cached context for ${absolutePath}`);
        return {
          context: cacheItem.context,
          fromCache: true,
          detectionTimeMs: 0
        };
      }
    }

    // Find applicable strategies
    const applicableStrategies: DetectionStrategy[] = [];
    for (const strategy of this.strategies) {
      try {
        if (await strategy.canApply(absolutePath)) {
          applicableStrategies.push(strategy);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`Strategy ${strategy.name} check failed: ${errorMessage}`);
        logger.error(`Error checking if strategy ${strategy.name} can apply: ${errorMessage}`);
      }
    }

    if (applicableStrategies.length === 0) {
      logger.warn(`No applicable detection strategies found for ${absolutePath}`);
      warnings.push('No applicable detection strategies found');
    }

    // Run strategies
    const strategyResults: Record<string, DetectionStrategyResult> = {};
    let combinedResult: DetectionStrategyResult = {
      technologies: [],
      configFiles: []
    };

    for (const strategy of applicableStrategies) {
      try {
        logger.debug(`Running detection strategy: ${strategy.name}`);
        const result = await strategy.detect(absolutePath, combinedResult);
        strategyResults[strategy.name] = result;

        // Combine results
        combinedResult = this.combineResults(combinedResult, result, strategy.weight);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warnings.push(`Strategy ${strategy.name} failed: ${errorMessage}`);
        logger.error(`Error running strategy ${strategy.name}: ${errorMessage}`);
      }
    }

    // Analyze file types if enabled
    let fileTypes: DetectedFileType[] = [];
    if (this.options.analyzeFileTypes) {
      fileTypes = await this.analyzeFileTypes(absolutePath);
    }

    // Create context from combined results
    const context: ProjectContext = {
      projectPath: absolutePath,
      projectType: combinedResult.projectType?.type || ProjectType.UNKNOWN,
      projectTypeConfidence: combinedResult.projectType?.confidence || 0.5,
      technologies: this.categorizeDetectedTechnologies(combinedResult.technologies || []),
      fileTypes,
      configFiles: combinedResult.configFiles || [],
      lastUpdated: new Date(),
      metadata: combinedResult.metadata || {}
    };

    // Cache the result if caching is enabled
    if (this.options.useCache) {
      this.cache.set(absolutePath, this.createCacheEntry(absolutePath, context));
    }

    const detectionTimeMs = Date.now() - startTime;

    return {
      context,
      fromCache: false,
      detectionTimeMs,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Combine multiple detection results
   */
  private combineResults(
    base: DetectionStrategyResult,
    newResult: DetectionStrategyResult,
    weight: number
  ): DetectionStrategyResult {
    const result: DetectionStrategyResult = {
      technologies: [...(base.technologies || [])],
      configFiles: [...(base.configFiles || [])],
      metadata: { ...(base.metadata || {}) }
    };

    // Add new technologies, avoid duplicates
    if (newResult.technologies) {
      for (const tech of newResult.technologies) {
        const existing = result.technologies?.find(t => t.name === tech.name);

        if (!existing) {
          // New technology
          result.technologies?.push(tech);
        } else {
          // Merge with existing, weighted average of confidence
          existing.confidence = (existing.confidence + tech.confidence * weight) / (1 + weight);

          // Keep higher version if available
          if (tech.version && (!existing.version || this.compareVersions(tech.version, existing.version) > 0)) {
            existing.version = tech.version;
          }

          // Merge details
          existing.details = { ...(existing.details || {}), ...(tech.details || {}) };
        }
      }
    }

    // Add new config files, avoid duplicates
    if (newResult.configFiles) {
      for (const file of newResult.configFiles) {
        if (!result.configFiles?.includes(file)) {
          result.configFiles?.push(file);
        }
      }
    }

    // Project type determination
    if (newResult.projectType) {
      if (!base.projectType || newResult.projectType.confidence > base.projectType.confidence) {
        result.projectType = newResult.projectType;
      }
    }

    // Merge metadata
    if (newResult.metadata) {
      result.metadata = { ...(result.metadata || {}), ...(newResult.metadata || {}) };
    }

    return result;
  }

  /**
   * Compare two version strings
   * Returns: -1 if a < b, 0 if a == b, 1 if a > b
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(part => parseInt(part, 10));
    const bParts = b.split('.').map(part => parseInt(part, 10));

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = i < aParts.length ? aParts[i] : 0;
      const bVal = i < bParts.length ? bParts[i] : 0;

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }

    return 0;
  }

  /**
   * Categorize detected technologies by category
   */
  private categorizeDetectedTechnologies(technologies: any[]): Record<TechnologyCategory, any[]> {
    const categorized: Record<TechnologyCategory, any[]> = Object.values(TechnologyCategory).reduce(
      (acc, category) => ({ ...acc, [category]: [] }),
      {} as Record<TechnologyCategory, any[]>
    );

    for (const tech of technologies) {
      const category = (tech.details?.category || TechnologyCategory.OTHER) as TechnologyCategory;
      categorized[category].push(tech);
    }

    return categorized;
  }

  /**
   * Analyze file types in a project
   */
  private async analyzeFileTypes(projectPath: string): Promise<DetectedFileType[]> {
    const fileTypes = new Map<string, number>();
    let totalFiles = 0;

    const scanDirectory = (dirPath: string, depth: number = 0): void => {
      if (depth > (this.options.maxDepth || 5)) {
        return;
      }

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          if (this.options.excludeDirs?.includes(entry.name)) {
            continue;
          }

          scanDirectory(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Count file types
          const ext = path.extname(entry.name).toLowerCase();
          fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
          totalFiles++;
        }
      }
    };

    try {
      scanDirectory(projectPath);
    } catch (error) {
      logger.error(`Error analyzing file types: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert to array with percentages
    return Array.from(fileTypes.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalFiles > 0 ? (count / totalFiles) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }
}

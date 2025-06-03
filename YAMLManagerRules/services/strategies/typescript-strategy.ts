/**
 * TypeScript Detection Strategy
 *
 * Detects TypeScript projects by analyzing tsconfig.json and related files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseDetectionStrategy } from './detection-strategy';
import {
  DetectionStrategyResult,
  ProjectType,
  TechnologyCategory,
  DetectedTechnology
} from '../../models/context';
import { logger } from '../../utils/logger';

/**
 * TypeScript project detection strategy
 */
export class TypeScriptStrategy extends BaseDetectionStrategy {
  /**
   * Create a new TypeScript detection strategy
   */
  constructor() {
    super('typescript', 8, 0.7); // High priority but below package.json
  }

  /**
   * Check if this strategy can be applied to the given project path
   */
  async canApply(projectPath: string): Promise<boolean> {
    // Check for tsconfig.json
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    return fs.existsSync(tsconfigPath);
  }

  /**
   * Detect context information from TypeScript configuration
   */
  async detect(projectPath: string): Promise<DetectionStrategyResult> {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    const result: DetectionStrategyResult = {
      technologies: [],
      configFiles: [tsconfigPath]
    };

    try {
      // Read and parse tsconfig.json
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      // Detect TypeScript
      result.technologies = [{
        name: 'TypeScript',
        confidence: 0.95, // Very high confidence when tsconfig.json exists
        details: {
          category: TechnologyCategory.LANGUAGE
        }
      }];

      // Check TypeScript target version
      if (tsconfig.compilerOptions?.target) {
        const target = tsconfig.compilerOptions.target.toLowerCase();
        result.technologies[0].details = {
          ...result.technologies[0].details,
          target,
          strict: !!tsconfig.compilerOptions.strict
        };
      }

      // Check for module type (ESM vs CommonJS)
      if (tsconfig.compilerOptions?.module) {
        const moduleType = tsconfig.compilerOptions.module.toLowerCase();
        result.technologies[0].details = {
          ...result.technologies[0].details,
          moduleType
        };
      }

      // Look for .d.ts files to detect if it's a types package
      const isTypesPackage = this.checkForTypeDefinitions(projectPath);
      if (isTypesPackage) {
        result.projectType = {
          type: ProjectType.LIBRARY,
          confidence: 0.7
        };
        result.technologies[0].details = {
          ...result.technologies[0].details,
          isTypesPackage: true
        };
      }

      // Check for React TypeScript
      if (this.isReactTypeScript(projectPath, tsconfig)) {
        result.technologies.push({
          name: 'React',
          confidence: 0.8,
          details: {
            category: TechnologyCategory.FRAMEWORK,
            typescript: true
          }
        });
      }

      // Additional metadata about the TypeScript configuration
      result.metadata = {
        tsconfigOptions: tsconfig.compilerOptions || {},
        includePatterns: tsconfig.include || [],
        excludePatterns: tsconfig.exclude || []
      };

      return result;
    } catch (error) {
      logger.error(`Error detecting TypeScript context: ${error instanceof Error ? error.message : String(error)}`);
      // Still return that TypeScript is detected but with lower confidence
      return {
        technologies: [{
          name: 'TypeScript',
          confidence: 0.7, // Lower confidence due to error
          details: {
            category: TechnologyCategory.LANGUAGE,
            error: error instanceof Error ? error.message : String(error)
          }
        }],
        configFiles: [tsconfigPath]
      };
    }
  }

  /**
   * Check if the project contains type definition files
   */
  private checkForTypeDefinitions(projectPath: string): boolean {
    try {
      // Check if package.json has types or typings field
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.types || packageJson.typings) {
          return true;
        }
      }

      // Look for .d.ts files in the project root and top-level directories
      const entries = fs.readdirSync(projectPath, { withFileTypes: true });

      // Check root directory
      const hasDtsInRoot = entries.some(entry =>
        entry.isFile() && entry.name.endsWith('.d.ts')
      );

      if (hasDtsInRoot) return true;

      // Check src or types directory if exists
      for (const dir of ['src', 'types', 'typings']) {
        const dirPath = path.join(projectPath, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });
          if (dirEntries.some(entry => entry.isFile() && entry.name.endsWith('.d.ts'))) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.debug(`Error checking for type definitions: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if the project is using React with TypeScript
   */
  private isReactTypeScript(projectPath: string, tsconfig: any): boolean {
    try {
      // Check for JSX settings in tsconfig
      if (tsconfig.compilerOptions?.jsx) {
        return true;
      }

      // Check for React-specific types
      const hasReactTypes = fs.existsSync(path.join(projectPath, 'node_modules', '@types', 'react'));
      if (hasReactTypes) {
        return true;
      }

      // Check for .tsx files
      const srcDir = path.join(projectPath, 'src');
      if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
        const hasTsxFiles = this.directoryHasExtension(srcDir, '.tsx');
        if (hasTsxFiles) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.debug(`Error checking for React TypeScript: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if a directory contains files with a specific extension
   */
  private directoryHasExtension(dirPath: string, extension: string): boolean {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(extension)) {
          return true;
        } else if (entry.isDirectory()) {
          // Recursively check subdirectories, but only one level deep
          const subDirPath = path.join(dirPath, entry.name);
          const subEntries = fs.readdirSync(subDirPath, { withFileTypes: true });
          if (subEntries.some(e => e.isFile() && e.name.endsWith(extension))) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.debug(`Error checking directory for extension ${extension}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
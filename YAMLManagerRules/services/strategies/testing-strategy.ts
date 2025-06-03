/**
 * Testing Framework Detection Strategy
 *
 * Detects testing frameworks like Jest, Mocha, Vitest, etc. in a project.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseDetectionStrategy } from './detection-strategy';
import {
  DetectionStrategyResult,
  TechnologyCategory
} from '../../models/context';
import { logger } from '../../utils/logger';

/**
 * Testing framework configurations
 */
interface TestFramework {
  name: string;
  configFiles: string[];
  packagePatterns: string[];
  filePatterns: string[];
}

/**
 * Known testing frameworks
 */
const TEST_FRAMEWORKS: TestFramework[] = [
  {
    name: 'Jest',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json', 'jest.setup.js', 'jest.setup.ts'],
    packagePatterns: ['jest', '@jest/core', 'ts-jest'],
    filePatterns: ['.test.js', '.test.ts', '.test.jsx', '.test.tsx', '.spec.js', '.spec.ts', '.spec.jsx', '.spec.tsx']
  },
  {
    name: 'Mocha',
    configFiles: ['.mocharc.js', '.mocharc.json', '.mocharc.yml', 'mocha.opts'],
    packagePatterns: ['mocha', '@types/mocha'],
    filePatterns: ['.test.js', '.test.ts', '.spec.js', '.spec.ts']
  },
  {
    name: 'Jasmine',
    configFiles: ['jasmine.json', 'spec/support/jasmine.json'],
    packagePatterns: ['jasmine', '@types/jasmine'],
    filePatterns: ['.spec.js', '.spec.ts']
  },
  {
    name: 'Vitest',
    configFiles: ['vitest.config.js', 'vitest.config.ts'],
    packagePatterns: ['vitest'],
    filePatterns: ['.test.js', '.test.ts', '.spec.js', '.spec.ts']
  },
  {
    name: 'AVA',
    configFiles: ['ava.config.js', 'ava.config.cjs', 'ava.config.mjs'],
    packagePatterns: ['ava'],
    filePatterns: ['.test.js', '.test.ts']
  },
  {
    name: 'Cypress',
    configFiles: ['cypress.config.js', 'cypress.config.ts', 'cypress.json'],
    packagePatterns: ['cypress'],
    filePatterns: ['cypress/integration', 'cypress/e2e']
  },
  {
    name: 'Playwright',
    configFiles: ['playwright.config.js', 'playwright.config.ts'],
    packagePatterns: ['@playwright/test'],
    filePatterns: ['.spec.js', '.spec.ts', 'tests/e2e']
  }
];

/**
 * Strategy for detecting testing frameworks
 */
export class TestingStrategy extends BaseDetectionStrategy {
  /**
   * Create a new testing framework detection strategy
   */
  constructor() {
    super('testing-frameworks', 6, 0.6);
  }

  /**
   * Check if this strategy can be applied to the given project path
   */
  async canApply(projectPath: string): Promise<boolean> {
    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return true;
    }

    // Check for common test directories
    const testDirs = ['test', 'tests', 'spec', 'specs', '__tests__'];
    for (const dir of testDirs) {
      if (fs.existsSync(path.join(projectPath, dir))) {
        return true;
      }
    }

    // Check for common test config files
    for (const framework of TEST_FRAMEWORKS) {
      for (const configFile of framework.configFiles) {
        if (fs.existsSync(path.join(projectPath, configFile))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Detect testing frameworks in the project
   */
  async detect(projectPath: string): Promise<DetectionStrategyResult> {
    const result: DetectionStrategyResult = {
      technologies: [],
      configFiles: []
    };

    try {
      const frameworkDetections = await Promise.all(
        TEST_FRAMEWORKS.map(framework => this.detectFramework(projectPath, framework))
      );

      // Add detected frameworks to results
      for (const detection of frameworkDetections) {
        if (detection.detected) {
          if (!result.technologies) {
            result.technologies = [];
          }

          result.technologies.push({
            name: detection.name,
            confidence: detection.confidence,
            details: {
              category: TechnologyCategory.TEST_TOOL,
              configFiles: detection.configFiles,
              detectionMethod: detection.detectionMethod
            }
          });

          // Add config files
          if (detection.configFiles && detection.configFiles.length > 0) {
            if (!result.configFiles) {
              result.configFiles = [];
            }

            result.configFiles.push(...detection.configFiles);
          }
        }
      }

      // Look for assertion libraries
      const assertionLibraries = await this.detectAssertionLibraries(projectPath);
      if (assertionLibraries.length > 0) {
        if (!result.technologies) {
          result.technologies = [];
        }
        result.technologies.push(...assertionLibraries);
      }

      return result;
    } catch (error) {
      logger.error(`Error detecting testing frameworks: ${error instanceof Error ? error.message : String(error)}`);
      return {
        technologies: [],
        configFiles: []
      };
    }
  }

  /**
   * Detect a specific testing framework
   */
  private async detectFramework(
    projectPath: string,
    framework: TestFramework
  ): Promise<{
    name: string;
    detected: boolean;
    confidence: number;
    configFiles: string[];
    detectionMethod: string[];
  }> {
    const result = {
      name: framework.name,
      detected: false,
      confidence: 0,
      configFiles: [] as string[],
      detectionMethod: [] as string[]
    };

    try {
      // Check for config files
      for (const configFile of framework.configFiles) {
        const configPath = path.join(projectPath, configFile);
        if (fs.existsSync(configPath)) {
          result.detected = true;
          result.confidence = Math.max(result.confidence, 0.9); // High confidence with config file
          result.configFiles.push(configPath);
          result.detectionMethod.push('config_file');
        }
      }

      // Check in package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        };

        // Check for framework packages
        for (const packagePattern of framework.packagePatterns) {
          if (Object.keys(allDeps).some(dep => dep === packagePattern || dep.startsWith(`${packagePattern}/`))) {
            result.detected = true;
            result.confidence = Math.max(result.confidence, 0.8); // Good confidence with package
            result.detectionMethod.push('package_dependency');
          }
        }

        // Check scripts for test commands
        if (packageJson.scripts) {
          const testScript = packageJson.scripts.test;
          if (testScript && framework.packagePatterns.some(pattern => testScript.includes(pattern))) {
            result.detected = true;
            result.confidence = Math.max(result.confidence, 0.85); // Better confidence with test script
            result.detectionMethod.push('test_script');
          }
        }
      }

      // Look for test files matching patterns
      if (!result.detected) {
        const hasMatchingFiles = await this.checkForTestFiles(projectPath, framework.filePatterns);
        if (hasMatchingFiles) {
          result.detected = true;
          result.confidence = Math.max(result.confidence, 0.7); // Medium confidence with just files
          result.detectionMethod.push('matching_files');
        }
      }

      return result;
    } catch (error) {
      logger.debug(`Error detecting ${framework.name}: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Check for test files matching patterns
   */
  private async checkForTestFiles(projectPath: string, patterns: string[]): Promise<boolean> {
    // Common test directories
    const testDirs = ['test', 'tests', 'spec', 'specs', '__tests__', 'src'];

    try {
      // Check test directories first
      for (const dir of testDirs) {
        const dirPath = path.join(projectPath, dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          if (await this.directoryHasFilePatterns(dirPath, patterns)) {
            return true;
          }
        }
      }

      // Check src directory and subdirectories
      const srcPath = path.join(projectPath, 'src');
      if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
        return await this.directoryHasFilePatterns(srcPath, patterns, true);
      }

      return false;
    } catch (error) {
      logger.debug(`Error checking for test files: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if a directory has files matching any of the patterns
   */
  private async directoryHasFilePatterns(
    dirPath: string,
    patterns: string[],
    recursive: boolean = false,
    depth: number = 0
  ): Promise<boolean> {
    if (depth > 3) return false; // Limit recursion depth

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          // Check if file matches any pattern
          if (patterns.some(pattern => {
            // Check for directory patterns (like 'cypress/integration')
            if (pattern.includes('/')) {
              return dirPath.includes(pattern);
            }
            // Check file extension patterns
            return entry.name.endsWith(pattern);
          })) {
            return true;
          }
        } else if (recursive && entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);
          if (await this.directoryHasFilePatterns(subDirPath, patterns, true, depth + 1)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.debug(`Error checking directory for file patterns: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Detect assertion libraries used in the project
   */
  private async detectAssertionLibraries(projectPath: string): Promise<any[]> {
    const assertionLibraries = [
      { name: 'Chai', packageName: 'chai', category: TechnologyCategory.TEST_TOOL },
      { name: 'Sinon', packageName: 'sinon', category: TechnologyCategory.TEST_TOOL },
      { name: 'Enzyme', packageName: 'enzyme', category: TechnologyCategory.TEST_TOOL },
      { name: 'Testing Library', packageName: '@testing-library/react', category: TechnologyCategory.TEST_TOOL },
      { name: 'Supertest', packageName: 'supertest', category: TechnologyCategory.TEST_TOOL }
    ];

    const result: any[] = [];
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        };

        for (const library of assertionLibraries) {
          if (Object.keys(allDeps).some(dep =>
            dep === library.packageName ||
            (library.packageName.startsWith('@') && dep.startsWith(library.packageName.split('/')[0])))) {
            result.push({
              name: library.name,
              confidence: 0.8,
              details: {
                category: library.category
              }
            });
          }
        }
      }

      return result;
    } catch (error) {
      logger.debug(`Error detecting assertion libraries: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

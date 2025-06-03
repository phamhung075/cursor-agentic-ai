/**
 * Tests for Context Detector Service
 */

import * as fs from 'fs';
import * as path from 'path';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';
import { ContextDetector } from '../../services/context-detector';
import { ProjectType, TechnologyCategory } from '../../models/context';
import { BaseDetectionStrategy } from '../../services/strategies/detection-strategy';

// Mock dependencies
jest.mock('fs');
jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/'))
  };
});
jest.mock('../../utils/logger');

// Cast mocked modules
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

// Mock detection strategies
class MockStrategy extends BaseDetectionStrategy {
  constructor(name: string, priority: number = 0, weight: number = 1) {
    super(name, priority, weight);
  }

  async canApply(): Promise<boolean> {
    return true;
  }

  async detect(): Promise<any> {
    return {
      technologies: [
        {
          name: this.name,
          confidence: 0.9,
          details: {
            category: TechnologyCategory.LANGUAGE
          }
        }
      ],
      configFiles: [`${this.name}.config.json`]
    };
  }
}

describe('ContextDetector', () => {
  let detector: ContextDetector;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockedFs.existsSync.mockReturnValue(true);

    mockedFs.readFileSync.mockImplementation((file: string | Buffer | URL) => {
      const filePath = file.toString();
      if (filePath.includes('package.json')) {
        return JSON.stringify({
          dependencies: {
            'react': '^17.0.0',
            'react-dom': '^17.0.0'
          },
          devDependencies: {
            'typescript': '^4.5.0',
            'jest': '^27.0.0'
          }
        });
      }
      if (filePath.includes('tsconfig.json')) {
        return JSON.stringify({
          compilerOptions: {
            target: 'es2020',
            module: 'esnext',
            jsx: 'react'
          }
        });
      }
      return '';
    });

    mockedFs.readdirSync.mockImplementation((dir: string | Buffer | URL) => {
      const dirPath = dir.toString();
      if (dirPath.includes('node_modules')) {
        return [];
      }
      if (dirPath.includes('src')) {
        return [
          { name: 'App.tsx', isFile: () => true, isDirectory: () => false },
          { name: 'index.tsx', isFile: () => true, isDirectory: () => false },
          { name: 'components', isFile: () => false, isDirectory: () => true }
        ] as any;
      }
      if (dirPath.includes('components')) {
        return [
          { name: 'Button.tsx', isFile: () => true, isDirectory: () => false },
          { name: 'Input.tsx', isFile: () => true, isDirectory: () => false }
        ] as any;
      }
      if (dirPath.includes('test')) {
        return [
          { name: 'App.test.tsx', isFile: () => true, isDirectory: () => false }
        ] as any;
      }
      return [
        { name: 'package.json', isFile: () => true, isDirectory: () => false },
        { name: 'tsconfig.json', isFile: () => true, isDirectory: () => false },
        { name: 'jest.config.js', isFile: () => true, isDirectory: () => false },
        { name: 'src', isFile: () => false, isDirectory: () => true },
        { name: 'test', isFile: () => false, isDirectory: () => true },
        { name: 'node_modules', isFile: () => false, isDirectory: () => true }
      ] as any;
    });

    mockedFs.statSync.mockImplementation(() => ({
      isDirectory: () => true,
      isFile: () => true,
      mtimeMs: Date.now()
    } as any));

    // Create detector with custom strategies to avoid dependency on real strategies
    detector = new ContextDetector({ useCache: false });

    // Remove default strategies and add mock ones
    (detector as any).strategies = [];
    detector.registerStrategy(new MockStrategy('typescript', 10, 0.8));
    detector.registerStrategy(new MockStrategy('react', 8, 0.7));
    detector.registerStrategy(new MockStrategy('jest', 6, 0.6));
  });

  test('should initialize with default options', () => {
    const newDetector = new ContextDetector();
    expect(newDetector).toBeDefined();
  });

  test('should register and prioritize strategies correctly', () => {
    detector.registerStrategy(new MockStrategy('angular', 9, 0.7));

    const strategies = detector.getStrategies();
    expect(strategies).toHaveLength(4);
    expect(strategies[0].name).toBe('typescript'); // Priority 10
    expect(strategies[1].name).toBe('angular');    // Priority 9
    expect(strategies[2].name).toBe('react');      // Priority 8
    expect(strategies[3].name).toBe('jest');       // Priority 6
  });

  test('should detect context from a project', async () => {
    const result = await detector.detectContext('/test/project');

    expect(result.fromCache).toBe(false);
    expect(result.context).toBeDefined();
    expect(result.context.projectPath).toBe('/test/project');

    // Check that all mock strategies contributed technologies
    const allTechNames = Object.values(result.context.technologies)
      .flat()
      .map(tech => tech.name);

    expect(allTechNames).toContain('typescript');
    expect(allTechNames).toContain('react');
    expect(allTechNames).toContain('jest');

    // Check config files
    expect(result.context.configFiles).toContain('typescript.config.json');
    expect(result.context.configFiles).toContain('react.config.json');
    expect(result.context.configFiles).toContain('jest.config.json');
  });

  test('should use cache when available', async () => {
    // Enable caching for this test
    detector = new ContextDetector({ useCache: true });
    (detector as any).strategies = [];
    detector.registerStrategy(new MockStrategy('typescript', 10, 0.8));

    // First call should not use cache
    await detector.detectContext('/test/project');

    // Create spy for detectContext method
    const detectContextSpy = jest.spyOn(detector as any, 'isCacheValid');
    detectContextSpy.mockReturnValue(true);

    // Second call should use cache
    const result = await detector.detectContext('/test/project');

    expect(result.fromCache).toBe(true);
    expect(detectContextSpy).toHaveBeenCalled();
  });

  test('should invalidate cache when files change', async () => {
    // Enable caching for this test
    detector = new ContextDetector({ useCache: true });
    (detector as any).strategies = [];
    detector.registerStrategy(new MockStrategy('typescript', 10, 0.8));

    // First call to populate cache
    await detector.detectContext('/test/project');

    // Mock file modification time to be newer
    mockedFs.statSync.mockImplementation(() => ({
      isDirectory: () => true,
      isFile: () => true,
      mtimeMs: Date.now() + 1000000 // Future time
    } as any));

    // Second call should not use cache due to modified files
    const result = await detector.detectContext('/test/project');

    expect(result.fromCache).toBe(false);
  });

  test('should handle errors in strategies gracefully', async () => {
    // Create a strategy that throws an error
    class ErrorStrategy extends BaseDetectionStrategy {
      constructor() {
        super('error-strategy', 5, 0.5);
      }

      async canApply(): Promise<boolean> {
        return true;
      }

      async detect(): Promise<any> {
        throw new Error('Test error');
      }
    }

    detector.registerStrategy(new ErrorStrategy());

    const result = await detector.detectContext('/test/project');

    // Should still have results from other strategies
    expect(result.context).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.warnings?.length).toBeGreaterThan(0);
    expect(result.warnings?.[0]).toContain('error-strategy failed');
  });

  test('should analyze file types correctly', async () => {
    // Update mock to provide different file types
    mockedFs.readdirSync.mockImplementation((dir: string | Buffer | URL) => {
      const dirPath = dir.toString();
      if (dirPath.includes('src')) {
        return [
          { name: 'app.tsx', isFile: () => true, isDirectory: () => false },
          { name: 'index.ts', isFile: () => true, isDirectory: () => false },
          { name: 'styles.css', isFile: () => true, isDirectory: () => false },
          { name: 'data.json', isFile: () => true, isDirectory: () => false },
          { name: 'components', isFile: () => false, isDirectory: () => true }
        ] as any;
      }
      return [
        { name: 'package.json', isFile: () => true, isDirectory: () => false },
        { name: 'src', isFile: () => false, isDirectory: () => true }
      ] as any;
    });

    const result = await detector.detectContext('/test/project');

    expect(result.context.fileTypes).toBeDefined();
    expect(result.context.fileTypes.length).toBeGreaterThan(0);

    // Find .tsx file type
    const tsxFiles = result.context.fileTypes.find(f => f.type === '.tsx');
    expect(tsxFiles).toBeDefined();
    expect(tsxFiles?.count).toBeGreaterThanOrEqual(1);

    // Check that percentages are calculated
    expect(tsxFiles?.percentage).toBeGreaterThan(0);
  });

  test('should throw error if project directory does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);

    await expect(detector.detectContext('/non-existent')).rejects.toThrow(
      'Project directory does not exist'
    );
  });

  test('should clear cache when requested', async () => {
    // Enable caching for this test
    detector = new ContextDetector({ useCache: true });
    (detector as any).strategies = [];
    detector.registerStrategy(new MockStrategy('typescript', 10, 0.8));

    // Populate cache
    await detector.detectContext('/test/project');

    // Clear cache
    detector.clearCache();

    // Cache should be empty
    expect((detector as any).cache.size).toBe(0);
  });
});
/**
 * Package.json Detection Strategy
 *
 * Detects context information from package.json files.
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
 * Framework detection patterns
 */
interface FrameworkPattern {
  name: string;
  dependencies: string[];
  devDependencies?: string[];
  category: TechnologyCategory;
  projectType?: ProjectType;
  confidence: number;
}

/**
 * Known framework detection patterns
 */
const FRAMEWORK_PATTERNS: FrameworkPattern[] = [
  {
    name: 'React',
    dependencies: ['react', 'react-dom'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND,
    confidence: 0.9
  },
  {
    name: 'Angular',
    dependencies: ['@angular/core'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND,
    confidence: 0.9
  },
  {
    name: 'Vue',
    dependencies: ['vue'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND,
    confidence: 0.9
  },
  {
    name: 'Next.js',
    dependencies: ['next'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FULLSTACK,
    confidence: 0.9
  },
  {
    name: 'Express',
    dependencies: ['express'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.BACKEND,
    confidence: 0.8
  },
  {
    name: 'NestJS',
    dependencies: ['@nestjs/core'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.BACKEND,
    confidence: 0.9
  },
  {
    name: 'TypeScript',
    dependencies: ['typescript'],
    devDependencies: ['typescript', '@types/node'],
    category: TechnologyCategory.LANGUAGE,
    confidence: 0.9
  },
  {
    name: 'Jest',
    dependencies: ['jest'],
    devDependencies: ['jest', '@types/jest'],
    category: TechnologyCategory.TEST_TOOL,
    confidence: 0.9
  },
  {
    name: 'ESLint',
    dependencies: ['eslint'],
    devDependencies: ['eslint'],
    category: TechnologyCategory.LINTER,
    confidence: 0.9
  },
  {
    name: 'Prettier',
    dependencies: ['prettier'],
    devDependencies: ['prettier'],
    category: TechnologyCategory.FORMATTER,
    confidence: 0.9
  },
  {
    name: 'Webpack',
    dependencies: ['webpack'],
    devDependencies: ['webpack'],
    category: TechnologyCategory.BUNDLER,
    confidence: 0.8
  },
  {
    name: 'Redux',
    dependencies: ['redux', '@reduxjs/toolkit'],
    category: TechnologyCategory.STATE_MANAGEMENT,
    confidence: 0.8
  },
  {
    name: 'MobX',
    dependencies: ['mobx'],
    category: TechnologyCategory.STATE_MANAGEMENT,
    confidence: 0.8
  },
  {
    name: 'Tailwind CSS',
    dependencies: ['tailwindcss'],
    devDependencies: ['tailwindcss'],
    category: TechnologyCategory.UI_LIBRARY,
    confidence: 0.8
  },
  {
    name: 'Material-UI',
    dependencies: ['@mui/material', '@material-ui/core'],
    category: TechnologyCategory.UI_LIBRARY,
    confidence: 0.8
  },
  {
    name: 'Prisma',
    dependencies: ['@prisma/client'],
    devDependencies: ['prisma'],
    category: TechnologyCategory.DATABASE,
    confidence: 0.8
  },
  {
    name: 'MongoDB',
    dependencies: ['mongodb', 'mongoose'],
    category: TechnologyCategory.DATABASE,
    confidence: 0.7
  }
];

/**
 * CLI package pattern detection
 */
const CLI_PATTERNS = ['bin', 'commander', 'yargs', 'meow', 'cac', 'oclif'];

/**
 * Strategy for detecting context from package.json
 */
export class PackageJsonStrategy extends BaseDetectionStrategy {
  /**
   * Create a new package.json detection strategy
   */
  constructor() {
    super('package-json', 10, 0.8); // High priority as it provides core project info
  }

  /**
   * Check if this strategy can be applied to the given project path
   */
  async canApply(projectPath: string): Promise<boolean> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    return fs.existsSync(packageJsonPath);
  }

  /**
   * Detect context information from package.json
   */
  async detect(projectPath: string): Promise<DetectionStrategyResult> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    try {
      // Read and parse package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const result: DetectionStrategyResult = {
        technologies: [],
        configFiles: [packageJsonPath]
      };

      // Extract basic package info
      const name = packageJson.name;
      const version = packageJson.version;
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      // Detect technologies from dependencies
      const detectedTechnologies = this.detectTechnologiesFromDependencies(
        dependencies,
        devDependencies
      );

      result.technologies = detectedTechnologies;

      // Determine project type
      result.projectType = this.detectProjectType(
        packageJson,
        dependencies,
        devDependencies,
        detectedTechnologies
      );

      // Add metadata
      result.metadata = {
        packageName: name,
        packageVersion: version,
        dependencies,
        devDependencies
      };

      return result;
    } catch (error) {
      logger.error(`Error detecting context from package.json: ${error instanceof Error ? error.message : String(error)}`);
      return { technologies: [], configFiles: [] };
    }
  }

  /**
   * Detect technologies from dependencies
   */
  private detectTechnologiesFromDependencies(
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>
  ): DetectedTechnology[] {
    const technologies: DetectedTechnology[] = [];
    const allDeps = { ...dependencies, ...devDependencies };

    // Check for known frameworks and technologies
    for (const pattern of FRAMEWORK_PATTERNS) {
      const hasDependency = pattern.dependencies.some(dep =>
        Object.keys(dependencies).includes(dep)
      );

      const hasDevDependency = pattern.devDependencies?.some(dep =>
        Object.keys(devDependencies).includes(dep)
      ) ?? false;

      if (hasDependency || hasDevDependency) {
        // Find the matched dependency to get its version
        const matchedDep = pattern.dependencies.find(dep => allDeps[dep])
          || pattern.devDependencies?.find(dep => allDeps[dep]);

        const version = matchedDep ? allDeps[matchedDep] : undefined;

        technologies.push({
          name: pattern.name,
          version: version?.replace(/[^0-9.]/g, ''), // Clean version string
          confidence: pattern.confidence,
          details: {
            category: pattern.category,
            matchedDependency: matchedDep
          }
        });
      }
    }

    return technologies;
  }

  /**
   * Detect project type from package.json
   */
  private detectProjectType(
    packageJson: any,
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>,
    detectedTechnologies: DetectedTechnology[]
  ): { type: ProjectType; confidence: number } {
    // Check for CLI projects
    const hasCliIndicators = packageJson.bin !== undefined
      || CLI_PATTERNS.some(pattern =>
          Object.keys(dependencies).includes(pattern) ||
          Object.keys(devDependencies).includes(pattern)
        );

    if (hasCliIndicators) {
      return { type: ProjectType.CLI, confidence: 0.8 };
    }

    // Check for library (published to npm)
    if (packageJson.main && !packageJson.private) {
      return { type: ProjectType.LIBRARY, confidence: 0.7 };
    }

    // Use detected technologies to guess project type
    const frameworkPatterns = detectedTechnologies
      .map(tech => FRAMEWORK_PATTERNS.find(pattern => pattern.name === tech.name && pattern.projectType !== undefined))
      .filter(Boolean) as FrameworkPattern[];

    if (frameworkPatterns.length > 0) {
      // Sort by confidence
      const sorted = [...frameworkPatterns].sort((a, b) => b.confidence - a.confidence);

      // Check for fullstack frameworks first
      const fullstackFramework = sorted.find(p => p.projectType === ProjectType.FULLSTACK);
      if (fullstackFramework) {
        return { type: ProjectType.FULLSTACK, confidence: fullstackFramework.confidence };
      }

      // Check for mixed frontend/backend
      const hasBackend = sorted.some(p => p.projectType === ProjectType.BACKEND);
      const hasFrontend = sorted.some(p => p.projectType === ProjectType.FRONTEND);

      if (hasBackend && hasFrontend) {
        return { type: ProjectType.FULLSTACK, confidence: 0.7 };
      }

      // Return the highest confidence match
      if (sorted[0].projectType) {
        return { type: sorted[0].projectType, confidence: sorted[0].confidence };
      }
    }

    // Default to unknown
    return { type: ProjectType.UNKNOWN, confidence: 0.5 };
  }
}

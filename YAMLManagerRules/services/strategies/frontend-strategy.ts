/**
 * Frontend Framework Detection Strategy
 *
 * Detects frontend frameworks like React, Vue, Angular, etc. by analyzing
 * project files and configuration.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseDetectionStrategy } from './detection-strategy';
import {
  DetectionStrategyResult,
  ProjectType,
  TechnologyCategory
} from '../../models/context';
import { logger } from '../../utils/logger';

/**
 * Framework configuration details
 */
interface FrameworkConfig {
  name: string;
  configFiles: string[];
  packagePatterns: string[];
  filePatterns: string[];
  folderPatterns?: string[];
  category: TechnologyCategory;
  projectType?: ProjectType;
}

/**
 * Known frontend frameworks
 */
const FRONTEND_FRAMEWORKS: FrameworkConfig[] = [
  {
    name: 'React',
    configFiles: [
      'react.config.js',
      '.babelrc',
      'babel.config.js',
      'craco.config.js'
    ],
    packagePatterns: ['react', 'react-dom', 'create-react-app', 'next'],
    filePatterns: ['.jsx', '.tsx'],
    folderPatterns: ['components', 'pages', 'containers'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  },
  {
    name: 'Vue',
    configFiles: ['vue.config.js', 'nuxt.config.js'],
    packagePatterns: ['vue', '@vue/cli', 'nuxt', 'vuex', 'vue-router'],
    filePatterns: ['.vue'],
    folderPatterns: ['components', 'pages', 'layouts'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  },
  {
    name: 'Angular',
    configFiles: ['angular.json', 'angular-cli.json', 'ng-config.js'],
    packagePatterns: ['@angular/core', '@angular/common', '@angular/cli'],
    filePatterns: ['.component.ts', '.module.ts', '.service.ts'],
    folderPatterns: ['app', 'modules', 'services'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  },
  {
    name: 'Svelte',
    configFiles: ['svelte.config.js', 'rollup.config.js'],
    packagePatterns: ['svelte', 'svelte-loader', '@sveltejs/kit'],
    filePatterns: ['.svelte'],
    folderPatterns: ['components', 'routes'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  },
  {
    name: 'Preact',
    configFiles: ['preact.config.js'],
    packagePatterns: ['preact', 'preact-cli'],
    filePatterns: ['.jsx', '.tsx'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  },
  {
    name: 'Ember',
    configFiles: ['ember-cli-build.js'],
    packagePatterns: ['ember', 'ember-cli', 'ember-data'],
    filePatterns: ['.hbs', '.js'],
    folderPatterns: ['app/templates', 'app/components', 'app/routes'],
    category: TechnologyCategory.FRAMEWORK,
    projectType: ProjectType.FRONTEND
  }
];

/**
 * UI libraries configuration details
 */
const UI_LIBRARIES = [
  {
    name: 'Material-UI',
    packagePatterns: ['@material-ui/core', '@mui/material'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Ant Design',
    packagePatterns: ['antd', '@ant-design/icons'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Chakra UI',
    packagePatterns: ['@chakra-ui/react', '@chakra-ui/core'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Tailwind CSS',
    packagePatterns: ['tailwindcss'],
    configFiles: ['tailwind.config.js', 'postcss.config.js'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Bootstrap',
    packagePatterns: ['bootstrap', 'react-bootstrap', 'reactstrap', '@ng-bootstrap/ng-bootstrap'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Styled Components',
    packagePatterns: ['styled-components'],
    category: TechnologyCategory.UI_LIBRARY
  },
  {
    name: 'Emotion',
    packagePatterns: ['@emotion/react', '@emotion/styled', '@emotion/core'],
    category: TechnologyCategory.UI_LIBRARY
  }
];

/**
 * Frontend detection strategy
 */
export class FrontendStrategy extends BaseDetectionStrategy {
  constructor() {
    super('frontend', 7, 0.7); // Medium-high priority, slightly below package.json
  }

  /**
   * Check if the strategy can be applied to the project
   */
  async canApply(projectPath: string): Promise<boolean> {
    // Try to find package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        };

        // Check for any frontend framework dependencies
        for (const framework of FRONTEND_FRAMEWORKS) {
          for (const pattern of framework.packagePatterns) {
            if (Object.keys(allDeps).some(dep => dep === pattern || dep.startsWith(`${pattern}/`))) {
              return true;
            }
          }
        }

        // Check for any UI library dependencies
        for (const library of UI_LIBRARIES) {
          for (const pattern of library.packagePatterns) {
            if (Object.keys(allDeps).some(dep => dep === pattern || dep.startsWith(`${pattern}/`))) {
              return true;
            }
          }
        }
      } catch (error) {
        logger.debug(`Error parsing package.json: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Look for framework config files
    for (const framework of FRONTEND_FRAMEWORKS) {
      for (const configFile of framework.configFiles) {
        if (fs.existsSync(path.join(projectPath, configFile))) {
          return true;
        }
      }
    }

    // Look for UI library config files
    for (const library of UI_LIBRARIES) {
      if (library.configFiles) {
        for (const configFile of library.configFiles) {
          if (fs.existsSync(path.join(projectPath, configFile))) {
            return true;
          }
        }
      }
    }

    // Look for src directory which is common in frontend projects
    if (fs.existsSync(path.join(projectPath, 'src'))) {
      // Try to find common frontend file extensions in src
      try {
        const srcFiles = this.scanDirectoryForPatterns(
          path.join(projectPath, 'src'),
          ['.jsx', '.tsx', '.vue', '.svelte', '.component.ts']
        );

        if (srcFiles.length > 0) {
          return true;
        }
      } catch (error) {
        logger.debug(`Error scanning src directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Look for public directory which is common in frontend projects
    return fs.existsSync(path.join(projectPath, 'public')) ||
           fs.existsSync(path.join(projectPath, 'static'));
  }

  /**
   * Detect frontend frameworks and libraries
   */
  async detect(projectPath: string): Promise<DetectionStrategyResult> {
    logger.debug('Running frontend detection strategy');

    const result: DetectionStrategyResult = {
      technologies: [],
      configFiles: []
    };

    try {
      // Detect frameworks
      const detectedFrameworks = await this.detectFrameworks(projectPath);

      // Detect UI libraries
      const detectedUILibraries = await this.detectUILibraries(projectPath);

      // Add all detections to the result
      if (detectedFrameworks.technologies) {
        result.technologies = [
          ...(result.technologies || []),
          ...detectedFrameworks.technologies
        ];
      }

      if (detectedUILibraries.technologies) {
        result.technologies = [
          ...(result.technologies || []),
          ...detectedUILibraries.technologies
        ];
      }

      if (detectedFrameworks.configFiles) {
        result.configFiles = [
          ...(result.configFiles || []),
          ...detectedFrameworks.configFiles
        ];
      }

      if (detectedUILibraries.configFiles) {
        result.configFiles = [
          ...(result.configFiles || []),
          ...detectedUILibraries.configFiles
        ];
      }

      // Add state management libraries
      const stateManagement = await this.detectStateManagement(projectPath);
      if (stateManagement.technologies) {
        result.technologies = [
          ...(result.technologies || []),
          ...stateManagement.technologies
        ];
      }

      // Set project type if a strong framework is detected
      if (detectedFrameworks.technologies && detectedFrameworks.technologies.length > 0) {
        const primaryFramework = detectedFrameworks.technologies[0];

        if (primaryFramework.confidence > 0.7) {
          // Find the framework config to get project type
          const frameworkConfig = FRONTEND_FRAMEWORKS.find(f => f.name === primaryFramework.name);

          if (frameworkConfig?.projectType) {
            result.projectType = {
              type: frameworkConfig.projectType,
              confidence: primaryFramework.confidence
            };
          }
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error in frontend detection: ${error instanceof Error ? error.message : String(error)}`);
      return {
        technologies: [],
        configFiles: []
      };
    }
  }

  /**
   * Detect frontend frameworks
   */
  private async detectFrameworks(projectPath: string): Promise<DetectionStrategyResult> {
    const result: DetectionStrategyResult = {
      technologies: [],
      configFiles: []
    };

    try {
      // Check package.json for dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageDeps: Record<string, string> = {};

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          packageDeps = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
          };
        } catch (error) {
          logger.debug(`Error parsing package.json: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      for (const framework of FRONTEND_FRAMEWORKS) {
        let confidence = 0;
        const detectionMethods: string[] = [];
        const frameworkConfigFiles: string[] = [];

        // Check for dependencies
        for (const pattern of framework.packagePatterns) {
          if (Object.keys(packageDeps).some(dep => dep === pattern || dep.startsWith(`${pattern}/`))) {
            confidence = Math.max(confidence, 0.8);
            detectionMethods.push('package_dependency');
          }
        }

        // Check for config files
        for (const configFile of framework.configFiles) {
          const configPath = path.join(projectPath, configFile);
          if (fs.existsSync(configPath)) {
            confidence = Math.max(confidence, 0.9);
            detectionMethods.push('config_file');
            frameworkConfigFiles.push(configPath);
          }
        }

        // Check for typical file extensions
        if (framework.filePatterns && framework.filePatterns.length > 0) {
          const matchingFiles = this.scanDirectoryForPatterns(projectPath, framework.filePatterns);
          if (matchingFiles.length > 0) {
            confidence = Math.max(confidence, 0.7);
            detectionMethods.push('file_patterns');
          }

          // More files = higher confidence
          if (matchingFiles.length > 5) {
            confidence = Math.max(confidence, 0.8);
          }
        }

        // Check for typical folders
        if (framework.folderPatterns && framework.folderPatterns.length > 0) {
          let foundFolders = 0;
          for (const folderPattern of framework.folderPatterns) {
            if (fs.existsSync(path.join(projectPath, folderPattern)) ||
                fs.existsSync(path.join(projectPath, 'src', folderPattern))) {
              foundFolders++;
            }
          }

          if (foundFolders > 0) {
            confidence = Math.max(confidence, 0.6 + (foundFolders * 0.1));
            detectionMethods.push('folder_structure');
          }
        }

        // If we found the framework with sufficient confidence, add it
        if (confidence > 0.5) {
          result.technologies?.push({
            name: framework.name,
            confidence,
            details: {
              category: framework.category,
              detectionMethod: detectionMethods
            }
          });

          // Add config files to result
          if (frameworkConfigFiles.length > 0) {
            result.configFiles = [...(result.configFiles || []), ...frameworkConfigFiles];
          }
        }
      }

      // Sort by confidence (highest first)
      if (result.technologies) {
        result.technologies.sort((a, b) => b.confidence - a.confidence);
      }

      return result;
    } catch (error) {
      logger.debug(`Error detecting frameworks: ${error instanceof Error ? error.message : String(error)}`);
      return {
        technologies: [],
        configFiles: []
      };
    }
  }

  /**
   * Detect UI libraries
   */
  private async detectUILibraries(projectPath: string): Promise<DetectionStrategyResult> {
    const result: DetectionStrategyResult = {
      technologies: [],
      configFiles: []
    };

    try {
      // Check package.json for dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      let packageDeps: Record<string, string> = {};

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          packageDeps = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
          };
        } catch (error) {
          logger.debug(`Error parsing package.json: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      for (const library of UI_LIBRARIES) {
        let confidence = 0;
        const detectionMethods: string[] = [];
        const libraryConfigFiles: string[] = [];

        // Check for dependencies
        for (const pattern of library.packagePatterns) {
          if (Object.keys(packageDeps).some(dep => dep === pattern || dep.startsWith(`${pattern}/`))) {
            confidence = Math.max(confidence, 0.8);
            detectionMethods.push('package_dependency');
          }
        }

        // Check for config files
        if (library.configFiles) {
          for (const configFile of library.configFiles) {
            const configPath = path.join(projectPath, configFile);
            if (fs.existsSync(configPath)) {
              confidence = Math.max(confidence, 0.9);
              detectionMethods.push('config_file');
              libraryConfigFiles.push(configPath);
            }
          }
        }

        // If we found the library with sufficient confidence, add it
        if (confidence > 0.5) {
          result.technologies?.push({
            name: library.name,
            confidence,
            details: {
              category: library.category,
              detectionMethod: detectionMethods
            }
          });

          // Add config files to result
          if (libraryConfigFiles.length > 0) {
            result.configFiles = [...(result.configFiles || []), ...libraryConfigFiles];
          }
        }
      }

      return result;
    } catch (error) {
      logger.debug(`Error detecting UI libraries: ${error instanceof Error ? error.message : String(error)}`);
      return {
        technologies: [],
        configFiles: []
      };
    }
  }

  /**
   * Detect state management libraries
   */
  private async detectStateManagement(projectPath: string): Promise<DetectionStrategyResult> {
    const stateLibraries = [
      { name: 'Redux', packagePatterns: ['redux', 'react-redux', '@reduxjs/toolkit'] },
      { name: 'MobX', packagePatterns: ['mobx', 'mobx-react', 'mobx-state-tree'] },
      { name: 'Recoil', packagePatterns: ['recoil'] },
      { name: 'Vuex', packagePatterns: ['vuex'] },
      { name: 'Pinia', packagePatterns: ['pinia'] },
      { name: 'NgRx', packagePatterns: ['@ngrx/store'] },
      { name: 'XState', packagePatterns: ['xstate'] },
      { name: 'Zustand', packagePatterns: ['zustand'] },
      { name: 'Jotai', packagePatterns: ['jotai'] }
    ];

    const result: DetectionStrategyResult = {
      technologies: []
    };

    try {
      // Check package.json for dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return result;
      }

      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        };

        for (const library of stateLibraries) {
          for (const pattern of library.packagePatterns) {
            if (Object.keys(allDeps).some(dep => dep === pattern || dep.startsWith(`${pattern}/`))) {
              result.technologies?.push({
                name: library.name,
                confidence: 0.85,
                details: {
                  category: TechnologyCategory.STATE_MANAGEMENT,
                  detectionMethod: ['package_dependency']
                }
              });
              break; // Found this library, move to next
            }
          }
        }
      } catch (error) {
        logger.debug(`Error parsing package.json: ${error instanceof Error ? error.message : String(error)}`);
      }

      return result;
    } catch (error) {
      logger.debug(`Error detecting state management: ${error instanceof Error ? error.message : String(error)}`);
      return {
        technologies: []
      };
    }
  }

  /**
   * Scan directory for files matching patterns
   */
  private scanDirectoryForPatterns(dirPath: string, patterns: string[], depth: number = 0): string[] {
    const results: string[] = [];

    if (depth > 3) {
      return results; // Limit recursion depth
    }

    if (!fs.existsSync(dirPath)) {
      return results;
    }

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          // Recursively scan subdirectories
          results.push(...this.scanDirectoryForPatterns(fullPath, patterns, depth + 1));
        } else if (entry.isFile()) {
          // Check if file matches any pattern
          if (patterns.some(pattern => entry.name.endsWith(pattern))) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.debug(`Error scanning directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
  }
}
#!/usr/bin/env node

/**
 * 📦 File Migration Utility
 * 
 * Migrates existing AutoPilot working files to the new agents/_store structure
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class FileMigrator {
  constructor() {
    this.sourceLocations = [
      {
        path: '',
        description: 'Project root',
        files: ['idea_document.mdc', 'market_research.mdc', 'core_concept.mdc', 'project_prd.mdc']
      },
      {
        path: '.cursor/rules/projet',
        description: 'Projet directory',
        files: ['*']
      },
      {
        path: '.cursor/rules/tasks',
        description: 'Tasks directory', 
        files: ['tasks.json']
      },
      {
        path: '.cursor/rules',
        description: 'Rules directory',
        files: ['project_session_state.json']
      }
    ];
    
    this.targetRoot = 'agents/_store/projects';
  }

  /**
   * Run the migration process
   */
  async migrate(projectName = null) {
    console.log(chalk.blue('📦 Starting file migration to agent store'));
    console.log('=' .repeat(50));

    // If no project name provided, try to detect from existing files
    if (!projectName) {
      projectName = await this.detectProjectName();
    }

    if (!projectName) {
      console.log(chalk.yellow('💡 Usage: npm run AAI:migrate-files [project-name]'));
      console.log(chalk.gray('  If no project name provided, will try to auto-detect'));
      process.exit(0);
    }

    console.log(chalk.green(`📂 Target project: ${projectName}`));
    
    // Create target directory
    const targetDir = path.join(this.targetRoot, projectName);
    await fs.mkdir(targetDir, { recursive: true });
    console.log(chalk.blue(`📁 Created target directory: ${targetDir}`));

    // Scan and migrate files
    const results = await this.scanAndMigrate(targetDir);
    
    // Display results
    this.displayResults(results, projectName);
    
    return results;
  }

  /**
   * Try to detect project name from existing files
   */
  async detectProjectName() {
    try {
      // Check if there's a project_prd.mdc or idea_document.mdc
      const possibleFiles = ['project_prd.mdc', 'idea_document.mdc', 'core_concept.mdc'];
      
      for (const file of possibleFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          
          // Try to extract project name from content
          const lines = content.split('\n').slice(0, 10); // First 10 lines
          for (const line of lines) {
            if (line.includes('Project:') || line.includes('project:')) {
              const match = line.match(/project:\s*(.+)/i);
              if (match) {
                return match[1].trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
              }
            }
            if (line.startsWith('# ')) {
              // Use heading as project name
              return line.substring(2).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            }
          }
        } catch {
          // File doesn't exist, continue
        }
      }
      
      // Default fallback
      return 'default-project';
    } catch {
      return null;
    }
  }

  /**
   * Scan all source locations and migrate files
   */
  async scanAndMigrate(targetDir) {
    const results = {
      migrated: [],
      skipped: [],
      errors: []
    };

    for (const location of this.sourceLocations) {
      console.log(chalk.cyan(`\n🔍 Scanning: ${location.description} (${location.path || 'root'})`));
      
      try {
        const files = await this.getFilesInLocation(location);
        
        for (const file of files) {
          try {
            const migrationResult = await this.migrateFile(file, targetDir);
            
            if (migrationResult.success) {
              results.migrated.push(migrationResult);
              console.log(chalk.green(`  ✅ ${file.name}`));
            } else {
              results.skipped.push({ file: file.name, reason: migrationResult.reason });
              console.log(chalk.yellow(`  ⚠️ ${file.name} - ${migrationResult.reason}`));
            }
          } catch (error) {
            results.errors.push({ file: file.name, error: error.message });
            console.log(chalk.red(`  ❌ ${file.name} - ${error.message}`));
          }
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ Error scanning ${location.description}: ${error.message}`));
      }
    }

    return results;
  }

  /**
   * Get files in a specific location
   */
  async getFilesInLocation(location) {
    const files = [];
    const locationPath = location.path || '.';

    try {
      // Check if location exists
      await fs.access(locationPath);
      
      if (location.files.includes('*')) {
        // Get all files in directory
        const dirFiles = await fs.readdir(locationPath);
        for (const file of dirFiles) {
          if (!file.startsWith('.') && (file.endsWith('.mdc') || file.endsWith('.json'))) {
            const filePath = path.join(locationPath, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              files.push({
                name: file,
                path: filePath,
                location: location.description
              });
            }
          }
        }
      } else {
        // Check specific files
        for (const fileName of location.files) {
          const filePath = path.join(locationPath, fileName);
          try {
            await fs.access(filePath);
            files.push({
              name: fileName,
              path: filePath,
              location: location.description
            });
          } catch {
            // File doesn't exist, skip
          }
        }
      }
    } catch {
      // Location doesn't exist, skip
    }

    return files;
  }

  /**
   * Migrate a single file
   */
  async migrateFile(file, targetDir) {
    const targetPath = path.join(targetDir, file.name);
    
    // Check if target already exists
    try {
      await fs.access(targetPath);
      return {
        success: false,
        reason: 'Target file already exists'
      };
    } catch {
      // Target doesn't exist, proceed with migration
    }

    // Read source file
    const content = await fs.readFile(file.path, 'utf8');
    
    // Write to target
    await fs.writeFile(targetPath, content, 'utf8');
    
    // Remove source file
    await fs.unlink(file.path);
    
    return {
      success: true,
      source: file.path,
      target: targetPath,
      size: content.length
    };
  }

  /**
   * Display migration results
   */
  displayResults(results, projectName) {
    console.log(chalk.blue('\n📊 Migration Results'));
    console.log('=' .repeat(50));
    
    console.log(chalk.green(`✅ Migrated: ${results.migrated.length} files`));
    console.log(chalk.yellow(`⚠️ Skipped: ${results.skipped.length} files`));
    console.log(chalk.red(`❌ Errors: ${results.errors.length} files`));

    if (results.migrated.length > 0) {
      console.log(chalk.blue('\n📁 Migrated files:'));
      results.migrated.forEach(file => {
        const sizeKB = Math.round(file.size / 1024);
        console.log(chalk.gray(`  ${file.source} → agents/_store/projects/${projectName}/${path.basename(file.target)} (${sizeKB}KB)`));
      });
    }

    if (results.skipped.length > 0) {
      console.log(chalk.yellow('\n⚠️ Skipped files:'));
      results.skipped.forEach(file => {
        console.log(chalk.gray(`  ${file.file}: ${file.reason}`));
      });
    }

    if (results.errors.length > 0) {
      console.log(chalk.red('\n❌ Error files:'));
      results.errors.forEach(file => {
        console.log(chalk.gray(`  ${file.file}: ${file.error}`));
      });
    }

    if (results.migrated.length > 0) {
      console.log(chalk.green(`\n🎉 Migration completed! Files moved to: agents/_store/projects/${projectName}/`));
      console.log(chalk.blue('💡 To use the new structure:'));
      console.log(chalk.gray('  1. Start the agent: npm run AAI:agent'));
      console.log(chalk.gray(`  2. Set project: projects set ${projectName}`));
      console.log(chalk.gray('  3. Check files: projects stats'));
      console.log(chalk.gray('  4. Test system: npm run AAI:test-system'));
    } else {
      console.log(chalk.yellow('\n💡 No files were migrated. They may already be in the agent store or not exist.'));
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new FileMigrator();
  const projectName = process.argv[2];
  
  migrator.migrate(projectName).catch(error => {
    console.error(chalk.red('❌ Migration failed:'), error.message);
    process.exit(1);
  });
}

module.exports = FileMigrator; 
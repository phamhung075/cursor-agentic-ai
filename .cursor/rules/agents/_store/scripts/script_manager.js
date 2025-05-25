#!/usr/bin/env node

/**
 * 🛠️ Script Manager
 * 
 * Comprehensive management system for all agent-created scripts and tests
 * Provides listing, organization, and tracking capabilities
 */

const fs = require('fs').promises;
const path = require('path');

class ScriptManager {
  constructor() {
    this.scriptsDir = '.cursor/rules/agents/_store/scripts';
    this.testsDir = '.cursor/rules/agents/_store/tests';
    
    this.categories = {
      scripts: {
        core: 'Core framework management',
        backup: 'Backup and recovery utilities',
        analysis: 'Analysis and reporting tools',  
        cleanup: 'Cleanup and maintenance',
        migration: 'Migration and conversion tools',
        utility: 'General purpose utilities'
      },
      tests: {
        integration: 'Integration tests',
        unit: 'Unit tests', 
        system: 'System tests',
        performance: 'Performance tests'
      }
    };
    
    this.results = {
      scripts: {},
      tests: {},
      npm_scripts: [],
      total_files: 0
    };
  }

  /**
   * Main script manager function
   */
  async manage(command = 'list') {
    console.log('🛠️ SCRIPT MANAGER');
    console.log('━'.repeat(60));
    
    try {
      switch (command.toLowerCase()) {
        case 'list':
          await this.listAll();
          break;
        case 'organize':
          await this.organizeScripts();
          break;
        case 'help':
          this.showHelp();
          break;
        case 'analyze':
          await this.analyzeUsage();
          break;
        case 'categories':
          this.showCategories();
          break;
        default:
          console.log(`❌ Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ Script manager error:', error.message);
      throw error;
    }
  }

  /**
   * List all scripts and tests
   */
  async listAll() {
    console.log('📋 LISTING ALL SCRIPTS AND TESTS');
    console.log('');
    
    // Scan scripts directory
    await this.scanDirectory(this.scriptsDir, 'scripts');
    
    // Scan tests directory
    await this.scanDirectory(this.testsDir, 'tests');
    
    // Get npm scripts
    await this.getNpmScripts();
    
    // Display results
    this.displayResults();
  }

  /**
   * Scan a directory for scripts/tests
   */
  async scanDirectory(dirPath, type) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      this.results[type] = {};
      
      // Initialize categories
      for (const category of Object.keys(this.categories[type])) {
        this.results[type][category] = [];
      }
      this.results[type]['uncategorized'] = [];
      
      for (const file of files) {
        if (file.isFile() && (
          file.name.endsWith('.js') || 
          file.name.endsWith('.py') || 
          file.name.endsWith('.sh')
        )) {
          const category = this.categorizeFile(file.name, type);
          this.results[type][category].push({
            name: file.name,
            path: path.join(dirPath, file.name),
            description: await this.extractDescription(path.join(dirPath, file.name))
          });
          this.results.total_files++;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Categorize a file based on its name and content
   */
  categorizeFile(filename, type) {
    const lower = filename.toLowerCase();
    
    if (type === 'scripts') {
      if (lower.includes('core') || lower.includes('_core')) {
        return 'core';
      } else if (lower.includes('backup')) {
        return 'backup';
      } else if (lower.includes('analyze') || lower.includes('analysis')) {
        return 'analysis';
      } else if (lower.includes('clean') || lower.includes('cleanup')) {
        return 'cleanup';
      } else if (lower.includes('migrate') || lower.includes('migration')) {
        return 'migration';
      } else if (lower.includes('util') || lower.includes('helper')) {
        return 'utility';
      }
    } else if (type === 'tests') {
      if (lower.includes('integration')) {
        return 'integration';
      } else if (lower.includes('unit')) {
        return 'unit';
      } else if (lower.includes('system')) {
        return 'system';
      } else if (lower.includes('performance') || lower.includes('perf')) {
        return 'performance';
      }
    }
    
    return 'uncategorized';
  }

  /**
   * Extract description from file header
   */
  async extractDescription(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').slice(0, 10); // Check first 10 lines
      
      for (const line of lines) {
        // Look for description patterns
        if (line.includes('* ') && (
          line.toLowerCase().includes('description') || 
          line.includes('Purpose') ||
          line.includes('@description')
        )) {
          return line.replace(/.*(\*|\/\/)\s*/, '').trim();
        }
        
        // Look for comment descriptions
        if (line.startsWith(' * ') && line.length > 10 && !line.includes('*')) {
          const desc = line.replace(/^\s*\*\s*/, '').trim();
          if (desc && !desc.startsWith('@') && !desc.includes('===')) {
            return desc;
          }
        }
      }
      
      return 'No description available';
    } catch (error) {
      return 'Could not read file';
    }
  }

  /**
   * Get NPM scripts that reference our scripts
   */
  async getNpmScripts() {
    try {
      const packagePath = 'package.json';
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      this.results.npm_scripts = [];
      
      for (const [name, command] of Object.entries(packageJson.scripts || {})) {
        if (command.includes('.cursor/rules/agents/_store/scripts/') || command.includes('.cursor/rules/agents/_store/tests/')) {
          this.results.npm_scripts.push({ name, command });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not read package.json');
    }
  }

  /**
   * Display all results
   */
  displayResults() {
    console.log(`📊 SUMMARY: ${this.results.total_files} total files found`);
    console.log('');
    
    // Display scripts
    console.log('🔧 SCRIPTS (.cursor/rules/agents/_store/scripts/)');
    console.log('━'.repeat(50));
    this.displayCategoryResults('scripts');
    
    console.log('');
    
    // Display tests  
    console.log('🧪 TESTS (.cursor/rules/agents/_store/tests/)');
    console.log('━'.repeat(50));
    this.displayCategoryResults('tests');
    
    console.log('');
    
    // Display NPM scripts
    if (this.results.npm_scripts.length > 0) {
      console.log('📦 NPM INTEGRATION');
      console.log('━'.repeat(50));
      this.results.npm_scripts.forEach(script => {
        console.log(`  🚀 npm run ${script.name}`);
        console.log(`     ${script.command}`);
      });
      console.log('');
    }
    
    console.log('🎯 Use "npm run AAI:scripts-help" for usage commands');
  }

  /**
   * Display results for a specific category type
   */
  displayCategoryResults(type) {
    const typeResults = this.results[type];
    
    for (const [category, description] of Object.entries(this.categories[type])) {
      const files = typeResults[category] || [];
      if (files.length > 0) {
        console.log(`\n📂 ${category.toUpperCase()} (${files.length} files)`);
        console.log(`   ${description}`);
        files.forEach(file => {
          console.log(`   ✅ ${file.name}`);
          console.log(`      ${file.description}`);
        });
      }
    }
    
    // Show uncategorized files
    const uncategorized = typeResults['uncategorized'] || [];
    if (uncategorized.length > 0) {
      console.log(`\n❓ UNCATEGORIZED (${uncategorized.length} files)`);
      uncategorized.forEach(file => {
        console.log(`   ⚪ ${file.name}`);
        console.log(`      ${file.description}`);
      });
    }
  }

  /**
   * Organize scripts into subdirectories
   */
  async organizeScripts() {
    console.log('🗂️ ORGANIZING SCRIPTS INTO CATEGORIES');
    console.log('');
    
    // First scan current scripts
    await this.scanDirectory(this.scriptsDir, 'scripts');
    await this.scanDirectory(this.testsDir, 'tests');
    
    let movedCount = 0;
    
    // Create category directories and move files
    for (const type of ['scripts', 'tests']) {
      const basePath = type === 'scripts' ? this.scriptsDir : this.testsDir;
      
      for (const [category, files] of Object.entries(this.results[type])) {
        if (category !== 'uncategorized' && files.length > 0) {
          const categoryPath = path.join(basePath, category);
          
          // Create category directory
          await fs.mkdir(categoryPath, { recursive: true });
          
          // Move files
          for (const file of files) {
            const sourcePath = file.path;
            const targetPath = path.join(categoryPath, file.name);
            
            try {
              // Check if file is already in a subdirectory
              if (!sourcePath.includes(`/${category}/`)) {
                await fs.rename(sourcePath, targetPath);
                console.log(`  📁 Moved ${file.name} → ${category}/`);
                movedCount++;
              } else {
                console.log(`  ✅ Already organized: ${file.name}`);
              }
            } catch (error) {
              console.warn(`  ⚠️ Could not move ${file.name}: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log('');
    console.log(`✅ Organization complete! Moved ${movedCount} files`);
    console.log('');
    console.log('📂 New structure:');
    console.log('   .cursor/rules/agents/_store/scripts/');
    Object.keys(this.categories.scripts).forEach(cat => {
      console.log(`   ├── ${cat}/`);
    });
    console.log('   .cursor/rules/agents/_store/tests/'); 
    Object.keys(this.categories.tests).forEach(cat => {
      console.log(`   ├── ${cat}/`);
    });
  }

  /**
   * Analyze script usage patterns
   */
  async analyzeUsage() {
    console.log('📊 ANALYZING SCRIPT USAGE PATTERNS');
    console.log('');
    
    await this.listAll();
    
    // Analyze npm script integration
    const npmIntegrationRate = (this.results.npm_scripts.length / this.results.total_files) * 100;
    
    console.log('📈 USAGE ANALYSIS');
    console.log('━'.repeat(50));
    console.log(`📊 Total scripts/tests: ${this.results.total_files}`);
    console.log(`🚀 NPM integrated: ${this.results.npm_scripts.length} (${npmIntegrationRate.toFixed(1)}%)`);
    
    // Category distribution
    const scriptCategories = Object.keys(this.results.scripts).filter(cat => 
      this.results.scripts[cat].length > 0
    );
    const testCategories = Object.keys(this.results.tests).filter(cat => 
      this.results.tests[cat].length > 0
    );
    
    console.log(`📂 Script categories in use: ${scriptCategories.length}/${Object.keys(this.categories.scripts).length}`);
    console.log(`🧪 Test categories in use: ${testCategories.length}/${Object.keys(this.categories.tests).length}`);
    
    // Recommendations
    console.log('');
    console.log('💡 RECOMMENDATIONS');
    console.log('━'.repeat(50));
    
    if (npmIntegrationRate < 80) {
      console.log('🔧 Consider adding more npm script integrations');
    }
    
    const uncategorizedScripts = this.results.scripts.uncategorized?.length || 0;
    const uncategorizedTests = this.results.tests.uncategorized?.length || 0;
    
    if (uncategorizedScripts > 0 || uncategorizedTests > 0) {
      console.log('📂 Run "organize" command to categorize files');
    }
    
    console.log('✅ Script ecosystem is well organized!');
  }

  /**
   * Show available categories
   */
  showCategories() {
    console.log('📂 AVAILABLE CATEGORIES');
    console.log('');
    
    console.log('🔧 SCRIPT CATEGORIES:');
    for (const [category, description] of Object.entries(this.categories.scripts)) {
      console.log(`  📁 ${category}/ - ${description}`);
    }
    
    console.log('');
    console.log('🧪 TEST CATEGORIES:');
    for (const [category, description] of Object.entries(this.categories.tests)) {
      console.log(`  📁 ${category}/ - ${description}`);
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🛠️ SCRIPT MANAGER HELP');
    console.log('');
    console.log('📋 AVAILABLE COMMANDS:');
    console.log('');
    console.log('🔍 npm run AAI:scripts-list');
    console.log('   List all scripts and tests with descriptions');
    console.log('');
    console.log('🗂️ npm run AAI:scripts-organize');
    console.log('   Organize scripts into category subdirectories');
    console.log('');
    console.log('📊 npm run AAI:scripts-analyze');
    console.log('   Analyze usage patterns and provide recommendations');
    console.log('');
    console.log('📂 npm run AAI:scripts-categories');
    console.log('   Show available categories for organization');
    console.log('');
    console.log('🚀 npm run AAI:scripts-migrate');
    console.log('   Migrate scripts from ./scripts to .cursor/rules/agents/_store/scripts');
    console.log('');
    console.log('💡 DIRECT USAGE:');
    console.log('   node .cursor/rules/agents/_store/scripts/script_manager.js [command]');
    console.log('');
    console.log('📂 SCRIPT LOCATIONS:');
    console.log('   📁 .cursor/rules/agents/_store/scripts/ - All utility scripts');
    console.log('   📁 .cursor/rules/agents/_store/tests/   - All test files');
    console.log('');
    console.log('📋 ORGANIZATION RULES:');
    console.log('   📖 See: .cursor/rules/agents/_store/projects/_core/rules/00__TOOLS/SCRIPT_ORGANIZATION_RULES.mdc');
  }
}

// Export for use as module
module.exports = ScriptManager;

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'list';
  const manager = new ScriptManager();
  
  manager.manage(command).then(() => {
    console.log('\n🎯 Script manager completed!');
  }).catch(error => {
    console.error('💥 Script manager error:', error.message);
    process.exit(1);
  });
} 
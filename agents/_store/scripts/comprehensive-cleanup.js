#!/usr/bin/env node

/**
 * 🧹 Comprehensive AAI Cleanup & Memory Preservation
 * 
 * Identifies obsolete code, preserves useful parts to memory,
 * and cleans up the agents directory structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AAIComprehensiveCleanup {
  constructor() {
    this.baseDir = process.cwd();
    this.agentsDir = path.join(this.baseDir, 'agents');
    this.storeDir = path.join(this.agentsDir, '_store');
    this.memoryDir = path.join(this.storeDir, 'memory');
    this.archiveDir = path.join(this.storeDir, 'archive');
    
    this.obsoletePatterns = [
      // Multiple cursor rules fixers (keep only the latest/best)
      /cursor_rules.*fixer.*\.js$/,
      /automated_cursor_rules_fixer\.js$/,
      /enhanced_cursor_rules_fixer\.js$/,
      
      // Multiple path fixers (keep only core_path_analyzer and core_path_fixer)
      /absolute_path_fixer\.js$/,
      /core_path_cleaner\.js$/,
      /core_path_emergency_cleaner\.js$/,
      /core_path_final_fixer\.js$/,
      
      // Link repair scripts (functionality now integrated)
      /clean_link_recovery\.js$/,
      /emergency_restore\.js$/,
      /final_link_repair\.js$/,
      /manual_link_fixer\.js$/,
      /replace_file_links\.(js|py|sh)$/,
      
      // Legacy and demo scripts
      /demo.*\.js$/,
      /self_improvement_agent_legacy\.js$/,
      
      // Old test files
      /test_clean_agent\.js$/,
      /test_agent_analysis\.js$/,
      
      // Obsolete utility scripts
      /update_files\.sh$/,
      /update_file_list\.py$/,
    ];

    this.preserveToMemory = [
      // Core functionality to preserve
      'core_path_analyzer.js',
      'core_path_fixer.js',
      'cursor_rules_state_manager.js',
      'integrate_agents_architecture.js',
      'comprehensive_backup_and_fix.js',
      'script_manager.js',
      'sync-memory.js',
      'setup-env.js',
      'install-agent-ai.js'
    ];

    this.keepActive = [
      // Scripts that should remain active
      'script_manager.js',
      'sync-memory.js',
      'setup-env.js',
      'install-agent-ai.js'
    ];

    this.analysis = {
      totalFiles: 0,
      obsoleteFiles: [],
      preservedFiles: [],
      activeFiles: [],
      archivedFiles: [],
      memoryEntries: []
    };
  }

  /**
   * Main cleanup process
   */
  async run() {
    console.log('🧹 COMPREHENSIVE AAI CLEANUP');
    console.log('━'.repeat(60));
    console.log('🔍 Analyzing agents directory structure...\n');

    try {
      // 1. Analyze current structure
      await this.analyzeStructure();

      // 2. Create necessary directories
      await this.setupDirectories();

      // 3. Preserve useful code to memory
      await this.preserveToMemorySystem();

      // 4. Archive obsolete files
      await this.archiveObsoleteFiles();

      // 5. Clean up directory structure
      await this.cleanupDirectories();

      // 6. Update system references
      await this.updateSystemReferences();

      // 7. Generate cleanup report
      await this.generateReport();

      console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('━'.repeat(60));
      this.showSummary();

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze current structure
   */
  async analyzeStructure() {
    console.log('📊 Analyzing current structure...');

    const scriptDirs = [
      path.join(this.storeDir, 'scripts'),
      path.join(this.storeDir, 'projects'),
      path.join(this.storeDir, 'tests')
    ];

    for (const dir of scriptDirs) {
      if (fs.existsSync(dir)) {
        await this.analyzeDirectory(dir);
      }
    }

    console.log(`   📁 Total files analyzed: ${this.analysis.totalFiles}`);
    console.log(`   🗑️ Obsolete files identified: ${this.analysis.obsoleteFiles.length}`);
    console.log(`   💾 Files to preserve: ${this.analysis.preservedFiles.length}`);
    console.log(`   ✅ Active files: ${this.analysis.activeFiles.length}\n`);
  }

  /**
   * Analyze a directory
   */
  async analyzeDirectory(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.py'))) {
        this.analysis.totalFiles++;
        const filePath = path.join(dirPath, file.name);
        
        if (this.isObsolete(file.name)) {
          this.analysis.obsoleteFiles.push(filePath);
        } else if (this.shouldPreserve(file.name)) {
          this.analysis.preservedFiles.push(filePath);
          if (this.shouldKeepActive(file.name)) {
            this.analysis.activeFiles.push(filePath);
          }
        }
      } else if (file.isDirectory()) {
        await this.analyzeDirectory(path.join(dirPath, file.name));
      }
    }
  }

  /**
   * Check if file is obsolete
   */
  isObsolete(filename) {
    return this.obsoletePatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Check if file should be preserved
   */
  shouldPreserve(filename) {
    return this.preserveToMemory.includes(filename);
  }

  /**
   * Check if file should remain active
   */
  shouldKeepActive(filename) {
    return this.keepActive.includes(filename);
  }

  /**
   * Setup necessary directories
   */
  async setupDirectories() {
    console.log('📁 Setting up directories...');

    const dirs = [this.memoryDir, this.archiveDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created: ${path.relative(this.baseDir, dir)}`);
      }
    }
  }

  /**
   * Preserve useful code to memory
   */
  async preserveToMemorySystem() {
    console.log('💾 Preserving useful code to memory...');

    for (const filePath of this.analysis.preservedFiles) {
      await this.preserveFileToMemory(filePath);
    }

    // Create memory index
    await this.createMemoryIndex();
  }

  /**
   * Preserve a single file to memory
   */
  async preserveFileToMemory(filePath) {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract key information
    const memoryEntry = {
      filename,
      originalPath: path.relative(this.baseDir, filePath),
      preservedAt: new Date().toISOString(),
      size: content.length,
      functions: this.extractFunctions(content),
      description: this.extractDescription(content),
      dependencies: this.extractDependencies(content),
      keyFeatures: this.extractKeyFeatures(content)
    };

    // Save to memory
    const memoryFile = path.join(this.memoryDir, `${filename}.memory.json`);
    fs.writeFileSync(memoryFile, JSON.stringify(memoryEntry, null, 2));
    
    // Save original content
    const contentFile = path.join(this.memoryDir, `${filename}.content`);
    fs.writeFileSync(contentFile, content);

    this.analysis.memoryEntries.push(memoryEntry);
    console.log(`   💾 Preserved: ${filename}`);
  }

  /**
   * Extract functions from code
   */
  extractFunctions(content) {
    const functions = [];
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?function|class\s+(\w+))/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      if (name) {
        functions.push(name);
      }
    }

    return functions;
  }

  /**
   * Extract description from code
   */
  extractDescription(content) {
    const lines = content.split('\n');
    const description = [];

    for (const line of lines.slice(0, 20)) {
      if (line.includes('*') && (line.includes('description') || line.includes('purpose'))) {
        description.push(line.trim());
      }
    }

    return description.join(' ') || 'No description available';
  }

  /**
   * Extract dependencies from code
   */
  extractDependencies(content) {
    const deps = [];
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }
    while ((match = importRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    return [...new Set(deps)];
  }

  /**
   * Extract key features from code
   */
  extractKeyFeatures(content) {
    const features = [];
    
    if (content.includes('class ')) features.push('Object-Oriented');
    if (content.includes('async ')) features.push('Async/Await');
    if (content.includes('fs.')) features.push('File System');
    if (content.includes('path.')) features.push('Path Manipulation');
    if (content.includes('spawn') || content.includes('exec')) features.push('Process Management');
    if (content.includes('console.log')) features.push('Logging');
    if (content.includes('JSON.')) features.push('JSON Processing');
    if (content.includes('RegExp') || content.includes('/.*?/')) features.push('Regular Expressions');

    return features;
  }

  /**
   * Create memory index
   */
  async createMemoryIndex() {
    const index = {
      createdAt: new Date().toISOString(),
      totalEntries: this.analysis.memoryEntries.length,
      entries: this.analysis.memoryEntries.map(entry => ({
        filename: entry.filename,
        description: entry.description,
        functions: entry.functions,
        keyFeatures: entry.keyFeatures,
        size: entry.size
      }))
    };

    const indexFile = path.join(this.memoryDir, 'index.json');
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    console.log(`   📋 Created memory index with ${index.totalEntries} entries`);
  }

  /**
   * Archive obsolete files
   */
  async archiveObsoleteFiles() {
    console.log('🗂️ Archiving obsolete files...');

    const archiveDate = new Date().toISOString().split('T')[0];
    const archiveSubDir = path.join(this.archiveDir, archiveDate);
    
    if (!fs.existsSync(archiveSubDir)) {
      fs.mkdirSync(archiveSubDir, { recursive: true });
    }

    for (const filePath of this.analysis.obsoleteFiles) {
      const filename = path.basename(filePath);
      const archivePath = path.join(archiveSubDir, filename);
      
      // Move file to archive
      fs.renameSync(filePath, archivePath);
      this.analysis.archivedFiles.push(archivePath);
      console.log(`   🗂️ Archived: ${filename}`);
    }
  }

  /**
   * Clean up directory structure
   */
  async cleanupDirectories() {
    console.log('🧹 Cleaning up directory structure...');

    // Remove empty directories
    const dirsToCheck = [
      path.join(this.storeDir, 'projects'),
      path.join(this.storeDir, 'scripts', 'cleanup'),
      path.join(this.storeDir, 'scripts', 'migration'),
      path.join(this.storeDir, 'scripts', 'analysis')
    ];

    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          console.log(`   🗑️ Removed empty directory: ${path.relative(this.baseDir, dir)}`);
        }
      }
    }
  }

  /**
   * Update system references
   */
  async updateSystemReferences() {
    console.log('🔄 Updating system references...');

    // Update package.json to remove obsolete script references
    await this.updatePackageJson();

    // Update script manager
    await this.updateScriptManager();

    console.log('   ✅ System references updated');
  }

  /**
   * Update package.json
   */
  async updatePackageJson() {
    const packagePath = path.join(this.baseDir, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Remove obsolete script references
    const obsoleteScripts = [
      'AAI:legacy',
      'AAI:demo'
    ];

    for (const script of obsoleteScripts) {
      if (packageData.scripts[script]) {
        delete packageData.scripts[script];
        console.log(`   🗑️ Removed obsolete script: ${script}`);
      }
    }

    // Add cleanup script
    packageData.scripts['AAI:cleanup'] = 'node agents/_store/scripts/comprehensive-cleanup.js';
    packageData.scripts['AAI:memory-index'] = 'cat agents/_store/memory/index.json';

    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
  }

  /**
   * Update script manager
   */
  async updateScriptManager() {
    // The script manager will automatically detect the new structure
    // Just trigger a refresh
    try {
      execSync('npm run AAI:scripts-analyze', { stdio: 'pipe' });
    } catch (error) {
      // Ignore errors, script manager will adapt
    }
  }

  /**
   * Generate cleanup report
   */
  async generateReport() {
    const report = {
      cleanupDate: new Date().toISOString(),
      summary: {
        totalFilesAnalyzed: this.analysis.totalFiles,
        filesArchived: this.analysis.archivedFiles.length,
        filesPreservedToMemory: this.analysis.memoryEntries.length,
        activeFilesRemaining: this.analysis.activeFiles.length
      },
      archivedFiles: this.analysis.archivedFiles.map(f => path.relative(this.baseDir, f)),
      memoryEntries: this.analysis.memoryEntries.map(e => e.filename),
      activeFiles: this.analysis.activeFiles.map(f => path.relative(this.baseDir, f))
    };

    const reportPath = path.join(this.storeDir, 'CLEANUP_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also create a markdown report
    await this.generateMarkdownReport(report);
  }

  /**
   * Generate markdown report
   */
  async generateMarkdownReport(report) {
    const markdown = `# 🧹 AAI Cleanup Report

**Date:** ${new Date(report.cleanupDate).toLocaleString()}

## 📊 Summary

- **Total files analyzed:** ${report.summary.totalFilesAnalyzed}
- **Files archived:** ${report.summary.filesArchived}
- **Files preserved to memory:** ${report.summary.filesPreservedToMemory}
- **Active files remaining:** ${report.summary.activeFilesRemaining}

## 🗂️ Archived Files

${report.archivedFiles.map(f => `- \`${f}\``).join('\n')}

## 💾 Files Preserved to Memory

${report.memoryEntries.map(f => `- \`${f}\``).join('\n')}

## ✅ Active Files Remaining

${report.activeFiles.map(f => `- \`${f}\``).join('\n')}

## 🎯 Next Steps

1. **Access preserved code:** Use \`npm run AAI:memory-index\` to see memory index
2. **View memory details:** Check \`agents/_store/memory/\` directory
3. **Restore if needed:** Archived files are in \`agents/_store/archive/\`

## 🔧 New Commands Available

- \`npm run AAI:cleanup\` - Run this cleanup script again
- \`npm run AAI:memory-index\` - View memory index
`;

    const reportPath = path.join(this.storeDir, 'CLEANUP_REPORT.md');
    fs.writeFileSync(reportPath, markdown);
  }

  /**
   * Show summary
   */
  showSummary() {
    console.log('📊 CLEANUP SUMMARY:');
    console.log(`   📁 Files analyzed: ${this.analysis.totalFiles}`);
    console.log(`   🗂️ Files archived: ${this.analysis.archivedFiles.length}`);
    console.log(`   💾 Files preserved to memory: ${this.analysis.memoryEntries.length}`);
    console.log(`   ✅ Active files remaining: ${this.analysis.activeFiles.length}`);
    console.log('');
    console.log('🎯 WHAT\'S AVAILABLE:');
    console.log('   📋 Memory index: npm run AAI:memory-index');
    console.log('   📊 Script analysis: npm run AAI:scripts-analyze');
    console.log('   🗂️ Archive location: agents/_store/archive/');
    console.log('   💾 Memory location: agents/_store/memory/');
    console.log('');
    console.log('✨ Your agents directory is now clean and organized!');
  }
}

// CLI execution
if (require.main === module) {
  const cleanup = new AAIComprehensiveCleanup();
  cleanup.run().catch(error => {
    console.error('💥 Cleanup failed:', error.message);
    process.exit(1);
  });
}

module.exports = AAIComprehensiveCleanup; 
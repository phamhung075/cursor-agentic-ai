#!/usr/bin/env node

/**
 * 🧹 Core Path Cleaner
 * 
 * Advanced cleaner to handle remaining redundant path patterns
 * and cleanup invalid files created during fixing
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathCleaner {
  constructor() {
    this.coreDir = '.cursor/rules/agents/_store/projects/_core';
    this.backupDir = `backups/core-path-clean-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.results = {
      filesProcessed: 0,
      filesFixed: 0,
      invalidFilesRemoved: 0,
      redundantPatternsFixed: 0,
      totalFixes: 0,
      errors: []
    };
  }

  /**
   * Run comprehensive cleaning
   */
  async clean() {
    console.log('🧹 CORE PATH CLEANER');
    console.log('━'.repeat(60));
    console.log(`📁 Cleaning paths in: ${this.coreDir}`);
    console.log('');

    try {
      // Create backup
      await this.createBackup();
      
      // Clean invalid files first
      await this.cleanInvalidFiles();
      
      // Get remaining .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to clean`);
      console.log('');

      // Clean each file
      for (const filePath of mdcFiles) {
        await this.cleanFile(filePath);
      }

      // Generate report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Cleaning failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup before cleaning
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    await this.copyDirectory(this.coreDir, path.join(this.backupDir, '.cursor/rules/agents/_store/projects/_core'));
    
    console.log(`✅ Backup created: ${this.backupDir}`);
    console.log('');
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Clean invalid files created during fixing
   */
  async cleanInvalidFiles() {
    console.log('🗑️ Removing invalid files...');
    
    const invalidPatterns = [
      /^mdc:/,
      /\[AI_Coding_Agent_Optimization\.mdc\]/,
      /.cursor/rules/agents\/_store\/project-memory/
    ];
    
    await this.scanAndRemoveInvalidFiles(this.coreDir, invalidPatterns);
    console.log(`✅ Removed ${this.results.invalidFilesRemoved} invalid files`);
    console.log('');
  }

  /**
   * Scan and remove invalid files
   */
  async scanAndRemoveInvalidFiles(dir, patterns) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check if directory name matches invalid patterns
          const shouldRemove = patterns.some(pattern => pattern.test(entry.name));
          if (shouldRemove) {
            await fs.rm(fullPath, { recursive: true, force: true });
            console.log(`  🗑️ Removed invalid directory: ${entry.name}`);
            this.results.invalidFilesRemoved++;
          } else {
            await this.scanAndRemoveInvalidFiles(fullPath, patterns);
          }
        } else {
          // Check if file name matches invalid patterns
          const shouldRemove = patterns.some(pattern => pattern.test(entry.name));
          if (shouldRemove) {
            await fs.unlink(fullPath);
            console.log(`  🗑️ Removed invalid file: ${entry.name}`);
            this.results.invalidFilesRemoved++;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
    }
  }

  /**
   * Get all .mdc files recursively
   */
  async getAllMdcFiles() {
    const files = [];
    
    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
      }
    };

    await scanDirectory(this.coreDir);
    return files;
  }

  /**
   * Clean a single file
   */
  async cleanFile(filePath) {
    try {
      const relativePath = path.relative(this.coreDir, filePath);
      console.log(`🧹 Cleaning: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      this.results.filesProcessed++;

      let fixCount = 0;

      // 1. Fix remaining redundant path patterns
      const redundantFixes = this.cleanRedundantPaths(content);
      content = redundantFixes.content;
      fixCount += redundantFixes.fixes;
      this.results.redundantPatternsFixed += redundantFixes.fixes;

      // 2. Clean double slashes in paths
      const slashFixes = this.cleanDoubleSlashes(content);
      content = slashFixes.content;
      fixCount += slashFixes.fixes;

      // 3. Clean up spacing and formatting
      const formatFixes = this.cleanFormatting(content);
      content = formatFixes.content;
      fixCount += formatFixes.fixes;

      // 4. Final content cleanup
      content = this.finalCleanup(content);

      // Save if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Cleaned ${relativePath} (${fixCount} fixes)`);
        this.results.filesFixed++;
        this.results.totalFixes += fixCount;
      } else {
        console.log(`  ⚪ No changes needed for ${relativePath}`);
      }

    } catch (error) {
      console.error(`  ❌ Error cleaning ${filePath}: ${error.message}`);
      this.results.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Clean redundant path patterns
   */
  cleanRedundantPaths(content) {
    let fixes = 0;
    const originalContent = content;

    // Fix ./ patterns
    content = content.replace(/\/\.\//g, '/');
    if (content !== originalContent) {
      fixes++;
      console.log(`    🧹 Cleaned /./ patterns`);
    }

    // Fix ../ patterns at start of paths
    const beforeDotDot = content;
    content = content.replace(/^\.\.\//gm, '');
    if (content !== beforeDotDot) {
      fixes++;
      console.log(`    🧹 Cleaned leading ../ patterns`);
    }

    // Fix multiple consecutive slashes
    const beforeSlashes = content;
    content = content.replace(/([^:])\/\/+/g, '$1/');
    if (content !== beforeSlashes) {
      fixes++;
      console.log(`    🧹 Cleaned multiple slashes`);
    }

    // Fix redundant path segments
    const beforeSegments = content;
    content = content.replace(/\/[^\/]+\/\.\.\//g, '/');
    if (content !== beforeSegments) {
      fixes++;
      console.log(`    🧹 Cleaned redundant path segments`);
    }

    return { content, fixes };
  }

  /**
   * Clean double slashes specifically
   */
  cleanDoubleSlashes(content) {
    let fixes = 0;
    const beforeFix = content;

    // Fix various double slash patterns
    content = content.replace(/([^:])\/\/+/g, '$1/');
    content = content.replace(/\/\/(?!\/)/g, '/');
    
    if (content !== beforeFix) {
      fixes++;
      console.log(`    🧹 Cleaned double slashes`);
    }

    return { content, fixes };
  }

  /**
   * Clean formatting issues
   */
  cleanFormatting(content) {
    let fixes = 0;
    const originalContent = content;

    // Fix excessive newlines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // Fix trailing whitespace
    content = content.replace(/[ \t]+$/gm, '');
    
    // Fix spacing around links
    content = content.replace(/\s+\[/g, ' [');
    content = content.replace(/\]\s+\(/g, '](');
    
    if (content !== originalContent) {
      fixes++;
      console.log(`    🧹 Cleaned formatting`);
    }

    return { content, fixes };
  }

  /**
   * Final cleanup of content
   */
  finalCleanup(content) {
    // Ensure file ends with single newline
    content = content.replace(/\n*$/, '\n');
    
    // Remove any remaining redundant patterns
    content = content.replace(/\/{2,}/g, '/');
    content = content.replace(/\.\/\.\//g, '../');
    
    return content;
  }

  /**
   * Generate cleaning report
   */
  async generateReport() {
    console.log('');
    console.log('📊 CLEANING RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`✅ Files Cleaned: ${this.results.filesFixed}`);
    console.log(`🗑️ Invalid Files Removed: ${this.results.invalidFilesRemoved}`);
    console.log(`🧹 Redundant Patterns Fixed: ${this.results.redundantPatternsFixed}`);
    console.log(`🔧 Total Fixes: ${this.results.totalFixes}`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = '.cursor/rules/agents/_store/logs/core_path_clean_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results
    }, null, 2));
    console.log(`📝 Detailed report saved: ${reportPath}`);
    console.log(`💾 Backup location: ${this.backupDir}`);
    console.log('');
    console.log('✅ Path cleaning completed!');
  }
}

// Export for use as module
module.exports = CorePathCleaner;

// CLI execution
if (require.main === module) {
  const cleaner = new CorePathCleaner();
  cleaner.clean().then(results => {
    console.log('\n🎯 Cleaning complete!');
    if (results.totalFixes > 0) {
      console.log(`\n🧹 Applied ${results.totalFixes} fixes to ${results.filesFixed} files`);
      console.log(`🗑️ Removed ${results.invalidFilesRemoved} invalid files`);
      console.log('🔍 Run analyzer again to verify improvements');
    } else {
      console.log('\n⚪ No cleaning needed!');
    }
  }).catch(error => {
    console.error('💥 Cleaning error:', error.message);
    process.exit(1);
  });
} 
#!/usr/bin/env node

/**
 * 🚨 Core Path Emergency Cleaner
 * 
 * Specialized cleaner for handling extreme path corruption that standard tools cannot fix
 * This tool targets the most severe cases like malformed recursive paths
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathEmergencyCleaner {
  constructor() {
    this.coreDir = '.cursor/rules/agents/_store/projects/_core';
    this.backupDir = `backups/core-emergency-clean-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.results = {
      filesProcessed: 0,
      severelyCorruted: 0,
      extremePathsFixed: 0,
      totalFixes: 0,
      errors: []
    };
  }

  /**
   * Run emergency cleaning for severe corruption
   */
  async emergencyClean() {
    console.log('🚨 CORE PATH EMERGENCY CLEANER');
    console.log('━'.repeat(60));
    console.log(`📁 Emergency cleaning: ${this.coreDir}`);
    console.log('');

    try {
      // Create backup
      await this.createBackup();
      
      // Get all .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files for emergency cleaning`);
      console.log('');

      // Emergency clean each file
      for (const filePath of mdcFiles) {
        await this.emergencyCleanFile(filePath);
      }

      // Generate report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Emergency cleaning failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup before emergency cleaning
   */
  async createBackup() {
    console.log('📦 Creating emergency backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    await this.copyDirectory(this.coreDir, path.join(this.backupDir, '.cursor/rules/agents/_store/projects/_core'));
    
    console.log(`✅ Emergency backup created: ${this.backupDir}`);
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
   * Emergency clean a single file
   */
  async emergencyCleanFile(filePath) {
    try {
      const relativePath = path.relative(this.coreDir, filePath);
      console.log(`🚨 Emergency cleaning: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      this.results.filesProcessed++;

      let fixCount = 0;
      let isSeverelyCorrupted = false;

      // 1. Detect and fix extremely long malformed paths
      const extremePathFixes = this.fixExtremePaths(content);
      content = extremePathFixes.content;
      fixCount += extremePathFixes.fixes;
      if (extremePathFixes.fixes > 0) {
        isSeverelyCorrupted = true;
        this.results.extremePathsFixed += extremePathFixes.fixes;
      }

      // 2. Fix recursive path patterns
      const recursiveFixes = this.fixRecursivePaths(content);
      content = recursiveFixes.content;
      fixCount += recursiveFixes.fixes;

      // 3. Fix malformed link references
      const linkFixes = this.fixMalformedLinks(content);
      content = linkFixes.content;
      fixCount += linkFixes.fixes;

      // 4. Clean up any remaining mdc: references
      const mdcFixes = this.cleanMdcReferences(content);
      content = mdcFixes.content;
      fixCount += mdcFixes.fixes;

      // 5. Final emergency cleanup
      content = this.emergencyFinalCleanup(content);

      if (isSeverelyCorrupted) {
        this.results.severelyCorruted++;
      }

      // Save if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        console.log(`  🚨 Emergency cleaned ${relativePath} (${fixCount} fixes)`);
        this.results.totalFixes += fixCount;
      } else {
        console.log(`  ⚪ No emergency fixes needed for ${relativePath}`);
      }

    } catch (error) {
      console.error(`  ❌ Error emergency cleaning ${filePath}: ${error.message}`);
      this.results.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Fix extremely long malformed paths
   */
  fixExtremePaths(content) {
    let fixes = 0;
    
    // Pattern for detecting extremely long paths with repeated segments
    const extremePathPattern = /\([^)]*?(\/(01__AI-RUN|02__AI-DOCS|03__SPECS).*?){10,}[^)]*?\)/g;
    
    content = content.replace(extremePathPattern, (match) => {
      fixes++;
      console.log(`    🚨 Found extreme path corruption (${match.length} chars)`);
      
      // Try to extract the intended target file
      const fileMatch = match.match(/([^\/]+\.mdc)\)/);
      if (fileMatch) {
        const filename = fileMatch[1];
        console.log(`    🔧 Attempting to repair link to: ${filename}`);
        
        // Return a simple reference
        return `(${filename})`;
      }
      
      // If we can't determine the target, remove the link
      console.log(`    🗑️ Removing corrupted link`);
      return '';
    });

    return { content, fixes };
  }

  /**
   * Fix recursive path patterns
   */
  fixRecursivePaths(content) {
    let fixes = 0;
    
    // Fix paths with recursive segments like projet/01_Idea/01__AI-RUN/projet/
    const recursivePattern = /(\.\.\/)+([^)]*?\/)\2+/g;
    content = content.replace(recursivePattern, (match, prefix, segment) => {
      fixes++;
      console.log(`    🔄 Fixed recursive path: ${match.substring(0, 50)}...`);
      return prefix + segment;
    });

    return { content, fixes };
  }

  /**
   * Fix malformed link references
   */
  fixMalformedLinks(content) {
    let fixes = 0;
    
    // Fix links that have become corrupted
    content = content.replace(/\[([^\]]+)\]\([^)]*?\/([^\/]*\.mdc)\)/g, (match, linkText, filename) => {
      // If the path is corrupted but we can identify the target file
      if (match.length > 200) { // Arbitrarily long indicates corruption
        fixes++;
        console.log(`    🔗 Simplified corrupted link: ${linkText} -> ${filename}`);
        return `[${linkText}](${filename})`;
      }
      return match;
    });

    return { content, fixes };
  }

  /**
   * Clean up any remaining mdc: references
   */
  cleanMdcReferences(content) {
    let fixes = 0;
    
    // Remove any remaining mdc: patterns
    const mdcPattern = /mdc:[^\s\)\]\,\;]*/g;
    const matches = content.match(mdcPattern);
    
    if (matches) {
      fixes += matches.length;
      console.log(`    🗑️ Removed ${matches.length} remaining mdc: references`);
      content = content.replace(mdcPattern, '');
    }

    return { content, fixes };
  }

  /**
   * Emergency final cleanup
   */
  emergencyFinalCleanup(content) {
    // Remove extremely long paths that might have been missed
    content = content.replace(/\([^)]{500,}\)/g, '');
    
    // Clean up excessive whitespace
    content = content.replace(/\n\n\n+/g, '\n\n');
    content = content.replace(/[ \t]+$/gm, '');
    
    // Ensure file ends with single newline
    content = content.replace(/\n*$/, '\n');
    
    return content;
  }

  /**
   * Generate emergency cleaning report
   */
  async generateReport() {
    console.log('');
    console.log('📊 EMERGENCY CLEANING RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`🚨 Severely Corrupted Files: ${this.results.severelyCorruted}`);
    console.log(`🔧 Extreme Paths Fixed: ${this.results.extremePathsFixed}`);
    console.log(`🔧 Total Emergency Fixes: ${this.results.totalFixes}`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = '.cursor/rules/agents/_store/logs/core_emergency_clean_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results
    }, null, 2));
    console.log(`📝 Emergency report saved: ${reportPath}`);
    console.log(`💾 Emergency backup location: ${this.backupDir}`);
    console.log('');
    console.log('🚨 Emergency cleaning completed!');
  }
}

// Export for use as module
module.exports = CorePathEmergencyCleaner;

// CLI execution
if (require.main === module) {
  const cleaner = new CorePathEmergencyCleaner();
  cleaner.emergencyClean().then(results => {
    console.log('\n🎯 Emergency cleaning complete!');
    if (results.totalFixes > 0) {
      console.log(`\n🚨 Applied ${results.totalFixes} emergency fixes`);
      console.log(`🔧 Fixed ${results.extremePathsFixed} extreme path corruptions`);
      console.log('🔍 Run standard analyzer to check remaining issues');
    } else {
      console.log('\n⚪ No emergency cleaning needed!');
    }
  }).catch(error => {
    console.error('💥 Emergency cleaning error:', error.message);
    process.exit(1);
  });
} 
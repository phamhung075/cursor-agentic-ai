#!/usr/bin/env node

/**
 * 🔧 Enhanced Cursor Rules Fixer
 * 
 * Specialized fixer for remaining broken references with full paths
 * Targets .cursor/rules/ prefixed paths and self-referential links
 */

const fs = require('fs').promises;
const path = require('path');

class EnhancedCursorRulesFixer {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.results = {
      filesProcessed: 0,
      linksFixed: 0,
      selfReferencesRemoved: 0,
      redundantPathsFixed: 0,
      errors: []
    };
  }

  /**
   * Run enhanced fixes for remaining issues
   */
  async runEnhancedFixes() {
    console.log('🔧 Enhanced Cursor Rules Fixer');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Get all .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📊 Found ${mdcFiles.length} .mdc files to process`);
      console.log('');

      // Process each file
      for (const filePath of mdcFiles) {
        await this.processFile(filePath);
      }

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Enhanced fix failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all .mdc files in rules directory
   */
  async getAllMdcFiles() {
    const files = [];
    
    const scanDirectory = async (dir, relativeTo = this.baseDir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath, relativeTo);
          } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
            files.push(path.relative(relativeTo, fullPath));
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    };

    await scanDirectory(this.baseDir);
    return files;
  }

  /**
   * Process a single file for enhanced fixes
   */
  async processFile(filePath) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      const fullPath = path.resolve(this.baseDir, filePath);
      let content = await fs.readFile(fullPath, 'utf8');
      let hasChanges = false;
      let changesCount = 0;

      // Create backup
      await this.createBackup(filePath);

      // 1. Fix .cursor/rules/ prefixed paths
      const fullPathPattern = /.cursor/rules/agents\/_store\/projects\/_core\/rules\/([^\s\)\]]+)/g;
      content = content.replace(fullPathPattern, (match, relativePath) => {
        // Convert to proper relative path
        const currentDir = path.dirname(filePath);
        const targetPath = relativePath;
        const relativeToCurrentFile = path.relative(currentDir, targetPath);
        
        hasChanges = true;
        changesCount++;
        this.results.redundantPathsFixed++;
        
        console.log(`  🔧 Fixed path: ${match} → ${relativeToCurrentFile || targetPath}`);
        return relativeToCurrentFile || targetPath;
      });

      // 2. Remove self-referential links
      const fileName = path.basename(filePath);
      const selfRefPatterns = [
        new RegExp(`\\[([^\\]]*?)\\]\\([^\\)]*?${this.escapeRegex(fileName)}\\)`, 'g'),
        new RegExp(`\\[${this.escapeRegex(fileName)}\\]`, 'g')
      ];

      for (const pattern of selfRefPatterns) {
        content = content.replace(pattern, (match, linkText) => {
          if (linkText && linkText !== fileName) {
            hasChanges = true;
            changesCount++;
            this.results.selfReferencesRemoved++;
            console.log(`  🗑️ Removed self-reference: ${match} → ${linkText}`);
            return linkText; // Keep just the text, remove the link
          } else {
            hasChanges = true;
            changesCount++;
            this.results.selfReferencesRemoved++;
            console.log(`  🗑️ Removed redundant self-reference: ${match}`);
            return ''; // Remove entirely
          }
        });
      }

      // 3. Fix broken markdown link formats
      const brokenLinkPattern = /\[([^\]]+)\]\(\s*\)/g;
      content = content.replace(brokenLinkPattern, (match, linkText) => {
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed broken link: ${match} → ${linkText}`);
        return linkText; // Convert broken link to plain text
      });

      // 4. Fix redundant/empty references
      const redundantPatterns = [
        /\[filename\.mdc\]/g,
        /\[t\.mdc\]/g,
        /\[\s*\]/g,
        /\(\s*\)/g
      ];

      for (const pattern of redundantPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          hasChanges = true;
          changesCount++;
          this.results.redundantPathsFixed++;
          console.log(`  🧹 Cleaned redundant pattern`);
        }
      }

      // 5. Normalize spacing around links
      content = content.replace(/\s+\[/g, ' [');
      content = content.replace(/\]\s+\(/g, '](');

      // Save if changes were made
      if (hasChanges) {
        await fs.writeFile(fullPath, content);
        console.log(`  ✅ Updated ${filePath} (${changesCount} fixes)`);
        this.results.filesProcessed++;
        this.results.linksFixed += changesCount;
      } else {
        console.log(`  ⚪ No changes needed for ${filePath}`);
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
      this.results.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Create backup of file before modification
   */
  async createBackup(filePath) {
    const fullPath = path.resolve(this.baseDir, filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../project-memory/enhanced-backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupFileName = `${path.basename(filePath, path.extname(filePath))}_enhanced_${timestamp}${path.extname(filePath)}`;
    const backupPath = path.join(backupDir, backupFileName);
    
    try {
      await fs.copyFile(fullPath, backupPath);
    } catch (error) {
      console.warn(`  ⚠️ Could not create backup for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Escape string for regex
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('');
    console.log('📊 Enhanced Fix Results');
    console.log('━'.repeat(50));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`🔗 Links Fixed: ${this.results.linksFixed}`);
    console.log(`🗑️ Self-References Removed: ${this.results.selfReferencesRemoved}`);
    console.log(`📁 Redundant Paths Fixed: ${this.results.redundantPathsFixed}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('');
      console.log('❌ Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
    }

    console.log('');
    console.log('✅ Enhanced fixes completed!');
    console.log('🔄 Run the test suite again to verify improvements');
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new EnhancedCursorRulesFixer();
  fixer.runEnhancedFixes().catch(error => {
    console.error('💥 Enhanced fix error:', error.message);
    process.exit(1);
  });
}

module.exports = EnhancedCursorRulesFixer; 
#!/usr/bin/env node

/**
 * 🔧 Core Path Fixer
 * 
 * Comprehensive fixer to resolve all corrupt, obsolete, and broken path patterns
 * in agents/_store/projects/_core content after migration
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathFixer {
  constructor() {
    this.coreDir = 'agents/_store/projects/_core';
    this.rulesDir = path.join(this.coreDir, 'rules');
    this.backupDir = `backups/core-path-fix-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.results = {
      filesProcessed: 0,
      filesFixed: 0,
      totalFixes: 0,
      obsoletePathsFixed: 0,
      corruptPathsFixed: 0,
      brokenLinksFixed: 0,
      selfReferencesRemoved: 0,
      missingFilesHandled: 0,
      errors: []
    };
  }

  /**
   * Run comprehensive fixing
   */
  async fix() {
    console.log('🔧 CORE PATH FIXER');
    console.log('━'.repeat(60));
    console.log(`📁 Fixing paths in: ${this.coreDir}`);
    console.log('');

    try {
      // Create backup
      await this.createBackup();
      
      // Get all .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to fix`);
      console.log('');

      // Fix each file
      for (const filePath of mdcFiles) {
        await this.fixFile(filePath);
      }

      // Generate report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Fixing failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup of all files before fixing
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Copy entire _core directory
    await this.copyDirectory(this.coreDir, path.join(this.backupDir, 'agents/_store/projects/_core'));
    
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
   * Fix a single file
   */
  async fixFile(filePath) {
    try {
      const relativePath = path.relative(this.coreDir, filePath);
      const filename = path.basename(filePath);
      console.log(`🔧 Fixing: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      this.results.filesProcessed++;

      let fixCount = 0;

      // 1. Fix obsolete .cursor paths
      const cursorFixes = this.fixObsoleteCursorPaths(content, filePath);
      content = cursorFixes.content;
      fixCount += cursorFixes.fixes;
      this.results.obsoletePathsFixed += cursorFixes.fixes;

      // 2. Fix broken absolute paths
      const absoluteFixes = this.fixBrokenAbsolutePaths(content, filePath);
      content = absoluteFixes.content;
      fixCount += absoluteFixes.fixes;
      this.results.corruptPathsFixed += absoluteFixes.fixes;

      // 3. Remove self-references
      const selfRefFixes = this.removeSelfReferences(content, filename);
      content = selfRefFixes.content;
      fixCount += selfRefFixes.fixes;
      this.results.selfReferencesRemoved += selfRefFixes.fixes;

      // 4. Fix broken links
      const linkFixes = this.fixBrokenLinks(content);
      content = linkFixes.content;
      fixCount += linkFixes.fixes;
      this.results.brokenLinksFixed += linkFixes.fixes;

      // 5. Clean redundant paths
      const redundantFixes = this.cleanRedundantPaths(content);
      content = redundantFixes.content;
      fixCount += redundantFixes.fixes;

      // 6. Fix missing file references (create placeholder if needed)
      const missingFixes = await this.handleMissingFiles(content, filePath);
      content = missingFixes.content;
      fixCount += missingFixes.fixes;
      this.results.missingFilesHandled += missingFixes.fixes;

      // 7. Final cleanup
      content = this.finalCleanup(content);

      // Save if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Fixed ${relativePath} (${fixCount} fixes)`);
        this.results.filesFixed++;
        this.results.totalFixes += fixCount;
      } else {
        console.log(`  ⚪ No changes needed for ${relativePath}`);
      }

    } catch (error) {
      console.error(`  ❌ Error fixing ${filePath}: ${error.message}`);
      this.results.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Fix obsolete .cursor path patterns
   */
  fixObsoleteCursorPaths(content, currentFilePath) {
    let fixes = 0;
    const currentDir = path.dirname(currentFilePath);
    
    // Fix .cursor/rules/ in links
    content = content.replace(/\[([^\]]+)\]\(\.cursor\/rules\/([^)]+)\)/g, (match, text, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      fixes++;
      console.log(`    🔄 .cursor link: ${match} → [${text}](${relativePath})`);
      return `[${text}](${relativePath})`;
    });

    // Fix standalone .cursor/rules/ references
    content = content.replace(/\.cursor\/rules\/([^\s\)\]\,\;]+)/g, (match, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      fixes++;
      console.log(`    🔄 .cursor path: ${match} → ${relativePath}`);
      return relativePath;
    });

    // Fix backtick-wrapped .cursor paths
    content = content.replace(/`\.cursor\/rules\/([^`]+)`/g, (match, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      fixes++;
      console.log(`    🔄 .cursor backtick: ${match} → \`${relativePath}\``);
      return `\`${relativePath}\``;
    });

    return { content, fixes };
  }

  /**
   * Fix broken absolute paths
   */
  fixBrokenAbsolutePaths(content, currentFilePath) {
    let fixes = 0;
    const currentDir = path.dirname(currentFilePath);
    
    // Fix absolute paths in links
    content = content.replace(/\[([^\]]+)\]\(agents\/_store\/projects\/_core\/rules\/([^)]+)\)/g, (match, text, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      fixes++;
      console.log(`    🔄 Absolute link: ${match} → [${text}](${relativePath})`);
      return `[${text}](${relativePath})`;
    });

    // Fix standalone absolute paths
    content = content.replace(/agents\/_store\/projects\/_core\/rules\/([^\s\)\]\,\;]+)/g, (match, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      fixes++;
      console.log(`    🔄 Absolute path: ${match} → ${relativePath}`);
      return relativePath;
    });

    return { content, fixes };
  }

  /**
   * Remove self-references
   */
  removeSelfReferences(content, filename) {
    let fixes = 0;

    // Remove self-referential links
    const selfRefPattern = new RegExp(`\\[([^\\]]*?)\\]\\([^\\)]*?${this.escapeRegex(filename)}\\)`, 'g');
    content = content.replace(selfRefPattern, (match, linkText) => {
      fixes++;
      console.log(`    🗑️ Self-ref: ${match} → ${linkText || '(removed)'}`);
      return linkText || '';
    });

    // Remove standalone filename references in brackets
    const standalonePattern = new RegExp(`\\[${this.escapeRegex(filename)}\\]`, 'g');
    content = content.replace(standalonePattern, (match) => {
      fixes++;
      console.log(`    🗑️ Self-ref bracket: ${match} → (removed)`);
      return '';
    });

    return { content, fixes };
  }

  /**
   * Fix broken markdown links
   */
  fixBrokenLinks(content) {
    let fixes = 0;

    // Fix empty links
    content = content.replace(/\[([^\]]+)\]\(\s*\)/g, (match, linkText) => {
      fixes++;
      console.log(`    🔗 Empty link: ${match} → ${linkText}`);
      return linkText;
    });

    // Fix numbered references
    content = content.replace(/\]\([0-9]+\)/g, (match) => {
      fixes++;
      console.log(`    🔗 Numbered ref: ${match} → ]`);
      return ']';
    });

    // Fix standalone numbers in brackets
    content = content.replace(/\[[0-9]+\]/g, (match) => {
      fixes++;
      console.log(`    🔗 Number bracket: ${match} → (removed)`);
      return '';
    });

    // Fix generic broken patterns
    content = content.replace(/\[filename\.mdc\]/g, (match) => {
      fixes++;
      console.log(`    🔗 Generic ref: ${match} → (removed)`);
      return '';
    });

    content = content.replace(/\[t\.mdc\]/g, (match) => {
      fixes++;
      console.log(`    🔗 Generic ref: ${match} → (removed)`);
      return '';
    });

    return { content, fixes };
  }

  /**
   * Clean redundant path patterns
   */
  cleanRedundantPaths(content) {
    let fixes = 0;

    // Fix /./ patterns
    const originalContent = content;
    content = content.replace(/\/\.\//g, '/');
    if (content !== originalContent) {
      fixes++;
      console.log(`    🧹 Cleaned /./ patterns`);
    }

    // Fix multiple slashes
    const beforeSlashes = content;
    content = content.replace(/([^:])\/\/+/g, '$1/');
    if (content !== beforeSlashes) {
      fixes++;
      console.log(`    🧹 Cleaned multiple slashes`);
    }

    return { content, fixes };
  }

  /**
   * Handle missing file references
   */
  async handleMissingFiles(content, currentFilePath) {
    let fixes = 0;
    const currentDir = path.dirname(currentFilePath);
    
    // Find all file references
    const linkPattern = /\[([^\]]+)\]\(([^)]+\.mdc)\)/g;
    let match;
    const missingFiles = [];
    
    while ((match = linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, referencedFile] = match;
      const referencedPath = path.resolve(currentDir, referencedFile);
      
      try {
        await fs.access(referencedPath);
      } catch (error) {
        missingFiles.push({ fullMatch, linkText, referencedFile, referencedPath });
      }
    }

    // Handle missing files
    for (const missing of missingFiles) {
      console.log(`    📁 Missing file: ${missing.referencedFile}`);
      
      // Option 1: Create placeholder file
      try {
        await fs.mkdir(path.dirname(missing.referencedPath), { recursive: true });
        const placeholderContent = `# ${missing.linkText}

*This file was automatically created as a placeholder.*

## Purpose

Referenced from: ${path.relative(this.coreDir, currentFilePath)}

## Status

🚧 **Placeholder** - Content needs to be added

---
*Generated by Core Path Fixer*
`;
        await fs.writeFile(missing.referencedPath, placeholderContent);
        console.log(`      ✅ Created placeholder: ${missing.referencedFile}`);
        fixes++;
      } catch (error) {
        // Option 2: Convert to plain text if can't create file
        content = content.replace(missing.fullMatch, missing.linkText);
        console.log(`      🔄 Converted to text: ${missing.fullMatch} → ${missing.linkText}`);
        fixes++;
      }
    }

    return { content, fixes };
  }

  /**
   * Final cleanup of content
   */
  finalCleanup(content) {
    // Remove excessive whitespace
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // Remove trailing whitespace
    content = content.replace(/[ \t]+$/gm, '');
    
    // Ensure file ends with single newline
    content = content.replace(/\n*$/, '\n');
    
    return content;
  }

  /**
   * Calculate relative path from current directory to target
   */
  calculateRelativePath(currentDir, targetPath) {
    const rulesDir = path.join(this.coreDir, 'rules');
    const currentRelativeToRules = path.relative(rulesDir, currentDir);
    
    if (currentRelativeToRules === '') {
      // We're in the rules directory
      return targetPath;
    } else if (currentRelativeToRules.startsWith('..')) {
      // We're outside the rules directory
      return path.join('rules', targetPath).replace(/\\/g, '/');
    } else {
      // We're in a subdirectory of rules
      const depth = currentRelativeToRules.split(path.sep).length;
      const backtrack = '../'.repeat(depth);
      return (backtrack + targetPath).replace(/\\/g, '/');
    }
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate comprehensive fixing report
   */
  async generateReport() {
    console.log('');
    console.log('📊 FIXING RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`✅ Files Fixed: ${this.results.filesFixed}`);
    console.log(`🔧 Total Fixes: ${this.results.totalFixes}`);
    console.log('');
    
    console.log('📋 FIX BREAKDOWN:');
    console.log(`  🗂️ Obsolete .cursor paths: ${this.results.obsoletePathsFixed}`);
    console.log(`  💥 Corrupt paths: ${this.results.corruptPathsFixed}`);
    console.log(`  🔗 Broken links: ${this.results.brokenLinksFixed}`);
    console.log(`  🔄 Self-references: ${this.results.selfReferencesRemoved}`);
    console.log(`  📁 Missing files: ${this.results.missingFilesHandled}`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = 'agents/_store/logs/core_path_fix_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results
    }, null, 2));
    console.log(`📝 Detailed report saved: ${reportPath}`);
    console.log(`💾 Backup location: ${this.backupDir}`);
    console.log('');
    console.log('✅ Path fixing completed!');
  }
}

// Export for use as module
module.exports = CorePathFixer;

// CLI execution
if (require.main === module) {
  const fixer = new CorePathFixer();
  fixer.fix().then(results => {
    console.log('\n🎯 Fixing complete!');
    if (results.totalFixes > 0) {
      console.log(`\n🔧 Applied ${results.totalFixes} fixes to ${results.filesFixed} files`);
      console.log('🧪 Run tests to verify the fixes work correctly');
    } else {
      console.log('\n⚪ No fixes needed!');
    }
  }).catch(error => {
    console.error('💥 Fixing error:', error.message);
    process.exit(1);
  });
} 
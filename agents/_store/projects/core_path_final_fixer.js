#!/usr/bin/env node

/**
 * 🎯 Core Path Final Fixer
 * 
 * Targeted fixer for the remaining broken links and missing file references
 * that the standard tools cannot handle. Focuses on the final cleanup.
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathFinalFixer {
  constructor() {
    this.coreDir = 'agents/_store/projects/_core';
    this.backupDir = `backups/core-final-fix-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.results = {
      filesProcessed: 0,
      brokenLinksFixed: 0,
      missingFilesHandled: 0,
      redundantPatternsFixed: 0,
      totalFixes: 0,
      errors: []
    };
  }

  /**
   * Run final targeted fixing
   */
  async finalFix() {
    console.log('🎯 CORE PATH FINAL FIXER');
    console.log('━'.repeat(60));
    console.log(`📁 Final fixing: ${this.coreDir}`);
    console.log('');

    try {
      // Create backup
      await this.createBackup();
      
      // Get all .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files for final fixing`);
      console.log('');

      // Final fix each file
      for (const filePath of mdcFiles) {
        await this.finalFixFile(filePath);
      }

      // Generate report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Final fixing failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup before final fixing
   */
  async createBackup() {
    console.log('📦 Creating final backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    await this.copyDirectory(this.coreDir, path.join(this.backupDir, 'agents/_store/projects/_core'));
    
    console.log(`✅ Final backup created: ${this.backupDir}`);
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
   * Final fix a single file
   */
  async finalFixFile(filePath) {
    try {
      const relativePath = path.relative(this.coreDir, filePath);
      console.log(`🎯 Final fixing: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      this.results.filesProcessed++;

      let fixCount = 0;

      // 1. Fix broken markdown links
      const linkFixes = this.fixBrokenMarkdownLinks(content);
      content = linkFixes.content;
      fixCount += linkFixes.fixes;
      this.results.brokenLinksFixed += linkFixes.fixes;

      // 2. Handle missing file references
      const missingFixes = await this.handleMissingFileReferences(content, filePath);
      content = missingFixes.content;
      fixCount += missingFixes.fixes;
      this.results.missingFilesHandled += missingFixes.fixes;

      // 3. Fix remaining redundant patterns
      const redundantFixes = this.fixRemainingRedundantPatterns(content);
      content = redundantFixes.content;
      fixCount += redundantFixes.fixes;
      this.results.redundantPatternsFixed += redundantFixes.fixes;

      // 4. Clean problematic file paths in filenames
      const pathFixes = this.cleanProblematicFilePaths(filePath);
      if (pathFixes.shouldRename) {
        await this.renameProblematicFile(filePath, pathFixes.newPath);
        console.log(`    📝 Renamed problematic file: ${relativePath} -> ${path.relative(this.coreDir, pathFixes.newPath)}`);
        fixCount++;
      }

      // Save if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        console.log(`  🎯 Final fixed ${relativePath} (${fixCount} fixes)`);
        this.results.totalFixes += fixCount;
      } else if (fixCount > 0) {
        console.log(`  🎯 Final fixed ${relativePath} (${fixCount} fixes - file operations)`);
        this.results.totalFixes += fixCount;
      } else {
        console.log(`  ⚪ No final fixes needed for ${relativePath}`);
      }

    } catch (error) {
      console.error(`  ❌ Error final fixing ${filePath}: ${error.message}`);
      this.results.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Fix broken markdown links
   */
  fixBrokenMarkdownLinks(content) {
    let fixes = 0;

    // Fix empty or broken link references
    content = content.replace(/\[([^\]]+)\]\(\s*\)/g, (match, linkText) => {
      fixes++;
      console.log(`    🔗 Fixed empty link: ${match} -> ${linkText}`);
      return linkText;
    });

    // Fix links with only filenames that should be removed or simplified
    content = content.replace(/\[([^\]]+)\]\(([^)\/\s]+\.mdc)\)/g, (match, linkText, filename) => {
      // If link text is the same as filename (minus extension), convert to plain text
      if (linkText.toLowerCase().replace(/[_\s-]/g, '') === filename.toLowerCase().replace('.mdc', '').replace(/[_\s-]/g, '')) {
        fixes++;
        console.log(`    🔗 Simplified redundant link: ${match} -> ${linkText}`);
        return linkText;
      }
      return match;
    });

    // Fix malformed link syntax
    content = content.replace(/\]\([0-9]+\)/g, ']');
    content = content.replace(/\[[0-9]+\]/g, '');

    return { content, fixes };
  }

  /**
   * Handle missing file references
   */
  async handleMissingFileReferences(content, currentFilePath) {
    let fixes = 0;
    const currentDir = path.dirname(currentFilePath);

    // Find all markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+\.mdc)\)/g;
    let match;
    const brokenLinks = [];

    while ((match = linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, referencedFile] = match;
      
      // Skip if it's just a filename without path
      if (!referencedFile.includes('/') && !referencedFile.includes('\\')) {
        continue;
      }

      const referencedPath = path.resolve(currentDir, referencedFile);
      
      try {
        await fs.access(referencedPath);
      } catch (error) {
        brokenLinks.push({ fullMatch, linkText, referencedFile });
      }
    }

    // Handle broken links
    for (const brokenLink of brokenLinks) {
      // Convert broken link to plain text
      content = content.replace(brokenLink.fullMatch, brokenLink.linkText);
      fixes++;
      console.log(`    📁 Fixed missing file link: ${brokenLink.fullMatch} -> ${brokenLink.linkText}`);
    }

    return { content, fixes };
  }

  /**
   * Fix remaining redundant patterns
   */
  fixRemainingRedundantPatterns(content) {
    let fixes = 0;

    // Fix any remaining double slashes
    const beforeSlashes = content;
    content = content.replace(/([^:])\/\/+/g, '$1/');
    if (content !== beforeSlashes) {
      fixes++;
      console.log(`    🧹 Fixed remaining double slashes`);
    }

    // Fix remaining /./ patterns
    const beforeDotSlash = content;
    content = content.replace(/\/\.\//g, '/');
    if (content !== beforeDotSlash) {
      fixes++;
      console.log(`    🧹 Fixed remaining /./ patterns`);
    }

    // Fix excessive whitespace
    const beforeWhitespace = content;
    content = content.replace(/\n\n\n+/g, '\n\n');
    content = content.replace(/[ \t]+$/gm, '');
    if (content !== beforeWhitespace) {
      fixes++;
      console.log(`    🧹 Fixed excessive whitespace`);
    }

    return { content, fixes };
  }

  /**
   * Clean problematic file paths
   */
  cleanProblematicFilePaths(filePath) {
    const filename = path.basename(filePath);
    const directory = path.dirname(filePath);

    // Check for problematic characters or patterns in filename
    const hasProblematicPath = filePath.includes('corrupted-backup') || 
                              filePath.includes('project-memory') ||
                              filename.startsWith('[') ||
                              filename.includes('](');

    if (hasProblematicPath) {
      // Generate a clean filename
      let cleanFilename = filename
        .replace(/^\[/, '')
        .replace(/\]\([^)]*\)/, '')
        .replace(/[^\w.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (!cleanFilename.endsWith('.mdc')) {
        cleanFilename += '.mdc';
      }

      const newPath = path.join(directory, cleanFilename);
      return { shouldRename: true, newPath };
    }

    return { shouldRename: false };
  }

  /**
   * Rename problematic file
   */
  async renameProblematicFile(oldPath, newPath) {
    try {
      // Ensure the new path doesn't already exist
      let finalNewPath = newPath;
      let counter = 1;
      
      while (true) {
        try {
          await fs.access(finalNewPath);
          // File exists, try with a number suffix
          const ext = path.extname(newPath);
          const base = path.basename(newPath, ext);
          const dir = path.dirname(newPath);
          finalNewPath = path.join(dir, `${base}_${counter}${ext}`);
          counter++;
        } catch (error) {
          // File doesn't exist, we can use this path
          break;
        }
      }

      await fs.rename(oldPath, finalNewPath);
      return finalNewPath;
    } catch (error) {
      console.warn(`    ⚠️ Could not rename ${oldPath}: ${error.message}`);
      return oldPath;
    }
  }

  /**
   * Generate final fixing report
   */
  async generateReport() {
    console.log('');
    console.log('📊 FINAL FIXING RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`🔗 Broken Links Fixed: ${this.results.brokenLinksFixed}`);
    console.log(`📁 Missing Files Handled: ${this.results.missingFilesHandled}`);
    console.log(`🧹 Redundant Patterns Fixed: ${this.results.redundantPatternsFixed}`);
    console.log(`🔧 Total Final Fixes: ${this.results.totalFixes}`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = 'agents/_store/logs/core_final_fix_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results
    }, null, 2));
    console.log(`📝 Final report saved: ${reportPath}`);
    console.log(`💾 Final backup location: ${this.backupDir}`);
    console.log('');
    console.log('🎯 Final fixing completed!');
  }
}

// Export for use as module
module.exports = CorePathFinalFixer;

// CLI execution
if (require.main === module) {
  const fixer = new CorePathFinalFixer();
  fixer.finalFix().then(results => {
    console.log('\n🎯 Final fixing complete!');
    if (results.totalFixes > 0) {
      console.log(`\n🔧 Applied ${results.totalFixes} final fixes`);
      console.log(`🔗 Fixed ${results.brokenLinksFixed} broken links`);
      console.log(`📁 Handled ${results.missingFilesHandled} missing file references`);
      console.log(`🧹 Fixed ${results.redundantPatternsFixed} redundant patterns`);
      console.log('🔍 Run final analyzer to check results');
    } else {
      console.log('\n⚪ No final fixes needed!');
    }
  }).catch(error => {
    console.error('💥 Final fixing error:', error.message);
    process.exit(1);
  });
} 
#!/usr/bin/env node

/**
 * 🧼 Clean Link Recovery Script
 * 
 * Removes all corrupted numbered references and broken link formats
 * Restores files to readable, functional state
 */

const fs = require('fs').promises;
const path = require('path');

class CleanLinkRecovery {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.cleaned = 0;
    this.errors = [];
  }

  /**
   * Main recovery function
   */
  async cleanAllFiles() {
    console.log('🧼 CLEAN LINK RECOVERY OPERATION');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Get all .mdc files recursively
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to clean`);
      console.log('');

      // Clean each file
      for (const filePath of mdcFiles) {
        await this.cleanFile(filePath);
      }

      console.log('');
      console.log('✅ CLEAN LINK RECOVERY COMPLETE');
      console.log(`📄 Files Cleaned: ${this.cleaned}`);
      console.log(`❌ Errors: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log('');
        console.log('❌ Cleaning Errors:');
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('💥 Clean link recovery failed:', error.message);
      throw error;
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
        // Directory doesn't exist or can't be read
      }
    };

    await scanDirectory(this.baseDir);
    return files;
  }

  /**
   * Clean a single file
   */
  async cleanFile(filePath) {
    try {
      const relativePath = path.relative(this.baseDir, filePath);
      console.log(`🧼 Cleaning: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      let hasChanges = false;
      let changesCount = 0;

      // 1. Remove numbered references like [4535]
      const numberedRefPattern = /\[(\d+)\]/g;
      if (numberedRefPattern.test(content)) {
        content = content.replace(numberedRefPattern, '');
        hasChanges = true;
        changesCount++;
        console.log(`  🔢 Removed numbered references`);
      }

      // 2. Fix broken links with numbered refs and mdc: prefixes
      // Pattern: [text](mdc:path) or [text]([number](path)(mdc:path))
      const brokenLinkPatterns = [
        // Fix [text]([number](path)(mdc:path)) -> [text](path)
        /\[([^\]]+)\]\(\[(\d+)\]\([^)]+\)\(mdc:([^)]+)\)\)/g,
        // Fix [text](mdc:path) -> [text](path)
        /\[([^\]]+)\]\(mdc:([^)]+)\)/g,
        // Fix [number](path)(mdc:path) -> path
        /\[(\d+)\]\(([^)]+)\)\(mdc:([^)]+)\)/g,
        // Fix standalone numbered links [number](path)
        /\[(\d+)\]\(([^)]+)\)/g
      ];

      for (const pattern of brokenLinkPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match, ...groups) => {
            if (groups.length >= 3) {
              // [text]([number](path)(mdc:path)) -> [text](path)
              return `[${groups[0]}](${groups[2]})`;
            } else if (groups.length === 2) {
              if (match.includes('mdc:')) {
                // [text](mdc:path) -> [text](path)
                return `[${groups[0]}](${groups[1]})`;
              } else {
                // [number](path) -> path (remove link, keep just path)
                return groups[1];
              }
            }
            return match;
          });
          hasChanges = true;
          changesCount++;
          console.log(`  🔗 Fixed broken link patterns`);
        }
      }

      // 3. Clean up malformed markdown patterns
      const cleanupPatterns = [
        // Remove standalone mdc: prefixes
        { pattern: /mdc:/g, replacement: '' },
        // Fix double parentheses ))
        { pattern: /\)\)/g, replacement: ')' },
        // Fix empty brackets []
        { pattern: /\[\s*\]/g, replacement: '' },
        // Fix empty parentheses ()
        { pattern: /\(\s*\)/g, replacement: '' },
        // Fix double periods ..
        { pattern: /\.{2,}/g, replacement: '.' },
        // Clean up extra spaces
        { pattern: /\s{3,}/g, replacement: '  ' }
      ];

      for (const { pattern, replacement } of cleanupPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          hasChanges = true;
        }
      }

      // 4. Fix relative paths to be consistent
      const pathMappings = {
        '.cursor/rules/01__AI-RUN/': '',
        '.cursor/rules/02__AI-DOCS/': '../02__AI-DOCS/',
        '.cursor/rules/03__SPECS/': '../03__SPECS/',
        '.cursor/rules/projet/': '../projet/',
        '.cursor/rules/tasks/': '../tasks/',
        '.cursor/rules/': '../'
      };

      for (const [oldPath, newPath] of Object.entries(pathMappings)) {
        if (content.includes(oldPath)) {
          content = content.replace(new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
          hasChanges = true;
          changesCount++;
        }
      }

      // Save if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Cleaned ${relativePath} (${changesCount} fixes)`);
        this.cleaned++;
      } else {
        console.log(`  ⚪ No cleaning needed for ${relativePath}`);
      }

    } catch (error) {
      const errorMsg = `Failed to clean ${filePath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }
}

// CLI execution
if (require.main === module) {
  const cleaner = new CleanLinkRecovery();
  cleaner.cleanAllFiles().catch(error => {
    console.error('💥 Clean link recovery error:', error.message);
    process.exit(1);
  });
}

module.exports = CleanLinkRecovery; 
#!/usr/bin/env node

/**
 * 🎯 Absolute Path Fixer
 * 
 * Specifically targets and fixes all .cursor/rules/ absolute paths
 * Converts them to proper relative paths based on file location
 */

const fs = require('fs').promises;
const path = require('path');

class AbsolutePathFixer {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.fixed = 0;
    this.errors = [];
  }

  /**
   * Main execution function
   */
  async execute() {
    console.log('🎯 ABSOLUTE PATH FIXER');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Get all .mdc files recursively
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to process`);
      console.log('');

      // Fix each file
      for (const filePath of mdcFiles) {
        await this.fixFile(filePath);
      }

      console.log('');
      console.log('✅ ABSOLUTE PATH FIXING COMPLETE');
      console.log(`📄 Files Fixed: ${this.fixed}`);
      console.log(`❌ Errors: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log('');
        console.log('❌ Fixing Errors:');
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('💥 Absolute path fixing failed:', error.message);
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
   * Fix a single file
   */
  async fixFile(filePath) {
    try {
      const relativePath = path.relative(this.baseDir, filePath);
      console.log(`🎯 Fixing: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      let hasChanges = false;
      let changesCount = 0;

      // Get current directory relative to .cursor/rules
      const currentDir = path.dirname(relativePath);
      const dirLevels = currentDir === '.' ? 0 : currentDir.split('/').length;

      // Fix patterns in order of complexity
      const fixPatterns = [
        // 1. Fix links with .cursor/rules/ prefix
        {
          pattern: /\[([^\]]+)\]\(agents\/_store\/projects\/_core\/rules\/([^)]+)\)/g,
          fix: (match, text, targetPath) => {
            const relativePath = this.calculateRelativePath(dirLevels, targetPath);
            return `[${text}](${relativePath})`;
          },
          description: 'Fixed absolute path links'
        },
        
        // 2. Fix standalone .cursor/rules/ references 
        {
          pattern: /(?<![\[\(])agents\/_store\/projects\/_core\/rules\/([^\s\)\]\,\;]+)/g,
          fix: (match, targetPath) => {
            const relativePath = this.calculateRelativePath(dirLevels, targetPath);
            return relativePath;
          },
          description: 'Fixed standalone absolute paths'
        },

        // 3. Fix backtick-wrapped paths
        {
          pattern: /`agents\/_store\/projects\/_core\/rules\/([^`]+)`/g,
          fix: (match, targetPath) => {
            const relativePath = this.calculateRelativePath(dirLevels, targetPath);
            return `\`${relativePath}\``;
          },
          description: 'Fixed backtick-wrapped paths'
        },

        // 4. Fix table cell references
        {
          pattern: /\|\s*agents\/_store\/projects\/_core\/rules\/([^\s\|]+)\s*\|/g,
          fix: (match, targetPath) => {
            const relativePath = this.calculateRelativePath(dirLevels, targetPath);
            return `| ${relativePath} |`;
          },
          description: 'Fixed table cell paths'
        },

        // 5. Fix markdown references in parentheses
        {
          pattern: /\(agents\/_store\/projects\/_core\/rules\/([^)]+)\)/g,
          fix: (match, targetPath) => {
            const relativePath = this.calculateRelativePath(dirLevels, targetPath);
            return `(${relativePath})`;
          },
          description: 'Fixed parenthetical references'
        }
      ];

      // Apply each fix pattern
      for (const fixPattern of fixPatterns) {
        const beforeFix = content;
        content = content.replace(fixPattern.pattern, fixPattern.fix);
        if (content !== beforeFix) {
          hasChanges = true;
          changesCount++;
          console.log(`  ✅ ${fixPattern.description}`);
        }
      }

      // Save if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Fixed ${relativePath} (${changesCount} pattern types)`);
        this.fixed++;
      } else {
        console.log(`  ⚪ No absolute paths found in ${relativePath}`);
      }

    } catch (error) {
      const errorMsg = `Failed to fix ${filePath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Calculate relative path from current directory to target
   */
  calculateRelativePath(dirLevels, targetPath) {
    if (dirLevels === 0) {
      // We're at root level (.cursor/rules), so just return the target path
      return targetPath;
    }
    
    // We need to go up 'dirLevels' directories, then follow the target path
    const upLevels = '../'.repeat(dirLevels);
    return upLevels + targetPath;
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new AbsolutePathFixer();
  fixer.execute().catch(error => {
    console.error('💥 Absolute path fixing error:', error.message);
    process.exit(1);
  });
}

module.exports = AbsolutePathFixer; 
#!/usr/bin/env node

/**
 * 🔧 Manual Link Fixer
 * 
 * Fixes specific broken link patterns that the automated script missed
 * Targets malformed markdown links and reference patterns
 */

const fs = require('fs').promises;
const path = require('path');

class ManualLinkFixer {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.fixed = 0;
    this.errors = [];
  }

  /**
   * Main fixing function
   */
  async fixAllLinks() {
    console.log('🔧 MANUAL LINK FIXER');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Get all .mdc files recursively
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to fix`);
      console.log('');

      // Fix each file
      for (const filePath of mdcFiles) {
        await this.fixFile(filePath);
      }

      console.log('');
      console.log('✅ MANUAL LINK FIXING COMPLETE');
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
      console.error('💥 Manual link fixing failed:', error.message);
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
      console.log(`🔧 Fixing: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      let hasChanges = false;
      let changesCount = 0;
      const currentDir = path.dirname(relativePath);

      // 1. Fix double parentheses link patterns like (file.mdc)(file.mdc)
      const doubleParenPattern = /\(([^)]+\.mdc)\)\(([^)]+\.mdc)\)/g;
      if (doubleParenPattern.test(content)) {
        content = content.replace(doubleParenPattern, '[$1]($1)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed double parentheses patterns`);
      }

      // 2. Fix numbered reference patterns embedded in links [number](file)
      const numberedLinkPattern = /\[(\d+)\]\(([^)]+)\)/g;
      if (numberedLinkPattern.test(content)) {
        content = content.replace(numberedLinkPattern, '[$2]($2)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔢 Fixed numbered link patterns`);
      }

      // 3. Fix bare parentheses without proper link syntax
      const bareParenPattern = /\(([^)]+\.mdc)\)(?!\(|\])/g;
      if (bareParenPattern.test(content)) {
        content = content.replace(bareParenPattern, '[$1]($1)');
        hasChanges = true;
        changesCount++;
        console.log(`  📎 Fixed bare parentheses patterns`);
      }

      // 4. Fix malformed reference links like [project_session_state.json](number)
      const malformedRefPattern = /\[([^\]]+\.(json|mdc))\]\((\d+)\)/g;
      if (malformedRefPattern.test(content)) {
        content = content.replace(malformedRefPattern, '$1');
        hasChanges = true;
        changesCount++;
        console.log(`  🗂️ Fixed malformed reference patterns`);
      }

      // 5. Fix specific path patterns based on current directory
      const pathFixes = this.getPathFixes(currentDir);
      for (const [pattern, replacement] of pathFixes) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          hasChanges = true;
          changesCount++;
        }
      }

      // 6. Fix remaining number-only links and references
      const numberOnlyPattern = /\[(\d+)\]/g;
      if (numberOnlyPattern.test(content)) {
        content = content.replace(numberOnlyPattern, '');
        hasChanges = true;
        changesCount++;
        console.log(`  🔢 Removed remaining number-only references`);
      }

      // 7. Clean up broken task/file references
      const brokenTaskRefs = [
        { pattern: /\[`tasks\/`\]\(\d+\)/g, replacement: '`tasks/`' },
        { pattern: /\[tasks\.json\]\(\d+\)/g, replacement: '[tasks.json](../tasks/tasks.json)' },
        { pattern: /\[project_session_state\.json\]\(\d+\)/g, replacement: 'project_session_state.json' }
      ];

      for (const { pattern, replacement } of brokenTaskRefs) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          hasChanges = true;
          changesCount++;
        }
      }

      // 8. Fix common file reference patterns
      const commonFilePatterns = [
        // Fix paths with .. but wrong structure
        { pattern: /\(\.\.\//g, replacement: '(' },
        // Fix project_session_state.json references
        { pattern: /\[project_session_state\.json\]\([^)]*\)/g, replacement: 'project_session_state.json' },
        // Fix malformed markdown table links
        { pattern: /\| \[([^\]]+)\]\([^)]*\) \|/g, replacement: '| $1 |' }
      ];

      for (const { pattern, replacement } of commonFilePatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          hasChanges = true;
          changesCount++;
        }
      }

      // Save if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Fixed ${relativePath} (${changesCount} fixes)`);
        this.fixed++;
      } else {
        console.log(`  ⚪ No fixes needed for ${relativePath}`);
      }

    } catch (error) {
      const errorMsg = `Failed to fix ${filePath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Get path fixes based on current directory
   */
  getPathFixes(currentDir) {
    const fixes = [];

    // For files in 01__AI-RUN directory
    if (currentDir.includes('01__AI-RUN')) {
      fixes.push(
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./projet/', '[$1](../projet/'],
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./02__AI-DOCS/', '[$1](../02__AI-DOCS/'],
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./03__SPECS/', '[$1](../03__SPECS/']
      );
    }

    // For files in 02__AI-DOCS directory
    if (currentDir.includes('02__AI-DOCS')) {
      fixes.push(
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./01__AI-RUN/', '[$1](../01__AI-RUN/'],
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./03__SPECS/', '[$1](../03__SPECS/']
      );
    }

    // For files in 03__SPECS directory
    if (currentDir.includes('03__SPECS')) {
      fixes.push(
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./01__AI-RUN/', '[$1](../01__AI-RUN/'],
        ['\\[([^\\]]+\\.mdc)\\]\\(\\.\\./02__AI-DOCS/', '[$1](../02__AI-DOCS/']
      );
    }

    return fixes;
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new ManualLinkFixer();
  fixer.fixAllLinks().catch(error => {
    console.error('💥 Manual link fixing error:', error.message);
    process.exit(1);
  });
}

module.exports = ManualLinkFixer; 
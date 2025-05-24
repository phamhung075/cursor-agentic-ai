#!/usr/bin/env node

/**
 * 🔧 Final Link Repair Script
 * 
 * Fixes the remaining complex malformed link patterns
 * Specifically targets nested bracket patterns and redundant links
 */

const fs = require('fs').promises;
const path = require('path');

class FinalLinkRepair {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.repaired = 0;
    this.errors = [];
  }

  /**
   * Main repair function
   */
  async repairAllLinks() {
    console.log('🔧 FINAL LINK REPAIR');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Get all .mdc files recursively
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to repair`);
      console.log('');

      // Repair each file
      for (const filePath of mdcFiles) {
        await this.repairFile(filePath);
      }

      console.log('');
      console.log('✅ FINAL LINK REPAIR COMPLETE');
      console.log(`📄 Files Repaired: ${this.repaired}`);
      console.log(`❌ Errors: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log('');
        console.log('❌ Repair Errors:');
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('💥 Final link repair failed:', error.message);
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
   * Repair a single file
   */
  async repairFile(filePath) {
    try {
      const relativePath = path.relative(this.baseDir, filePath);
      console.log(`🔧 Repairing: ${relativePath}`);

      let content = await fs.readFile(filePath, 'utf8');
      let hasChanges = false;
      let changesCount = 0;

      // 1. Fix complex nested patterns like [text][text](file)
      const nestedLinkPattern = /\[([^\]]+)\]\[([^\]]+)\]\(([^)]+)\)/g;
      if (nestedLinkPattern.test(content)) {
        content = content.replace(nestedLinkPattern, '[$1]($3)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed nested link patterns`);
      }

      // 2. Fix triple nested patterns - simplified approach
      const tripleNestedPattern = /\[([^\[\]]*\[([^\]]+)\][^\[\]]*)\]\(([^)]+)\)/g;
      if (tripleNestedPattern.test(content)) {
        content = content.replace(tripleNestedPattern, '[$2]($2)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed triple nested patterns`);
      }

      // 3. Fix complex patterns - simplified approach
      const complexPattern = /\[([^,]*,\s*\[([^\]]+)\][^\]]*)\]\(([^)]+)\)/g;
      if (complexPattern.test(content)) {
        content = content.replace(complexPattern, '[$2]($2)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed complex nested patterns`);
      }

      // 4. Fix patterns with redundant file references like [filename.mdc][filename.mdc](filename.mdc)
      const redundantPattern = /\[([^\]]+\.mdc)\]\[([^\]]+\.mdc)\]\(([^)]+\.mdc)\)/g;
      if (redundantPattern.test(content)) {
        content = content.replace(redundantPattern, '[$1]($1)');
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed redundant link patterns`);
      }

      // 5. Fix standalone brackets with numbers like [9743], [9865], etc.
      const standaloneNumberPattern = /\[(\d{4,})\]/g;
      if (standaloneNumberPattern.test(content)) {
        content = content.replace(standaloneNumberPattern, '');
        hasChanges = true;
        changesCount++;
        console.log(`  🔢 Removed standalone number references`);
      }

      // 6. Fix broken markdown table entries with malformed links
      const tableEntryPattern = /\|\s*\[([^\]]+)\]\([^)]*\)\s*\|/g;
      if (tableEntryPattern.test(content)) {
        content = content.replace(tableEntryPattern, '| $1 |');
        hasChanges = true;
        changesCount++;
        console.log(`  📊 Fixed table entry links`);
      }

      // 7. Fix remaining complex patterns with parentheses inside parentheses
      const parenInParenPattern = /\[([^\]]+)\]\(([^)]*\([^)]+\)[^)]*)\)/g;
      if (parenInParenPattern.test(content)) {
        content = content.replace(parenInParenPattern, (match, text, path) => {
          // Extract the innermost file reference
          const innerMatch = path.match(/\(([^)]+\.mdc)\)/);
          if (innerMatch) {
            return `[${text}](${innerMatch[1]})`;
          }
          // If no inner .mdc file, just use the text
          return text;
        });
        hasChanges = true;
        changesCount++;
        console.log(`  🔗 Fixed parentheses in parentheses patterns`);
      }

      // 8. Clean up remaining malformed syntax
      const cleanupPatterns = [
        // Remove stray opening brackets
        { pattern: /\s\[\s*$/gm, replacement: '' },
        // Fix double brackets
        { pattern: /\[\[/g, replacement: '[' },
        { pattern: /\]\]/g, replacement: ']' },
        // Remove broken link fragments
        { pattern: /\(([^)]*)\)\(/g, replacement: '($1)' },
        // Fix bare filenames that should be links
        { pattern: /(?<![\[\(])\b([a-zA-Z0-9_]+\.mdc)\b(?![\]\)])/g, replacement: '[$1]($1)' }
      ];

      for (const { pattern, replacement } of cleanupPatterns) {
        const beforeCleanup = content;
        content = content.replace(pattern, replacement);
        if (content !== beforeCleanup) {
          hasChanges = true;
          changesCount++;
        }
      }

      // 9. Fix specific project path issues
      const projectPathFixes = [
        // Fix ../projet/ paths to relative paths based on location
        { pattern: /\[([^\]]+)\]\(\.\.\//g, replacement: '[$1](' },
        // Fix malformed tasks.json references
        { pattern: /tasks\.json\s*\([^)]*\)/g, replacement: 'tasks.json' },
        // Fix project_session_state.json references
        { pattern: /project_session_state\.json\s*\([^)]*\)/g, replacement: 'project_session_state.json' }
      ];

      for (const { pattern, replacement } of projectPathFixes) {
        const beforeFix = content;
        content = content.replace(pattern, replacement);
        if (content !== beforeFix) {
          hasChanges = true;
          changesCount++;
        }
      }

      // Save if changes were made
      if (hasChanges) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ Repaired ${relativePath} (${changesCount} fixes)`);
        this.repaired++;
      } else {
        console.log(`  ⚪ No repairs needed for ${relativePath}`);
      }

    } catch (error) {
      const errorMsg = `Failed to repair ${filePath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }
}

// CLI execution
if (require.main === module) {
  const repairer = new FinalLinkRepair();
  repairer.repairAllLinks().catch(error => {
    console.error('💥 Final link repair error:', error.message);
    process.exit(1);
  });
}

module.exports = FinalLinkRepair; 
#!/usr/bin/env node

/**
 * 🔧 Enhanced MDC Path Fixer
 * 
 * Comprehensive script to fix paths in .mdc files while preserving URLs
 * Specifically skips all https:// and http:// URLs
 */

const fs = require('fs').promises;
const path = require('path');

class EnhancedMDCPathFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      filesProcessed: 0,
      filesFixed: 0,
      totalFixes: 0,
      urlsSkipped: 0,
      pathsFixed: 0,
      brokenLinksFixed: 0,
      mdcLinksFixed: 0,
      errors: []
    };
    this.validFiles = new Map();
    this.backupDir = `backups/mdc-path-fix-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  }

  /**
   * Main execution function
   */
  async fix(targetPath = null, dryRun = false) {
    console.log('🔧 ENHANCED MDC PATH FIXER');
    console.log('━'.repeat(60));
    console.log('🌐 PRESERVING all https:// and http:// URLs');
    console.log('🔗 FIXING broken paths and malformed links');
    console.log('');

    try {
      // Scan project for valid files
      await this.scanProjectFiles();

      // Create backup if not dry run
      if (!dryRun) {
        await this.createBackup();
      }

      // Get target files
      const mdcFiles = targetPath ? [targetPath] : await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc file(s) to process`);
      console.log('');

      // Process each file
      for (const filePath of mdcFiles) {
        await this.processFile(filePath, dryRun);
      }

      // Generate report
      this.generateReport(dryRun);

      return this.results;

    } catch (error) {
      console.error('❌ Processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Scan project for all valid files to build reference map
   */
  async scanProjectFiles() {
    console.log('🔍 Scanning project files...');

    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && this.isRelevantFile(entry.name)) {
            const relativePath = path.relative(this.projectRoot, fullPath);
            this.validFiles.set(entry.name, relativePath);
            this.validFiles.set(relativePath, relativePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDirectory(this.projectRoot);
    console.log(`  ✅ Found ${this.validFiles.size} valid files`);
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules', '.git', '__pycache__', '.vscode', 
      'dist', 'build', 'cache', 'temp', '.cursor'
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Check if file is relevant for path resolution
   */
  isRelevantFile(fileName) {
    const extensions = ['.mdc', '.md', '.json', '.js', '.ts', '.txt'];
    return extensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get all .mdc files in the project
   */
  async getAllMdcFiles() {
    const files = [];
    
    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Create backup of files before modification
   */
  async createBackup() {
    console.log('💾 Creating backup...');
    
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`  ✅ Backup directory: ${this.backupDir}`);
    } catch (error) {
      console.warn(`  ⚠️ Could not create backup: ${error.message}`);
    }
  }

  /**
   * Process a single .mdc file
   */
  async processFile(filePath, dryRun) {
    const relativePath = path.relative(this.projectRoot, filePath);
    console.log(`📝 Processing: ${relativePath}`);

    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      let fileFixed = false;
      let fileFixes = 0;

      // Backup original file if not dry run
      if (!dryRun) {
        const backupPath = path.join(this.backupDir, relativePath);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, originalContent, 'utf8');
      }

      // 1. Fix mdc: prefixed links
      const mdcFixes = this.fixMdcPrefixedLinks(content);
      content = mdcFixes.content;
      fileFixes += mdcFixes.fixes;
      this.results.mdcLinksFixed += mdcFixes.fixes;

      // 2. Fix broken markdown links
      const brokenFixes = this.fixBrokenMarkdownLinks(content);
      content = brokenFixes.content;
      fileFixes += brokenFixes.fixes;
      this.results.brokenLinksFixed += brokenFixes.fixes;

      // 3. Fix and validate paths (while preserving URLs)
      const pathFixes = await this.fixAndValidatePaths(content, filePath);
      content = pathFixes.content;
      fileFixes += pathFixes.fixes;
      this.results.pathsFixed += pathFixes.fixes;
      this.results.urlsSkipped += pathFixes.urlsSkipped;

      // 4. Clean redundant patterns
      const cleanFixes = this.cleanRedundantPatterns(content);
      content = cleanFixes.content;
      fileFixes += cleanFixes.fixes;

      // Save if changes were made
      if (content !== originalContent) {
        if (!dryRun) {
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`  ✅ Fixed ${fileFixes} issues and saved`);
        } else {
          console.log(`  🔍 Would fix ${fileFixes} issues`);
        }
        fileFixed = true;
        this.results.filesFixed++;
      } else {
        console.log(`  ✅ No issues found`);
      }

      this.results.filesProcessed++;
      this.results.totalFixes += fileFixes;

    } catch (error) {
      console.error(`  ❌ Error processing ${relativePath}: ${error.message}`);
      this.results.errors.push({ file: relativePath, error: error.message });
    }
  }

  /**
   * Fix mdc: prefixed links
   */
  fixMdcPrefixedLinks(content) {
    let fixes = 0;
    let fixedContent = content;

    // Pattern 1: [text](mdc:path) -> [text](path)
    fixedContent = fixedContent.replace(/\[([^\]]+)\]\(mdc:([^)]+)\)/g, (match, text, mdcPath) => {
      fixes++;
      console.log(`    🔧 Fixed mdc link: ${match} → [${text}](${mdcPath})`);
      return `[${text}](${mdcPath})`;
    });

    // Pattern 2: Standalone mdc:path patterns
    fixedContent = fixedContent.replace(/(?<!\[)mdc:([^\s\)\]\,\;]+)/g, (match, mdcPath) => {
      const filename = path.basename(mdcPath, '.mdc');
      const linkText = filename.replace(/_/g, ' ');
      fixes++;
      console.log(`    🔧 Fixed standalone mdc: ${match} → [${linkText}](${mdcPath})`);
      return `[${linkText}](${mdcPath})`;
    });

    return { content: fixedContent, fixes };
  }

  /**
   * Fix broken markdown links
   */
  fixBrokenMarkdownLinks(content) {
    let fixes = 0;
    let fixedContent = content;

    // Fix empty links
    fixedContent = fixedContent.replace(/\[([^\]]+)\]\(\s*\)/g, (match, linkText) => {
      fixes++;
      console.log(`    🔗 Fixed empty link: ${match} → ${linkText}`);
      return linkText;
    });

    // Fix malformed .mdcc patterns
    fixedContent = fixedContent.replace(/(\w+)\.mdcc\)/g, (match, filename) => {
      fixes++;
      console.log(`    🔗 Fixed .mdcc pattern: ${match} → [${filename}](${filename}.mdc)`);
      return `[${filename}](${filename}.mdc)`;
    });

    // Fix numbered references
    fixedContent = fixedContent.replace(/\]\([0-9]+\)/g, (match) => {
      fixes++;
      console.log(`    🔗 Fixed numbered ref: ${match} → ]`);
      return ']';
    });

    // Fix standalone number brackets
    fixedContent = fixedContent.replace(/\[[0-9]+\]/g, (match) => {
      fixes++;
      console.log(`    🔗 Fixed number bracket: ${match} → (removed)`);
      return '';
    });

    return { content: fixedContent, fixes };
  }

  /**
   * Fix and validate paths while preserving URLs
   */
  async fixAndValidatePaths(content, filePath) {
    let fixes = 0;
    let urlsSkipped = 0;
    let fixedContent = content;

    // Find all markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      links.push({
        fullMatch: match[0],
        text: match[1],
        path: match[2],
        index: match.index
      });
    }

    // Process each link
    for (const link of links) {
      const { fullMatch, text, path: linkPath } = link;

      // SKIP ALL URLs - this is the key requirement
      if (this.isUrl(linkPath)) {
        urlsSkipped++;
        console.log(`    🌐 Skipped URL: ${linkPath}`);
        continue;
      }

      // Skip anchors and special protocols
      if (linkPath.startsWith('#') || linkPath.startsWith('mailto:') || linkPath.startsWith('tel:')) {
        continue;
      }

      // Try to fix the path
      const fixedPath = await this.resolvePath(linkPath, filePath);
      if (fixedPath && fixedPath !== linkPath) {
        const newLink = `[${text}](${fixedPath})`;
        fixedContent = fixedContent.replace(fullMatch, newLink);
        fixes++;
        console.log(`    🔧 Fixed path: ${linkPath} → ${fixedPath}`);
      }
    }

    return { content: fixedContent, fixes, urlsSkipped };
  }

  /**
   * Check if a path is a URL (http:// or https://)
   */
  isUrl(path) {
    return path.startsWith('http://') || path.startsWith('https://');
  }

  /**
   * Resolve a path to a valid file reference
   */
  async resolvePath(linkPath, currentFile) {
    // Remove any mdc: prefix if still present
    const cleanPath = linkPath.replace(/^mdc:/, '');
    
    // If it's already a valid relative path from project root, check if it exists
    const fullPath = path.resolve(this.projectRoot, cleanPath);
    try {
      await fs.access(fullPath);
      return cleanPath; // Path is valid as-is
    } catch {
      // Path doesn't exist, try to resolve it
    }

    // Try to find the file by name
    const fileName = path.basename(cleanPath);
    if (this.validFiles.has(fileName)) {
      const validPath = this.validFiles.get(fileName);
      // Calculate relative path from current file to target
      const currentDir = path.dirname(currentFile);
      const relativePath = path.relative(currentDir, path.resolve(this.projectRoot, validPath));
      return relativePath.replace(/\\/g, '/'); // Normalize slashes
    }

    // If we can't resolve it, return null (no fix)
    return null;
  }

  /**
   * Clean redundant patterns
   */
  cleanRedundantPatterns(content) {
    let fixes = 0;
    let fixedContent = content;

    // Fix /./ patterns
    const beforeDotSlash = fixedContent;
    fixedContent = fixedContent.replace(/\/\.\//g, '/');
    if (fixedContent !== beforeDotSlash) {
      fixes++;
      console.log(`    🧹 Cleaned /./ patterns`);
    }

    // Fix multiple slashes (but not in URLs)
    const beforeSlashes = fixedContent;
    fixedContent = fixedContent.replace(/(?<!https?:)\/\/+/g, '/');
    if (fixedContent !== beforeSlashes) {
      fixes++;
      console.log(`    🧹 Cleaned multiple slashes`);
    }

    return { content: fixedContent, fixes };
  }

  /**
   * Generate processing report
   */
  generateReport(dryRun) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Files processed: ${this.results.filesProcessed}`);
    console.log(`Files fixed: ${this.results.filesFixed}`);
    console.log(`Total fixes applied: ${this.results.totalFixes}`);
    console.log(`URLs preserved: ${this.results.urlsSkipped}`);
    console.log(`Paths fixed: ${this.results.pathsFixed}`);
    console.log(`Broken links fixed: ${this.results.brokenLinksFixed}`);
    console.log(`MDC links fixed: ${this.results.mdcLinksFixed}`);
    
    if (this.results.errors.length > 0) {
      console.log(`Errors: ${this.results.errors.length}`);
      this.results.errors.forEach(error => {
        console.log(`  ❌ ${error.file}: ${error.error}`);
      });
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No files were modified');
      console.log('Run with --fix to apply changes');
    } else if (this.results.filesFixed > 0) {
      console.log(`\n💾 Backup created: ${this.backupDir}`);
    }

    console.log('\n🌐 All https:// and http:// URLs were preserved');
  }

  /**
   * Show current status of .mdc files
   */
  static async showStatus() {
    console.log('📊 MDC FILES STATUS');
    console.log('━'.repeat(40));

    const fixer = new EnhancedMDCPathFixer();
    await fixer.scanProjectFiles();
    
    const mdcFiles = await fixer.getAllMdcFiles();
    console.log(`\n📄 Found ${mdcFiles.length} .mdc files`);
    
    let totalLinks = 0;
    let totalUrls = 0;
    let potentialIssues = 0;

    for (const filePath of mdcFiles.slice(0, 10)) { // Sample first 10 files
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        
        while ((match = linkPattern.exec(content)) !== null) {
          totalLinks++;
          const linkPath = match[2];
          
          if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
            totalUrls++;
          } else if (linkPath.includes('mdc:') || linkPath.includes('.mdcc') || !linkPath.trim()) {
            potentialIssues++;
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    console.log(`\n🔗 Link Analysis (sample):`);
    console.log(`   Total links: ${totalLinks}`);
    console.log(`   URLs (preserved): ${totalUrls}`);
    console.log(`   Potential issues: ${potentialIssues}`);
    
    if (potentialIssues > 0) {
      console.log('\n💡 Run with --fix to resolve issues while preserving URLs');
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command.toLowerCase()) {
    case 'fix':
      const targetFile = args.find(arg => !arg.startsWith('--') && arg !== 'fix');
      const dryRun = !args.includes('--apply');
      
      const fixer = new EnhancedMDCPathFixer();
      fixer.fix(targetFile, dryRun)
        .then(() => {
          if (dryRun) {
            console.log('\n💡 Add --apply to actually fix the files');
          }
        })
        .catch(error => {
          console.error('❌ Fix failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'status':
      EnhancedMDCPathFixer.showStatus();
      break;
      
    default:
      console.log('🔧 Enhanced MDC Path Fixer');
      console.log('');
      console.log('USAGE:');
      console.log('  node enhanced-mdc-path-fixer.js status           # Show current status');
      console.log('  node enhanced-mdc-path-fixer.js fix              # Dry run (preview changes)');
      console.log('  node enhanced-mdc-path-fixer.js fix --apply      # Apply fixes');
      console.log('  node enhanced-mdc-path-fixer.js fix file.mdc     # Fix specific file');
      console.log('');
      console.log('FEATURES:');
      console.log('  ✅ Preserves all https:// and http:// URLs');
      console.log('  ✅ Fixes broken markdown links');
      console.log('  ✅ Resolves mdc: prefixed paths');
      console.log('  ✅ Validates and corrects file paths');
      console.log('  ✅ Creates backup before changes');
  }
}

module.exports = EnhancedMDCPathFixer; 
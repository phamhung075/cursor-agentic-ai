#!/usr/bin/env node

/**
 * 🔍 Core Path Analyzer
 * 
 * Comprehensive analyzer to detect corrupt, obsolete, and broken path patterns
 * in agents/_store/projects/_core content after migration
 * EXCLUDES backup folders entirely
 * FIXED: Now properly fixes broken links that were malformed by previous scripts
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathAnalyzer {
  constructor() {
    this.coreDir = 'agents/_store/projects/_core';
    this.rulesDir = path.join(this.coreDir, 'rules');
    this.excludedDirs = [
      'backups',
      'node_modules',
      '.git',
      'corrupted-backup',
      'backup-',
      'enhanced-backups',
      'comprehensive-backup',
      'pre-improved-fix-backup'
    ];
    this.results = {
      totalFiles: 0,
      corruptPaths: [],
      obsoletePaths: [],
      brokenLinks: [],
      selfReferences: [],
      missingFiles: [],
      fixedLinks: []
    };
    
    // Pattern definitions for detection
    this.patterns = {
      // Obsolete .cursor patterns that should have been migrated
      obsoleteCursor: [
        /\.cursor\/rules\/[^\s\)\]\,\;]+/g,
        /\[([^\]]+)\]\(\.cursor\/rules\/([^)]+)\)/g,
        /`\.cursor\/rules\/([^`]+)`/g
      ],
      
      // Broken absolute paths - UPDATED: Skip intentional full rule paths
      brokenAbsolute: [
        // Skip these patterns as they are intentional
        // /agents\/_store\/projects\/_core\/rules\/[^\s\)\]\,\;]+/g,
        // /\[([^\]]+)\]\(agents\/_store\/projects\/_core\/rules\/([^)]+)\)/g
      ],
      
      // Self-referential patterns
      selfReference: [
        /\[([^\]]*?)\]\([^)]*?{filename}\)/g,
        /\[{filename}\]/g,
        /\[[^\]]*\]\(\s*\)/g
      ],
      
      // Broken markdown link formats
      brokenLinks: [
        /\[([^\]]+)\]\(\s*\)/g,
        /\]\([0-9]+\)/g,
        /\[[0-9]+\]/g,
        /\[filename\.mdc\]/g,
        /\[t\.mdc\]/g
      ],
      
      // Redundant path patterns
      redundantPaths: [
        /\/\.\//g,
        /\/\/+/g,
        /([^\/])\/\/+/g
      ]
    };
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(dirName) {
    return this.excludedDirs.some(excluded => 
      dirName.includes(excluded) || dirName.startsWith(excluded)
    );
  }

  /**
   * Fix broken links that were malformed by previous scripts
   */
  fixBrokenLinks(content, filePath) {
    let fixes = 0;
    let fixedContent = content;

    // Pattern 1: Fix "filename.mdcc)" -> "[filename](filename.mdc)"
    fixedContent = fixedContent.replace(/(\w+)\.mdcc\)/g, (match, filename) => {
      fixes++;
      console.log(`    🔧 Fixed broken link: ${match} → [${filename}](${filename}.mdc)`);
      return `[${filename}](${filename}.mdc)`;
    });

    // Pattern 2: Fix "01_AutoPilot.mdcc)" -> "[01 AutoPilot](01_AutoPilot.mdc)"
    fixedContent = fixedContent.replace(/([0-9]+_[A-Za-z_]+)\.mdcc\)/g, (match, filename) => {
      const linkText = filename.replace(/_/g, ' ');
      fixes++;
      console.log(`    🔧 Fixed broken link: ${match} → [${linkText}](${filename}.mdc)`);
      return `[${linkText}](${filename}.mdc)`;
    });

    // Pattern 3: Fix standalone "filename.mdcc)" patterns
    fixedContent = fixedContent.replace(/\b([A-Za-z0-9_]+)\.mdcc\)/g, (match, filename) => {
      const linkText = filename.replace(/_/g, ' ');
      fixes++;
      console.log(`    🔧 Fixed broken link: ${match} → [${linkText}](${filename}.mdc)`);
      return `[${linkText}](${filename}.mdc)`;
    });

    // Pattern 4: Fix malformed paths with "c)" endings
    fixedContent = fixedContent.replace(/([A-Za-z0-9_\/\-]+)c\)/g, (match, pathPart) => {
      if (pathPart.includes('/') || pathPart.includes('_')) {
        const correctedPath = pathPart + '.mdc';
        const linkText = path.basename(pathPart).replace(/_/g, ' ');
        fixes++;
        console.log(`    🔧 Fixed malformed path: ${match} → [${linkText}](${correctedPath})`);
        return `[${linkText}](${correctedPath})`;
      }
      return match;
    });

    return { content: fixedContent, fixes };
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalContent = content;
      const relativePath = path.relative(this.coreDir, filePath);
      
      console.log(`🔍 Analyzing: ${relativePath}`);
      
      this.results.totalFiles++;
      let fileIssues = 0;
      let fileFixed = false;

      // First, try to fix broken links
      const linkFixes = this.fixBrokenLinks(content, filePath);
      content = linkFixes.content;
      if (linkFixes.fixes > 0) {
        this.results.fixedLinks.push({
          file: relativePath,
          fixes: linkFixes.fixes
        });
        fileFixed = true;
      }

      // Skip absolute path check for full rule paths (they are intentional)
      console.log('  ✅ Skipping absolute path check - full rule paths are intentional');

      // Check for obsolete .cursor/ paths
      const cursorMatches = content.match(/\.cursor\/rules\/[^\s\)\]\,\;]+/g);
      if (cursorMatches) {
        cursorMatches.forEach(match => {
          this.results.obsoletePaths.push({
            file: relativePath,
            pattern: match,
            type: 'obsolete_cursor_path'
          });
          fileIssues++;
        });
        console.log(`  🗂️ Found ${cursorMatches.length} obsolete .cursor paths`);
      }

      // Check for corrupt path patterns (redundant elements)
      const redundantPatterns = [
        /agents\/_store\/projects\/_core\/agents\/_store/g,
        /rules\/rules\//g,
        /\.mdc\/\.mdc/g,
        /\/\.\//g,
        /\/\//g
      ];

      redundantPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.results.corruptPaths.push({
              file: relativePath,
              pattern: match,
              type: 'redundant_path_element'
            });
            fileIssues++;
          });
          console.log(`  🧹 Found ${matches.length} redundant path patterns`);
        }
      });

      // Check for broken markdown links
      const brokenLinkPattern = /\[([^\]]+)\]\(([^)]*$)/gm;
      const brokenMatches = [...content.matchAll(brokenLinkPattern)];
      brokenMatches.forEach(match => {
        this.results.brokenLinks.push({
          file: relativePath,
          line: this.getLineNumber(content, match.index),
          pattern: match[0],
          linkText: match[1],
          incompletePath: match[2]
        });
        fileIssues++;
        console.log(`  🔗 Found broken link: ${match[0]}`);
      });

      // Check for self-references
      const fileName = path.basename(filePath);
      const selfRefPattern = new RegExp(`\\[([^\\]]+)\\]\\([^)]*${fileName.replace('.', '\\.')}\\)`, 'g');
      const selfMatches = [...content.matchAll(selfRefPattern)];
      if (selfMatches.length > 0) {
        selfMatches.forEach(match => {
          this.results.selfReferences.push({
            file: relativePath,
            line: this.getLineNumber(content, match.index),
            pattern: match[0]
          });
          fileIssues++;
        });
        console.log(`  🔄 Found ${selfMatches.length} self-references`);
      }

      // Check for missing file references
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const linkMatches = [...content.matchAll(linkPattern)];
      
      for (const match of linkMatches) {
        const [fullMatch, linkText, linkPath] = match;
        
        // Skip external links
        if (linkPath.startsWith('http') || linkPath.startsWith('mailto:')) continue;
        
        // Resolve path relative to current file
        let resolvedPath;
        if (linkPath.startsWith('agents/_store/projects/_core/')) {
          resolvedPath = linkPath;
        } else if (path.isAbsolute(linkPath)) {
          resolvedPath = linkPath;
        } else {
          const currentDir = path.dirname(filePath);
          resolvedPath = path.resolve(currentDir, linkPath);
        }
        
        // Check if file exists
        try {
          await fs.access(resolvedPath);
        } catch {
          this.results.missingFiles.push({
            file: relativePath,
            line: this.getLineNumber(content, match.index),
            pattern: `Missing \`${fullMatch}\``
          });
          fileIssues++;
          console.log(`  📁 Missing file reference: ${fullMatch}`);
        }
      }

      // Save fixed content if changes were made
      if (fileFixed && content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`  ✅ Fixed and saved: ${relativePath}`);
      }

      if (fileIssues === 0 && !fileFixed) {
        console.log(`  ✅ No issues found`);
      }

    } catch (error) {
      console.error(`  ❌ Error analyzing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get line number for a character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Scan directory recursively
   */
  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (this.shouldSkipDirectory(entry.name)) {
            console.log(`🚫 Skipping directory: ${entry.name}`);
            continue;
          }
          await this.scanDirectory(path.join(dirPath, entry.name));
        } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
          await this.analyzeFile(path.join(dirPath, entry.name));
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Generate analysis report
   */
  async generateReport() {
    const totalIssues = this.results.corruptPaths.length + 
                       this.results.obsoletePaths.length + 
                       this.results.brokenLinks.length + 
                       this.results.selfReferences.length + 
                       this.results.missingFiles.length;

    const criticalIssues = this.results.obsoletePaths.length + this.results.missingFiles.length;
    const mediumIssues = this.results.selfReferences.length + this.results.brokenLinks.length;
    const lowIssues = this.results.corruptPaths.length;

    console.log('');
    console.log('📊 ANALYSIS RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Analyzed: ${this.results.totalFiles}`);
    console.log(`🚨 Total Issues: ${totalIssues}`);
    console.log(`  🔴 Critical: ${criticalIssues}`);
    console.log(`  🟡 Medium: ${mediumIssues}`);
    console.log(`  🟢 Low: ${lowIssues}`);
    console.log('');
    console.log('📋 ISSUE BREAKDOWN:');
    console.log(`  🗂️ Obsolete .cursor paths: ${this.results.obsoletePaths.length}`);
    console.log(`  💥 Corrupt paths: ${this.results.corruptPaths.length}`);
    console.log(`  🔗 Broken links: ${this.results.brokenLinks.length}`);
    console.log(`  🔄 Self-references: ${this.results.selfReferences.length}`);
    console.log(`  📁 Missing files: ${this.results.missingFiles.length}`);

    if (this.results.fixedLinks.length > 0) {
      console.log('');
      console.log('✅ FIXES APPLIED:');
      console.log(`  🔧 Files with fixed links: ${this.results.fixedLinks.length}`);
      const totalFixes = this.results.fixedLinks.reduce((sum, item) => sum + item.fixes, 0);
      console.log(`  🔗 Total links fixed: ${totalFixes}`);
    }

    // Save detailed reports
    const logsDir = 'agents/_store/logs';
    await fs.mkdir(logsDir, { recursive: true });

    // JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        totalIssues,
        criticalIssues,
        mediumIssues,
        lowIssues
      },
      details: this.results
    };

    await fs.writeFile(
      path.join(logsDir, 'core_path_analysis.json'),
      JSON.stringify(jsonReport, null, 2)
    );

    // Markdown report
    const mdReport = this.generateMarkdownReport(jsonReport);
    await fs.writeFile(
      path.join(logsDir, 'core_path_analysis_report.md'),
      mdReport
    );

    console.log('');
    console.log(`📝 Detailed report saved: ${path.join(logsDir, 'core_path_analysis.json')}`);
    console.log(`📖 Readable report saved: ${path.join(logsDir, 'core_path_analysis_report.md')}`);
    console.log('');
    console.log('🎯 Analysis complete!');

    if (totalIssues > 0) {
      console.log('');
      console.log('🔧 Run the Core Path Fixer to resolve ' + totalIssues + ' issues');
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(jsonReport) {
    let md = `# 🔍 Core Path Analysis Report\n\n`;
    md += `**Analysis Date:** ${jsonReport.timestamp}\n`;
    md += `**Location:** ${this.coreDir}\n\n`;
    
    md += `## 📊 Summary\n\n`;
    md += `- **Files Analyzed:** ${jsonReport.summary.totalFiles}\n`;
    md += `- **Total Issues:** ${jsonReport.summary.totalIssues}\n`;
    md += `- **Critical Issues:** ${jsonReport.summary.criticalIssues}\n`;
    md += `- **Medium Issues:** ${jsonReport.summary.mediumIssues}\n`;
    md += `- **Low Issues:** ${jsonReport.summary.lowIssues}\n\n`;

    md += `## 🚨 Critical Issues\n\n`;
    
    md += `### Obsolete .cursor Paths (${this.results.obsoletePaths.length})\n`;
    this.results.obsoletePaths.forEach(issue => {
      md += `- **${issue.file}**: \`${issue.pattern}\`\n`;
    });
    md += '\n';

    md += `### Missing Files (${this.results.missingFiles.length})\n`;
    this.results.missingFiles.forEach(issue => {
      md += `- **${issue.file}** (line ${issue.line}): ${issue.pattern}\n`;
    });
    md += '\n';

    md += `## ⚠️ Medium Issues\n\n`;
    
    md += `### Self-References (${this.results.selfReferences.length})\n`;
    this.results.selfReferences.forEach(issue => {
      md += `- **${issue.file}** (line ${issue.line}): \`${issue.pattern}\`\n`;
    });
    md += '\n';

    md += `### Broken Links (${this.results.brokenLinks.length})\n`;
    this.results.brokenLinks.forEach(issue => {
      md += `- **${issue.file}** (line ${issue.line}): \`${issue.pattern}\`\n`;
    });
    md += '\n';

    if (this.results.fixedLinks.length > 0) {
      md += `## ✅ Fixes Applied\n\n`;
      this.results.fixedLinks.forEach(fix => {
        md += `- **${fix.file}**: ${fix.fixes} links fixed\n`;
      });
      md += '\n';
    }

    md += `## 🧹 Recommendations\n\n`;
    md += `1. **Fix Critical Issues First:** Focus on obsolete .cursor paths and missing files\n`;
    md += `2. **Clean Self-References:** Remove or convert to plain text\n`;
    md += `3. **Repair Broken Links:** Fix markdown link syntax\n`;
    md += `4. **Normalize Paths:** Clean up redundant path elements\n\n`;
    
    md += `---\n*Generated by Core Path Analyzer*\n`;
    
    return md;
  }

  /**
   * Run the analysis
   */
  async run() {
    console.log('🔍 CORE PATH ANALYZER');
    console.log('━'.repeat(60));
    console.log(`📁 Analyzing: ${this.coreDir}`);
    console.log('🚫 EXCLUDING backup folders entirely');
    console.log('📂 Only analyzing actual project files');
    console.log('🔧 FIXING broken links automatically');
    console.log('');

    const mdcFiles = [];
    
    // First, collect all .mdc files
    const collectFiles = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await collectFiles(path.join(dir, entry.name));
        } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
          mdcFiles.push(path.join(dir, entry.name));
        }
      }
    };

    await collectFiles(this.coreDir);
    
    const skippedDirs = [];
    const checkSkipped = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && this.shouldSkipDirectory(entry.name)) {
          skippedDirs.push(entry.name);
        }
      }
    };
    await checkSkipped(this.coreDir);

    console.log(`📄 Found ${mdcFiles.length} .mdc files to analyze`);
    if (skippedDirs.length > 0) {
      console.log(`🚫 Skipped directories: ${skippedDirs.join(', ')}`);
    }
    console.log('');

    // Analyze each file
    for (const filePath of mdcFiles) {
      await this.analyzeFile(filePath);
    }

    await this.generateReport();
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new CorePathAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = CorePathAnalyzer; 
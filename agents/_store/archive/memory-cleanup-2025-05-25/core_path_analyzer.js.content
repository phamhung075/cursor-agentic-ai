#!/usr/bin/env node

/**
 * 🔍 Core Path Analyzer
 * 
 * Comprehensive analyzer to detect corrupt, obsolete, and broken path patterns
 * in agents/_store/projects/_core content after migration
 */

const fs = require('fs').promises;
const path = require('path');

class CorePathAnalyzer {
  constructor() {
    this.coreDir = 'agents/_store/projects/_core';
    this.rulesDir = path.join(this.coreDir, 'rules');
    this.results = {
      totalFiles: 0,
      corruptPaths: [],
      obsoletePaths: [],
      brokenLinks: [],
      selfReferences: [],
      missingFiles: [],
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      }
    };
    
    // Pattern definitions for detection
    this.patterns = {
      // Obsolete .cursor patterns that should have been migrated
      obsoleteCursor: [
        /\.cursor\/rules\/[^\s\)\]\,\;]+/g,
        /\[([^\]]+)\]\(\.cursor\/rules\/([^)]+)\)/g,
        /`\.cursor\/rules\/([^`]+)`/g
      ],
      
      // Broken absolute paths
      brokenAbsolute: [
        /agents\/_store\/projects\/_core\/rules\/[^\s\)\]\,\;]+/g,
        /\[([^\]]+)\]\(agents\/_store\/projects\/_core\/rules\/([^)]+)\)/g
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
        /\.\.\//g,
        /([^\/])\/\/+/g
      ]
    };
  }

  /**
   * Run comprehensive analysis
   */
  async analyze() {
    console.log('🔍 CORE PATH ANALYZER');
    console.log('━'.repeat(60));
    console.log(`📁 Analyzing: ${this.coreDir}`);
    console.log('');

    try {
      // Get all .mdc files
      const mdcFiles = await this.getAllMdcFiles();
      console.log(`📄 Found ${mdcFiles.length} .mdc files to analyze`);
      console.log('');

      // Analyze each file
      for (const filePath of mdcFiles) {
        await this.analyzeFile(filePath);
      }

      // Generate comprehensive report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
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
        console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
      }
    };

    await scanDirectory(this.coreDir);
    return files;
  }

  /**
   * Analyze a single file for path issues
   */
  async analyzeFile(filePath) {
    try {
      const relativePath = path.relative(this.coreDir, filePath);
      const filename = path.basename(filePath);
      console.log(`🔍 Analyzing: ${relativePath}`);

      const content = await fs.readFile(filePath, 'utf8');
      this.results.totalFiles++;

      // 1. Check for obsolete .cursor patterns
      await this.checkObsoletePaths(filePath, content, relativePath);
      
      // 2. Check for broken absolute paths
      await this.checkBrokenAbsolute(filePath, content, relativePath);
      
      // 3. Check for self-references
      await this.checkSelfReferences(filePath, content, relativePath, filename);
      
      // 4. Check for broken links
      await this.checkBrokenLinks(filePath, content, relativePath);
      
      // 5. Check for missing referenced files
      await this.checkMissingFiles(filePath, content, relativePath);
      
      // 6. Check for redundant path patterns
      await this.checkRedundantPaths(filePath, content, relativePath);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check for obsolete .cursor path patterns
   */
  async checkObsoletePaths(filePath, content, relativePath) {
    for (const pattern of this.patterns.obsoleteCursor) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.results.obsoletePaths.push({
            file: relativePath,
            pattern: match,
            type: 'obsolete_cursor',
            severity: 'critical',
            line: this.getLineNumber(content, match),
            suggestion: 'Convert to relative path within _core structure'
          });
          this.results.summary.criticalIssues++;
        }
        console.log(`  🚨 Found ${matches.length} obsolete .cursor paths`);
      }
    }
  }

  /**
   * Check for broken absolute paths
   */
  async checkBrokenAbsolute(filePath, content, relativePath) {
    for (const pattern of this.patterns.brokenAbsolute) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.results.corruptPaths.push({
            file: relativePath,
            pattern: match,
            type: 'broken_absolute',
            severity: 'high',
            line: this.getLineNumber(content, match),
            suggestion: 'Convert to proper relative path'
          });
          this.results.summary.criticalIssues++;
        }
        console.log(`  ⚠️ Found ${matches.length} broken absolute paths`);
      }
    }
  }

  /**
   * Check for self-referential links
   */
  async checkSelfReferences(filePath, content, relativePath, filename) {
    // Create patterns with actual filename
    const selfRefPatterns = [
      new RegExp(`\\[([^\\]]*?)\\]\\([^\\)]*?${this.escapeRegex(filename)}\\)`, 'g'),
      new RegExp(`\\[${this.escapeRegex(filename)}\\]`, 'g')
    ];

    for (const pattern of selfRefPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.results.selfReferences.push({
            file: relativePath,
            pattern: match,
            type: 'self_reference',
            severity: 'medium',
            line: this.getLineNumber(content, match),
            suggestion: 'Remove self-referential link or convert to plain text'
          });
          this.results.summary.mediumIssues++;
        }
        console.log(`  🔄 Found ${matches.length} self-references`);
      }
    }
  }

  /**
   * Check for broken markdown links
   */
  async checkBrokenLinks(filePath, content, relativePath) {
    for (const pattern of this.patterns.brokenLinks) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.results.brokenLinks.push({
            file: relativePath,
            pattern: match,
            type: 'broken_link',
            severity: 'medium',
            line: this.getLineNumber(content, match),
            suggestion: 'Fix or remove broken link'
          });
          this.results.summary.mediumIssues++;
        }
        console.log(`  🔗 Found ${matches.length} broken links`);
      }
    }
  }

  /**
   * Check for missing referenced files
   */
  async checkMissingFiles(filePath, content, relativePath) {
    // Extract file references from links
    const linkPattern = /\[([^\]]+)\]\(([^)]+\.mdc)\)/g;
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, referencedFile] = match;
      
      // Calculate absolute path to referenced file
      const currentDir = path.dirname(filePath);
      const referencedPath = path.resolve(currentDir, referencedFile);
      
      try {
        await fs.access(referencedPath);
      } catch (error) {
        this.results.missingFiles.push({
          file: relativePath,
          pattern: fullMatch,
          referencedFile: referencedFile,
          type: 'missing_file',
          severity: 'high',
          line: this.getLineNumber(content, fullMatch),
          suggestion: `Create missing file: ${referencedFile} or fix path`
        });
        this.results.summary.criticalIssues++;
        console.log(`  📁 Missing file reference: ${referencedFile}`);
      }
    }
  }

  /**
   * Check for redundant path patterns
   */
  async checkRedundantPaths(filePath, content, relativePath) {
    for (const pattern of this.patterns.redundantPaths) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.results.corruptPaths.push({
            file: relativePath,
            pattern: match,
            type: 'redundant_path',
            severity: 'low',
            line: this.getLineNumber(content, match),
            suggestion: 'Clean up redundant path elements'
          });
          this.results.summary.lowIssues++;
        }
        console.log(`  🧹 Found ${matches.length} redundant path patterns`);
      }
    }
  }

  /**
   * Get line number of pattern in content
   */
  getLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return null;
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateReport() {
    this.results.summary.totalIssues = 
      this.results.summary.criticalIssues + 
      this.results.summary.mediumIssues + 
      this.results.summary.lowIssues;

    console.log('');
    console.log('📊 ANALYSIS RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Files Analyzed: ${this.results.totalFiles}`);
    console.log(`🚨 Total Issues: ${this.results.summary.totalIssues}`);
    console.log(`  🔴 Critical: ${this.results.summary.criticalIssues}`);
    console.log(`  🟡 Medium: ${this.results.summary.mediumIssues}`);
    console.log(`  🟢 Low: ${this.results.summary.lowIssues}`);
    console.log('');

    // Detailed breakdown
    console.log('📋 ISSUE BREAKDOWN:');
    console.log(`  🗂️ Obsolete .cursor paths: ${this.results.obsoletePaths.length}`);
    console.log(`  💥 Corrupt paths: ${this.results.corruptPaths.length}`);
    console.log(`  🔗 Broken links: ${this.results.brokenLinks.length}`);
    console.log(`  🔄 Self-references: ${this.results.selfReferences.length}`);
    console.log(`  📁 Missing files: ${this.results.missingFiles.length}`);
    console.log('');

    // Save detailed report
    const reportPath = 'agents/_store/logs/core_path_analysis.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📝 Detailed report saved: ${reportPath}`);

    // Save human-readable report
    const readableReport = await this.generateReadableReport();
    const readableReportPath = 'agents/_store/logs/core_path_analysis_report.md';
    await fs.writeFile(readableReportPath, readableReport);
    console.log(`📖 Readable report saved: ${readableReportPath}`);
  }

  /**
   * Generate human-readable report
   */
  async generateReadableReport() {
    return `# 🔍 Core Path Analysis Report

**Analysis Date:** ${new Date().toISOString()}
**Location:** ${this.coreDir}

## 📊 Summary

- **Files Analyzed:** ${this.results.totalFiles}
- **Total Issues:** ${this.results.summary.totalIssues}
- **Critical Issues:** ${this.results.summary.criticalIssues}
- **Medium Issues:** ${this.results.summary.mediumIssues}
- **Low Issues:** ${this.results.summary.lowIssues}

## 🚨 Critical Issues

### Obsolete .cursor Paths (${this.results.obsoletePaths.length})
${this.results.obsoletePaths.map(issue => 
  `- **${issue.file}** (line ${issue.line}): \`${issue.pattern}\``
).join('\n')}

### Missing Files (${this.results.missingFiles.length})
${this.results.missingFiles.map(issue => 
  `- **${issue.file}** (line ${issue.line}): Missing \`${issue.referencedFile}\``
).join('\n')}

## ⚠️ Medium Issues

### Self-References (${this.results.selfReferences.length})
${this.results.selfReferences.map(issue => 
  `- **${issue.file}** (line ${issue.line}): \`${issue.pattern}\``
).join('\n')}

### Broken Links (${this.results.brokenLinks.length})
${this.results.brokenLinks.map(issue => 
  `- **${issue.file}** (line ${issue.line}): \`${issue.pattern}\``
).join('\n')}

## 🧹 Recommendations

1. **Fix Critical Issues First:** Focus on obsolete .cursor paths and missing files
2. **Clean Self-References:** Remove or convert to plain text
3. **Repair Broken Links:** Fix markdown link syntax
4. **Normalize Paths:** Clean up redundant path elements

---
*Generated by Core Path Analyzer*`;
  }
}

// Export for use as module
module.exports = CorePathAnalyzer;

// CLI execution
if (require.main === module) {
  const analyzer = new CorePathAnalyzer();
  analyzer.analyze().then(results => {
    console.log('\n🎯 Analysis complete!');
    if (results.summary.totalIssues > 0) {
      console.log(`\n🔧 Run the Core Path Fixer to resolve ${results.summary.totalIssues} issues`);
      process.exit(1);
    } else {
      console.log('\n✅ No issues found!');
      process.exit(0);
    }
  }).catch(error => {
    console.error('💥 Analysis error:', error.message);
    process.exit(1);
  });
} 
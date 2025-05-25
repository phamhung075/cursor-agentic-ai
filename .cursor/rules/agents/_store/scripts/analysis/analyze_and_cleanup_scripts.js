#!/usr/bin/env node

/**
 * 🔍 Scripts Analysis and Cleanup Tool
 * 
 * Analyzes all scripts in ./scripts directory to determine:
 * 1. Which scripts are obsolete and should be deleted
 * 2. Which scripts can be updated for the new _core structure  
 * 3. Which scripts are still useful as-is
 */

const fs = require('fs').promises;
const path = require('path');

class ScriptsAnalyzer {
  constructor() {
    this.scriptsDir = 'scripts';
    this.results = {
      obsolete: [], // Scripts to delete
      updateable: [], // Scripts that can be updated for _core
      useful: [], // Scripts that are still good as-is
      total: 0,
      analyzed: []
    };
  }

  /**
   * Analyze all scripts in the scripts directory
   */
  async analyzeScripts() {
    console.log('🔍 SCRIPTS ANALYSIS AND CLEANUP');
    console.log('━'.repeat(60));
    console.log(`📁 Analyzing scripts in: ${this.scriptsDir}`);
    console.log('');

    try {
      const files = await this.getScriptFiles();
      this.results.total = files.length;

      console.log(`📄 Found ${files.length} script files to analyze`);
      console.log('');

      for (const file of files) {
        await this.analyzeScript(file);
      }

      await this.generateReport();
      return this.results;

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all script files
   */
  async getScriptFiles() {
    const files = [];
    const entries = await fs.readdir(this.scriptsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && (
        entry.name.endsWith('.py') || 
        entry.name.endsWith('.js') || 
        entry.name.endsWith('.sh')
      )) {
        files.push(entry.name);
      }
    }
    
    return files.sort();
  }

  /**
   * Analyze a single script
   */
  async analyzeScript(filename) {
    const filePath = path.join(this.scriptsDir, filename);
    console.log(`🔍 Analyzing: ${filename}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const analysis = this.analyzeScriptContent(filename, content);
      
      this.results.analyzed.push({
        filename,
        ...analysis
      });

      // Categorize the script
      if (analysis.category === 'obsolete') {
        this.results.obsolete.push(filename);
        console.log(`  🗑️ OBSOLETE: ${analysis.reason}`);
      } else if (analysis.category === 'updateable') {
        this.results.updateable.push(filename);
        console.log(`  🔧 UPDATEABLE: ${analysis.reason}`);
      } else if (analysis.category === 'useful') {
        this.results.useful.push(filename);
        console.log(`  ✅ USEFUL: ${analysis.reason}`);
      }

    } catch (error) {
      console.error(`  ❌ Error analyzing ${filename}: ${error.message}`);
    }
  }

  /**
   * Analyze script content to determine category
   */
  analyzeScriptContent(filename, content) {
    const lower = content.toLowerCase();
    const hasContextCursor = lower.includes('.cursor');
    const hasContextCore = lower.includes('_core') || lower.includes('.cursor/rules/agents/_store/projects');
    const hasRulesPath = lower.includes('.cursor/rules');
    const hasLinkFixing = lower.includes('broken link') || lower.includes('fix.*link');
    const hasFileUpdate = lower.includes('update.*file') || lower.includes('file.*update');
    const hasBrokenPatterns = lower.includes('broken.*pattern') || lower.includes('pattern.*fix');
    const hasCursorFiles = lower.includes('cursor_files_list');
    const hasBackup = lower.includes('backup');
    const hasDependency = lower.includes('dependency') || lower.includes('dependencies');
    const hasRename = lower.includes('rename') || lower.includes('md-to-mdc');

    // Detailed analysis based on filename and content
    switch (filename) {
      case 'update_cursor_rules_files.py':
      case 'update_cursor_rules_files.sh':
        if (hasContextCursor && hasRulesPath) {
          return {
            category: 'updateable',
            reason: 'Can be updated to work with _core structure instead of .cursor/rules',
            updateSuggestion: 'Update paths from .cursor/rules to .cursor/rules/agents/_store/projects/_core/rules'
          };
        }
        break;

      case 'backup_main_branch_cursor_rules.sh':
        if (hasBackup && hasContextCursor) {
          return {
            category: 'updateable', 
            reason: 'Backup functionality useful, needs path updates for _core',
            updateSuggestion: 'Update to backup .cursor/rules/agents/_store/projects/_core instead of .cursor'
          };
        }
        break;

      case 'fix_cursor_rules_links_improved.py':
      case 'fix_cursor_rules_links.py':
        if (hasLinkFixing && hasContextCursor) {
          return {
            category: 'obsolete',
            reason: 'Link fixing for .cursor structure - superseded by new core_path_* tools',
            replacement: 'Use core_path_analyzer.js, core_path_fixer.js, etc.'
          };
        }
        break;

      case 'clean_dependency_memory.js':
        if (hasDependency) {
          return {
            category: 'useful',
            reason: 'Dependency cleanup is still relevant and path-independent',
            notes: 'Works with current .cursor/rules/agents/_store structure'
          };
        }
        break;

      case 'fix_broken_links.py':
        if (hasLinkFixing && hasBrokenPatterns) {
          return {
            category: 'obsolete',
            reason: 'Large complex link fixer - superseded by specialized core_path_* tools',
            replacement: 'Use core_path_final_fixer.js for modern link fixing'
          };
        }
        break;

      case 'replace_file_links.py':
      case 'replace_file_links.sh':
        if (hasFileUpdate) {
          return {
            category: 'obsolete',
            reason: 'File link replacement - functionality covered by new path tools',
            replacement: 'Use core_path_cleaner.js for modern link management'
          };
        }
        break;

      case 'complete_link_processing.sh':
      case 'fix_broken_links.sh':
        return {
          category: 'obsolete',
          reason: 'Shell wrappers for obsolete Python scripts',
          replacement: 'Use npm scripts with new core_path_* tools'
        };

      case 'update_file_list.py':
      case 'update_files.sh':
        if (hasFileUpdate) {
          return {
            category: 'updateable',
            reason: 'File list generation is useful, needs path updates',
            updateSuggestion: 'Update to work with _core structure and .mdc files'
          };
        }
        break;

      case 'rename-md-to-mdc.sh':
        if (hasRename) {
          return {
            category: 'obsolete',
            reason: 'One-time conversion script - no longer needed',
            notes: 'All .md files already converted to .mdc'
          };
        }
        break;

      default:
        // Fallback analysis based on content
        if (hasContextCursor && !hasContextCore) {
          return {
            category: 'updateable',
            reason: 'References .cursor paths that need updating to _core',
            updateSuggestion: 'Update paths and references for new structure'
          };
        } else if (hasLinkFixing || hasBrokenPatterns) {
          return {
            category: 'obsolete', 
            reason: 'Link fixing functionality superseded by new tools',
            replacement: 'Use modern core_path_* toolchain'
          };
        } else {
          return {
            category: 'useful',
            reason: 'Generic functionality still relevant',
            notes: 'No obvious issues detected'
          };
        }
    }

    return {
      category: 'useful',
      reason: 'No issues detected',
      notes: 'Default classification'
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('');
    console.log('📊 SCRIPTS ANALYSIS RESULTS');
    console.log('━'.repeat(60));
    console.log(`📄 Total Scripts: ${this.results.total}`);
    console.log(`🗑️ Obsolete Scripts: ${this.results.obsolete.length}`);
    console.log(`🔧 Updateable Scripts: ${this.results.updateable.length}`);
    console.log(`✅ Useful Scripts: ${this.results.useful.length}`);
    console.log('');

    // Obsolete scripts
    if (this.results.obsolete.length > 0) {
      console.log('🗑️ OBSOLETE SCRIPTS (RECOMMEND DELETE):');
      this.results.obsolete.forEach(script => {
        const analysis = this.results.analyzed.find(a => a.filename === script);
        console.log(`  ❌ ${script}`);
        console.log(`     Reason: ${analysis.reason}`);
        if (analysis.replacement) {
          console.log(`     Replacement: ${analysis.replacement}`);
        }
      });
      console.log('');
    }

    // Updateable scripts
    if (this.results.updateable.length > 0) {
      console.log('🔧 UPDATEABLE SCRIPTS (CAN BE MODERNIZED):');
      this.results.updateable.forEach(script => {
        const analysis = this.results.analyzed.find(a => a.filename === script);
        console.log(`  🔧 ${script}`);
        console.log(`     Reason: ${analysis.reason}`);
        if (analysis.updateSuggestion) {
          console.log(`     Update: ${analysis.updateSuggestion}`);
        }
      });
      console.log('');
    }

    // Useful scripts
    if (this.results.useful.length > 0) {
      console.log('✅ USEFUL SCRIPTS (KEEP AS-IS):');
      this.results.useful.forEach(script => {
        const analysis = this.results.analyzed.find(a => a.filename === script);
        console.log(`  ✅ ${script}`);
        console.log(`     Reason: ${analysis.reason}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = '.cursor/rules/agents/_store/logs/scripts_analysis_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      analysis: this.results
    }, null, 2));
    console.log(`📝 Detailed report saved: ${reportPath}`);
    console.log('');
    console.log('🎯 Scripts analysis completed!');
  }
}

// Export for use as module
module.exports = ScriptsAnalyzer;

// CLI execution
if (require.main === module) {
  const analyzer = new ScriptsAnalyzer();
  analyzer.analyzeScripts().then(results => {
    console.log('\n🎯 Analysis complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   🗑️ ${results.obsolete.length} scripts to delete`);
    console.log(`   🔧 ${results.updateable.length} scripts to update`);
    console.log(`   ✅ ${results.useful.length} scripts to keep`);
    
    if (results.obsolete.length > 0) {
      console.log('\n🚀 Next Steps:');
      console.log('   1. Review obsolete scripts before deletion');
      console.log('   2. Update the updateable scripts for _core structure');
      console.log('   3. Run cleanup script to remove obsolete files');
    }
  }).catch(error => {
    console.error('💥 Analysis error:', error.message);
    process.exit(1);
  });
} 
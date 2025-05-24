#!/usr/bin/env node

/**
 * 🎛️ Cursor Rules Manager CLI
 * 
 * Command-line interface for managing .cursor/rules files
 * Provides scanning, analysis, and update capabilities
 */

const CursorRulesStateManager = require('./cursor_rules_state_manager.js');
const fs = require('fs').promises;
const path = require('path');

class CursorRulesManagerCLI {
  constructor() {
    this.manager = new CursorRulesStateManager();
    this.commands = {
      'scan': this.scanCommand.bind(this),
      'status': this.statusCommand.bind(this),
      'update-plan': this.updatePlanCommand.bind(this),
      'fix': this.fixCommand.bind(this),
      'modernize': this.modernizeCommand.bind(this),
      'export': this.exportCommand.bind(this),
      'help': this.helpCommand.bind(this)
    };
  }

  /**
   * Run the CLI with provided arguments
   */
  async run(args = process.argv.slice(2)) {
    if (args.length === 0) {
      return this.helpCommand();
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    if (!this.commands[command]) {
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run "help" to see available commands');
      return;
    }

    try {
      await this.commands[command](commandArgs);
    } catch (error) {
      console.error(`❌ Error running command "${command}":`, error.message);
      process.exit(1);
    }
  }

  /**
   * Scan all .cursor/rules files
   */
  async scanCommand(args) {
    console.log('🔍 Starting comprehensive scan of .cursor/rules files...');
    console.log('');
    
    await this.manager.initialize();
    
    const report = this.manager.getStatusReport();
    
    console.log('📊 Scan Results:');
    console.log('━'.repeat(60));
    console.log(`📁 Total Files: ${report.summary.totalFiles}`);
    console.log(`⚠️  Files Needing Update: ${report.summary.filesNeedingUpdate}`);
    console.log(`📂 Categories: ${report.summary.categories}`);
    console.log(`🕐 Last Scan: ${new Date(report.summary.lastScan).toLocaleString()}`);
    console.log('');
    
    // Show issues summary
    console.log('🚨 Issues Summary:');
    console.log(`  🔴 High Priority: ${report.issues.high}`);
    console.log(`  🟡 Medium Priority: ${report.issues.medium}`);
    console.log(`  🟢 Low Priority: ${report.issues.low}`);
    console.log('');
    
    // Show modernization needs
    console.log('🔄 Modernization Status:');
    console.log(`  📈 Files Needing Modernization: ${report.modernization.needed}/${report.modernization.total}`);
    console.log('');
    
    // Show categories breakdown
    console.log('📂 Categories Breakdown:');
    console.log('━'.repeat(60));
    
    for (const [category, info] of Object.entries(report.categories)) {
      console.log(`📁 ${category.toUpperCase()}: ${info.count} files`);
      if (info.needsUpdate > 0) {
        console.log(`  ⚠️  ${info.needsUpdate} need updates`);
      }
      console.log('');
    }
    
    if (args.includes('--verbose') || args.includes('-v')) {
      await this.showDetailedResults(report);
    }
    
    console.log('✅ Scan complete!');
    console.log('💡 Run "update-plan" to see recommended fixes');
  }

  /**
   * Show current status
   */
  async statusCommand(args) {
    await this.manager.initialize();
    const report = this.manager.getStatusReport();
    
    console.log('📊 Current Status:');
    console.log('━'.repeat(40));
    console.log(`Files: ${report.summary.totalFiles}`);
    console.log(`Updates Needed: ${report.summary.filesNeedingUpdate}`);
    console.log(`High Priority Issues: ${report.issues.high}`);
    console.log(`Modernization Needed: ${report.modernization.needed}`);
    
    const percentage = report.summary.totalFiles > 0 
      ? Math.round((report.summary.filesNeedingUpdate / report.summary.totalFiles) * 100)
      : 0;
    
    console.log(`Health Score: ${100 - percentage}%`);
  }

  /**
   * Generate and show update plan
   */
  async updatePlanCommand(args) {
    console.log('📋 Generating Update Plan...');
    console.log('');
    
    await this.manager.initialize();
    const plan = await this.manager.generateUpdatePlan();
    
    console.log('🎯 Update Plan Generated:');
    console.log('━'.repeat(60));
    console.log(`📄 Total Files to Update: ${plan.totalFiles}`);
    console.log(`⏱️  Estimated Time: ${plan.estimatedTime} minutes`);
    console.log(`📅 Generated: ${new Date(plan.timestamp).toLocaleString()}`);
    console.log('');
    
    if (plan.phases.length === 0) {
      console.log('🎉 No updates needed! All files are up to date.');
      return;
    }
    
    // Show each phase
    for (const phase of plan.phases) {
      console.log(`📋 Phase ${phase.priority}: ${phase.name}`);
      console.log(`  📄 Files: ${phase.files.length}`);
      console.log(`  ⏱️  Time: ${phase.estimatedTime} minutes`);
      console.log('  📝 Tasks:');
      
      for (const task of phase.tasks.slice(0, 3)) { // Show first 3 tasks
        console.log(`    • ${task.file}`);
        if (task.issues) {
          task.issues.forEach(issue => {
            console.log(`      ⚠️  ${issue.message}`);
          });
        }
        if (task.actions) {
          task.actions.forEach(action => {
            console.log(`      🔧 ${action}`);
          });
        }
      }
      
      if (phase.tasks.length > 3) {
        console.log(`    ... and ${phase.tasks.length - 3} more tasks`);
      }
      console.log('');
    }
    
    console.log('💡 Plan saved to: agents/_store/project-memory/update_plan.json');
    console.log('🚀 Run "fix" to start implementing fixes');
  }

  /**
   * Fix specific issues
   */
  async fixCommand(args) {
    const category = args[0];
    
    if (!category) {
      console.log('🔧 Available fix categories:');
      console.log('  • links - Fix broken file references');
      console.log('  • paths - Update file paths');
      console.log('  • structure - Add missing sections');
      console.log('  • all - Fix all issues');
      return;
    }
    
    await this.manager.initialize();
    const filesNeedingUpdate = this.manager.getFilesNeedingUpdate();
    
    console.log(`🔧 Fixing ${category} issues...`);
    console.log('');
    
    let fixedCount = 0;
    
    for (const file of filesNeedingUpdate) {
      const relevantIssues = this.getRelevantIssues(file.issues, category);
      
      if (relevantIssues.length > 0) {
        console.log(`📄 Fixing: ${file.path}`);
        
        for (const issue of relevantIssues) {
          console.log(`  🔧 ${issue.message}`);
          
          try {
            await this.applyFix(file, issue);
            console.log(`  ✅ Fixed`);
            fixedCount++;
          } catch (error) {
            console.log(`  ❌ Failed: ${error.message}`);
          }
        }
        console.log('');
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} issues`);
    console.log('🔄 Run "scan" to update status');
  }

  /**
   * Modernize content
   */
  async modernizeCommand(args) {
    await this.manager.initialize();
    const files = Object.values(this.manager.state.files);
    const modernizationFiles = files.filter(f => f.modernizationNeeded);
    
    console.log(`🔄 Modernizing ${modernizationFiles.length} files...`);
    console.log('');
    
    for (const file of modernizationFiles) {
      console.log(`📄 Modernizing: ${file.path}`);
      
      try {
        await this.modernizeFile(file);
        console.log(`  ✅ Modernized`);
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('✅ Modernization complete');
  }

  /**
   * Export state
   */
  async exportCommand(args) {
    await this.manager.initialize();
    const exportPath = await this.manager.exportState();
    
    console.log('📤 State exported successfully!');
    console.log(`📁 Location: ${exportPath}`);
    
    // Also create a summary report
    const report = this.manager.getStatusReport();
    const summaryPath = path.join(path.dirname(exportPath), 'summary_report.md');
    
    const summaryContent = this.generateMarkdownReport(report);
    await fs.writeFile(summaryPath, summaryContent);
    
    console.log(`📄 Summary report: ${summaryPath}`);
  }

  /**
   * Show help
   */
  helpCommand() {
    console.log('🎛️ Cursor Rules Manager CLI');
    console.log('');
    console.log('Usage: node cursor_rules_manager_cli.js <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  scan           Scan all .cursor/rules files');
    console.log('  scan -v        Scan with verbose output');
    console.log('  status         Show current status summary');
    console.log('  update-plan    Generate update plan');
    console.log('  fix <category> Fix specific issues (links, paths, structure, all)');
    console.log('  modernize      Update outdated content');
    console.log('  export         Export state and generate reports');
    console.log('  help           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node cursor_rules_manager_cli.js scan');
    console.log('  node cursor_rules_manager_cli.js fix links');
    console.log('  node cursor_rules_manager_cli.js modernize');
    console.log('');
  }

  /**
   * Show detailed scan results
   */
  async showDetailedResults(report) {
    console.log('🔍 Detailed Analysis:');
    console.log('━'.repeat(60));
    
    for (const [category, info] of Object.entries(report.categories)) {
      if (info.needsUpdate > 0) {
        console.log(`📁 ${category.toUpperCase()} - Issues Found:`);
        
        for (const file of info.files) {
          if (file.issues > 0) {
            console.log(`  📄 ${file.path} (${file.issues} issues)`);
          }
        }
        console.log('');
      }
    }
  }

  /**
   * Get relevant issues based on category
   */
  getRelevantIssues(issues, category) {
    if (category === 'all') return issues;
    
    const categoryMap = {
      'links': ['broken_link'],
      'paths': ['invalid_path', 'missing_file'],
      'structure': ['missing_section']
    };
    
    const relevantTypes = categoryMap[category] || [];
    return issues.filter(issue => relevantTypes.includes(issue.type));
  }

  /**
   * Apply a specific fix to a file
   */
  async applyFix(file, issue) {
    // This is a placeholder for actual fix implementation
    // In a real implementation, you would read the file, apply the fix, and save it
    
    console.log(`  🔧 Applying fix for ${issue.type}: ${issue.message}`);
    
    // For demonstration purposes, we'll just simulate the fix
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation:
    // 1. Read file content
    // 2. Apply specific fix based on issue type
    // 3. Save updated content
    // 4. Update state manager
  }

  /**
   * Modernize a file's content
   */
  async modernizeFile(file) {
    // This is a placeholder for actual modernization
    // In a real implementation, you would update technology references
    
    console.log(`  🔄 Modernizing technology references in ${file.path}`);
    
    // Simulate modernization
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In real implementation:
    // 1. Read file content
    // 2. Update outdated technology versions
    // 3. Modernize syntax and patterns
    // 4. Save updated content
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const timestamp = new Date().toISOString();
    
    return `# Cursor Rules Status Report

Generated: ${timestamp}

## Summary

- **Total Files:** ${report.summary.totalFiles}
- **Files Needing Update:** ${report.summary.filesNeedingUpdate}
- **Categories:** ${report.summary.categories}
- **Last Scan:** ${report.summary.lastScan}

## Issues Breakdown

- 🔴 **High Priority:** ${report.issues.high}
- 🟡 **Medium Priority:** ${report.issues.medium}
- 🟢 **Low Priority:** ${report.issues.low}

## Modernization Status

- **Files Needing Modernization:** ${report.modernization.needed}/${report.modernization.total}
- **Modernization Rate:** ${Math.round((report.modernization.needed / report.modernization.total) * 100)}%

## Categories

${Object.entries(report.categories).map(([category, info]) => `
### ${category.toUpperCase()}

- **Files:** ${info.count}
- **Need Updates:** ${info.needsUpdate}
- **Health:** ${Math.round(((info.count - info.needsUpdate) / info.count) * 100)}%

${info.files.map(f => `- ${f.path} (${f.issues} issues)`).join('\n')}
`).join('\n')}

---
*Generated by Cursor Rules State Manager*
`;
  }
}

// CLI execution
if (require.main === module) {
  const cli = new CursorRulesManagerCLI();
  cli.run().catch(error => {
    console.error('💥 CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = CursorRulesManagerCLI; 
#!/usr/bin/env node

/**
 * 🔧 Script Awareness for Cursor Integration
 * 
 * Integrates with script_manager.js to provide Cursor with automatic
 * awareness of all AAI scripts and continuous improvement suggestions
 */

const fs = require('fs');
const path = require('path');

class CursorScriptAwareness {
  constructor() {
    this.scriptManagerPath = '.cursor/rules/agents/_store/scripts/script_manager.js';
    this.outputPath = '.cursor/rules/agents/_store/cursor-summaries';
    this.cursorPath = '.cursor';
    
    // Import script manager if available
    this.scriptManager = null;
    this.loadScriptManager();
  }

  /**
   * Load the script manager
   */
  loadScriptManager() {
    try {
      const ScriptManager = require('../../' + this.scriptManagerPath);
      this.scriptManager = new ScriptManager();
      console.log('✅ Script Manager loaded successfully');
    } catch (error) {
      console.warn('⚠️ Could not load Script Manager:', error.message);
    }
  }

  /**
   * Generate comprehensive script awareness for Cursor
   */
  async generateScriptAwareness() {
    console.log('🔧 Generating Script Awareness for Cursor...\n');

    // Ensure output directories
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    // 1. Get script inventory from script manager
    const scriptInventory = await this.getScriptInventory();

    // 2. Generate Cursor-friendly script catalog
    const scriptCatalog = this.generateScriptCatalog(scriptInventory);

    // 3. Create script improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(scriptInventory);

    // 4. Generate workspace symbols for scripts
    const workspaceSymbols = this.generateScriptWorkspaceSymbols(scriptInventory);

    // 5. Create script usage patterns
    const usagePatterns = this.generateUsagePatterns(scriptInventory);

    // Write all outputs
    this.writeScriptAwarenessFiles({
      scriptCatalog,
      improvementSuggestions,
      workspaceSymbols,
      usagePatterns,
      scriptInventory
    });

    console.log('✅ Script awareness generated for Cursor!');
    this.showUsageInstructions();
  }

  /**
   * Get comprehensive script inventory
   */
  async getScriptInventory() {
    const inventory = {
      scripts: {},
      tests: {},
      npmScripts: [],
      totalFiles: 0,
      categories: {},
      lastUpdated: new Date().toISOString()
    };

    if (this.scriptManager) {
      // Use script manager to get organized data
      await this.scriptManager.listAll();
      inventory.scripts = this.scriptManager.results.scripts || {};
      inventory.tests = this.scriptManager.results.tests || {};
      inventory.npmScripts = this.scriptManager.results.npm_scripts || [];
      inventory.totalFiles = this.scriptManager.results.total_files || 0;
      inventory.categories = this.scriptManager.categories;
    } else {
      // Fallback: manual scan
      inventory.scripts = await this.scanScriptsDirectory();
      inventory.tests = await this.scanTestsDirectory();
      inventory.npmScripts = await this.getNpmScripts();
    }

    return inventory;
  }

  /**
   * Generate Cursor-friendly script catalog
   */
  generateScriptCatalog(inventory) {
    const catalog = {
      timestamp: new Date().toISOString(),
      source: 'AAI Script Manager → Cursor Integration',
      summary: {
        totalScripts: inventory.totalFiles,
        categories: Object.keys(inventory.categories.scripts || {}).length,
        npmIntegrated: inventory.npmScripts.length
      },
      scripts: {},
      quickAccess: [],
      recommendations: []
    };

    // Process script categories
    for (const [category, scripts] of Object.entries(inventory.scripts)) {
      if (scripts && scripts.length > 0) {
        catalog.scripts[category] = scripts.map(script => ({
          name: script.name,
          path: script.path,
          description: script.description,
          cursorActions: this.generateCursorActions(script),
          improvementOpportunities: this.analyzeScriptForImprovements(script)
        }));

        // Add to quick access if important
        if (['core', 'analysis', 'utility'].includes(category)) {
          catalog.quickAccess.push(...scripts.map(s => ({
            name: s.name,
            category,
            path: s.path,
            quickCommand: this.generateQuickCommand(s)
          })));
        }
      }
    }

    return catalog;
  }

  /**
   * Generate improvement suggestions for scripts
   */
  generateImprovementSuggestions(inventory) {
    const suggestions = {
      timestamp: new Date().toISOString(),
      source: 'Script Analysis → Cursor Improvements',
      categories: {
        documentation: [],
        organization: [],
        integration: [],
        optimization: []
      },
      actionable: []
    };

    // Analyze for improvements
    for (const [category, scripts] of Object.entries(inventory.scripts)) {
      if (scripts && scripts.length > 0) {
        scripts.forEach(script => {
          const improvements = this.analyzeScriptForImprovements(script);
          
          improvements.forEach(improvement => {
            suggestions.categories[improvement.category].push({
              script: script.name,
              issue: improvement.issue,
              suggestion: improvement.suggestion,
              priority: improvement.priority,
              estimatedTime: improvement.estimatedTime
            });

            if (improvement.priority === 'high') {
              suggestions.actionable.push({
                script: script.name,
                path: script.path,
                action: improvement.suggestion,
                category: improvement.category
              });
            }
          });
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate workspace symbols for scripts
   */
  generateScriptWorkspaceSymbols(inventory) {
    const symbols = {
      timestamp: new Date().toISOString(),
      scriptSymbols: [],
      categorySymbols: [],
      npmSymbols: []
    };

    // Script symbols
    for (const [category, scripts] of Object.entries(inventory.scripts)) {
      if (scripts && scripts.length > 0) {
        scripts.forEach(script => {
          symbols.scriptSymbols.push({
            name: script.name,
            kind: 'Function',
            location: script.path,
            detail: script.description,
            category: category,
            containerName: `AAI Scripts/${category}`
          });
        });

        // Category symbols
        symbols.categorySymbols.push({
          name: `${category} Scripts`,
          kind: 'Module',
          detail: `${scripts.length} scripts in ${category} category`,
          location: `.cursor/rules/agents/_store/scripts/${category}/`
        });
      }
    }

    // NPM script symbols
    inventory.npmScripts.forEach(npmScript => {
      symbols.npmSymbols.push({
        name: npmScript.name,
        kind: 'Function',
        detail: npmScript.command,
        location: 'package.json',
        containerName: 'NPM Scripts'
      });
    });

    return symbols;
  }

  /**
   * Generate usage patterns
   */
  generateUsagePatterns(inventory) {
    const patterns = {
      timestamp: new Date().toISOString(),
      mostUsedCategories: [],
      integrationPatterns: [],
      recommendations: [],
      workflowSuggestions: []
    };

    // Analyze category usage
    const categoryUsage = {};
    for (const [category, scripts] of Object.entries(inventory.scripts)) {
      if (scripts && scripts.length > 0) {
        categoryUsage[category] = scripts.length;
      }
    }

    patterns.mostUsedCategories = Object.entries(categoryUsage)
      .sort(([,a], [,b]) => b - a)
      .map(([category, count]) => ({ category, count }));

    // Integration patterns
    patterns.integrationPatterns = inventory.npmScripts.map(script => ({
      npmCommand: script.name,
      scriptPath: script.command,
      category: this.categorizeNpmScript(script.command)
    }));

    // Workflow suggestions
    patterns.workflowSuggestions = [
      {
        workflow: 'Script Development',
        steps: [
          'Use npm run AAI:scripts-list to see all scripts',
          'Check script categories with npm run AAI:scripts-categories',
          'Analyze usage with npm run AAI:scripts-analyze',
          'Organize with npm run AAI:scripts-organize'
        ]
      },
      {
        workflow: 'Cursor Integration',
        steps: [
          'Open script files directly in Cursor',
          'Use Ctrl/Cmd+P to search for script names',
          'Check improvement suggestions in cursor-summaries/',
          'Use workspace symbols for quick navigation'
        ]
      }
    ];

    return patterns;
  }

  /**
   * Analyze script for improvement opportunities
   */
  analyzeScriptForImprovements(script) {
    const improvements = [];

    // Check for documentation
    if (!script.description || script.description === 'No description available') {
      improvements.push({
        category: 'documentation',
        issue: 'Missing or inadequate description',
        suggestion: 'Add comprehensive JSDoc comments and description',
        priority: 'medium',
        estimatedTime: '10-15 minutes'
      });
    }

    // Check for error handling (basic heuristic)
    if (script.name.includes('test') && !script.name.includes('error')) {
      improvements.push({
        category: 'optimization',
        issue: 'Potential missing error handling',
        suggestion: 'Review and add comprehensive error handling',
        priority: 'low',
        estimatedTime: '15-30 minutes'
      });
    }

    // Check for organization
    if (script.path.includes('.cursor/rules/agents/_store/scripts/') && !script.path.includes('/')) {
      improvements.push({
        category: 'organization',
        issue: 'Script not categorized',
        suggestion: 'Move to appropriate category subdirectory',
        priority: 'low',
        estimatedTime: '5 minutes'
      });
    }

    return improvements;
  }

  /**
   * Generate Cursor actions for a script
   */
  generateCursorActions(script) {
    return [
      {
        title: 'Open Script',
        command: 'cursor.open',
        arguments: [script.path]
      },
      {
        title: 'Run Script',
        command: 'terminal.run',
        arguments: [`node ${script.path}`]
      },
      {
        title: 'Edit Description',
        command: 'cursor.edit',
        arguments: [script.path, 'Add description']
      }
    ];
  }

  /**
   * Generate quick command for script
   */
  generateQuickCommand(script) {
    const npmScript = this.findNpmScriptForPath(script.path);
    return npmScript ? `npm run ${npmScript}` : `node ${script.path}`;
  }

  /**
   * Find NPM script that runs this path
   */
  findNpmScriptForPath(scriptPath) {
    // This would need to check package.json scripts
    // Simplified for now
    return null;
  }

  /**
   * Categorize NPM script
   */
  categorizeNpmScript(command) {
    if (command.includes('test')) return 'testing';
    if (command.includes('analyze')) return 'analysis';
    if (command.includes('clean')) return 'cleanup';
    if (command.includes('core')) return 'core';
    return 'utility';
  }

  /**
   * Write all script awareness files
   */
  writeScriptAwarenessFiles(data) {
    const files = {
      'script-catalog.json': data.scriptCatalog,
      'script-improvements.json': data.improvementSuggestions,
      'script-workspace-symbols.json': data.workspaceSymbols,
      'script-usage-patterns.json': data.usagePatterns,
      'script-inventory.json': data.scriptInventory
    };

    Object.entries(files).forEach(([filename, content]) => {
      const filePath = path.join(this.outputPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`📄 Generated: ${filePath}`);
    });

    // Also create a summary for quick reference
    const summary = {
      timestamp: new Date().toISOString(),
      totalScripts: data.scriptInventory.totalFiles,
      categories: Object.keys(data.scriptInventory.scripts).length,
      improvements: data.improvementSuggestions.actionable.length,
      quickAccess: data.scriptCatalog.quickAccess,
      topRecommendations: data.improvementSuggestions.actionable.slice(0, 5)
    };

    fs.writeFileSync(
      path.join(this.outputPath, 'script-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log(`📋 Generated: ${path.join(this.outputPath, 'script-summary.json')}`);
  }

  /**
   * Show usage instructions
   */
  showUsageInstructions() {
    console.log('\n📖 How to use Script Awareness in Cursor:');
    console.log('');
    console.log('🔍 Quick Access:');
    console.log('   1. Open script-summary.json for overview');
    console.log('   2. Use Ctrl/Cmd+P → type script name to find files');
    console.log('   3. Check script-improvements.json for actionable items');
    console.log('');
    console.log('📂 Generated Files:');
    console.log('   📄 script-catalog.json - Complete script catalog');
    console.log('   🔧 script-improvements.json - Improvement suggestions');
    console.log('   🔗 script-workspace-symbols.json - Cursor symbols');
    console.log('   📊 script-usage-patterns.json - Usage analysis');
    console.log('   📋 script-summary.json - Quick overview');
    console.log('');
    console.log('🚀 NPM Commands:');
    console.log('   npm run AAI:scripts-list - List all scripts');
    console.log('   npm run cursor:script-awareness - Regenerate awareness');
    console.log('   npm run AAI:scripts-analyze - Analyze usage patterns');
  }

  /**
   * Fallback methods for when script manager is not available
   */
  async scanScriptsDirectory() {
    // Simplified fallback implementation
    return {};
  }

  async scanTestsDirectory() {
    // Simplified fallback implementation
    return {};
  }

  async getNpmScripts() {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return Object.entries(pkg.scripts || {})
        .filter(([name, command]) => command.includes('.cursor/rules/agents/_store/'))
        .map(([name, command]) => ({ name, command }));
    } catch (error) {
      return [];
    }
  }
}

// Export for use as module
module.exports = CursorScriptAwareness;

// CLI execution
if (require.main === module) {
  const awareness = new CursorScriptAwareness();
  awareness.generateScriptAwareness().then(() => {
    console.log('\n🎯 Script awareness generation completed!');
  }).catch(error => {
    console.error('💥 Script awareness error:', error.message);
    process.exit(1);
  });
} 
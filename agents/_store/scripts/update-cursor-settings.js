#!/usr/bin/env node

/**
 * 🔧 Update Cursor Settings for Enhanced AAI Integration
 * 
 * Updates existing .cursor/settings.json with enhanced AAI features
 * while preserving any custom user settings
 */

const fs = require('fs');
const path = require('path');

class CursorSettingsUpdater {
  constructor() {
    this.settingsPath = '.cursor/settings.json';
    this.backupPath = '.cursor/settings.backup.json';
    this.version = '2.0.0';
  }

  /**
   * Main update process
   */
  async update() {
    console.log('🔧 Updating Cursor Settings for Enhanced AAI Integration v' + this.version);
    console.log('━'.repeat(70));
    console.log('');

    try {
      // 1. Backup existing settings
      await this.backupExistingSettings();

      // 2. Load current settings
      const currentSettings = await this.loadCurrentSettings();

      // 3. Merge with enhanced settings
      const enhancedSettings = await this.createEnhancedSettings(currentSettings);

      // 4. Write updated settings
      await this.writeUpdatedSettings(enhancedSettings);

      // 5. Show what was updated
      this.showUpdateSummary();

      console.log('\n🎉 Cursor settings successfully updated for enhanced AAI integration!');

    } catch (error) {
      console.error('❌ Update failed:', error.message);
      await this.restoreBackup();
      process.exit(1);
    }
  }

  /**
   * Backup existing settings
   */
  async backupExistingSettings() {
    console.log('💾 Creating backup of existing settings...');

    if (fs.existsSync(this.settingsPath)) {
      const currentSettings = fs.readFileSync(this.settingsPath, 'utf8');
      fs.writeFileSync(this.backupPath, currentSettings);
      console.log(`  ✅ Backup created: ${this.backupPath}`);
    } else {
      console.log('  ℹ️ No existing settings file found');
    }
  }

  /**
   * Load current settings
   */
  async loadCurrentSettings() {
    console.log('📖 Loading current settings...');

    if (fs.existsSync(this.settingsPath)) {
      try {
        const content = fs.readFileSync(this.settingsPath, 'utf8');
        const settings = JSON.parse(content);
        console.log('  ✅ Current settings loaded');
        return settings;
      } catch (error) {
        console.log('  ⚠️ Error parsing current settings, starting fresh');
        return {};
      }
    } else {
      console.log('  ℹ️ No existing settings, creating new configuration');
      return {};
    }
  }

  /**
   * Create enhanced settings by merging current with AAI optimizations
   */
  async createEnhancedSettings(currentSettings) {
    console.log('⚙️ Creating enhanced settings...');

    const aaiEnhancements = {
      // === ENHANCED AAI FILE ASSOCIATIONS ===
      "files.associations": {
        ...currentSettings["files.associations"],
        "agents/**/*.json": "json",
        "agents/**/*.mdc": "markdown",
        "agents/**/*.md": "markdown",
        "agents/**/*.txt": "plaintext",
        "agents/**/*.log": "log",
        "agents/**/*.yaml": "yaml",
        "agents/**/*.yml": "yaml",
        "agents/**/*.toml": "toml",
        "agents/**/*.config": "json",
        "agents/**/*.rules": "markdown",
        "agents/**/*.prompt": "markdown",
        "agents/**/*.template": "markdown",
        "agents/**/*.spec": "json",
        "agents/**/*.schema": "json",
        "agents/**/*.analysis": "json",
        "agents/**/*.memory": "json",
        "agents/**/*.intelligence": "json",
        "agents/**/*.context": "json",
        "agents/**/*.workflow": "json",
        "agents/_store/**/*.json": "json",
        "agents/_store/**/*.mdc": "markdown",
        "agents/_core/**/*.mdc": "markdown",
        "agents/_core/**/*.json": "json"
      },

      // === ENHANCED FILE WATCHING ===
      "files.watcherExclude": {
        ...currentSettings["files.watcherExclude"],
        "**/agents/_store/memory/**": false,
        "**/agents/_store/analysis/**": false,
        "**/agents/_store/projects/**": false,
        "**/agents/_store/logs/**": false,
        "**/agents/_store/intelligence/**": false,
        "**/agents/_store/cursor-summaries/**": false,
        "**/agents/_core/**": false,
        "**/agents/workflows/**": false,
        "**/agents/prompts/**": false,
        "**/agents/tools/**": false,
        "**/agents/config/**": false,
        "**/agents/_store/cache/**": true,
        "**/agents/_store/temp/**": true,
        "**/agents/_store/cursor-cache/**": true
      },

      // === INTELLIGENT SEARCH CONFIGURATION ===
      "search.include": {
        ...currentSettings["search.include"],
        "agents/_store/memory": true,
        "agents/_store/analysis": true,
        "agents/_store/projects": true,
        "agents/_store/logs": true,
        "agents/_store/intelligence": true,
        "agents/_store/cursor-summaries": true,
        "agents/_core": true,
        "agents/workflows": true,
        "agents/prompts": true,
        "agents/tools": true,
        "agents/config": true
      },

      "search.exclude": {
        ...currentSettings["search.exclude"],
        "**/agents/_store/cache/**": true,
        "**/agents/_store/temp/**": true,
        "**/agents/_store/cursor-cache/**": true,
        "**/*.min.js": true,
        "**/*.min.css": true
      },

      // === ENHANCED EDITOR INTELLIGENCE ===
      "editor.quickSuggestions": {
        "other": true,
        "comments": true,
        "strings": true
      },
      "editor.suggest.showWords": true,
      "editor.suggest.localityBonus": true,
      "editor.wordBasedSuggestions": "allDocuments",
      "editor.wordBasedSuggestionsMode": "allDocuments",
      "editor.suggest.snippetsPreventQuickSuggestions": false,
      "editor.tabCompletion": "on",
      "editor.parameterHints.enabled": true,

      // === AAI-SPECIFIC JSON SCHEMAS ===
      "json.schemas": [
        ...(currentSettings["json.schemas"] || []),
        {
          "fileMatch": ["agents/**/*.json", "agents/**/*.analysis", "agents/**/*.memory"],
          "schema": {
            "type": "object",
            "properties": {
              "timestamp": { "type": "string", "format": "date-time" },
              "source": { "type": "string" },
              "type": { "type": "string" },
              "content": { "type": ["string", "object"] },
              "metadata": { "type": "object" },
              "analysis": { "type": "object" },
              "improvements": { "type": "array" },
              "agentInsights": { "type": "object" },
              "memoryClass": { "enum": ["agent", "project"] },
              "projectName": { "type": "string" },
              "embedding": { "type": "array" },
              "id": { "type": "string" }
            }
          }
        },
        {
          "fileMatch": ["agents/_store/projects/_core/**/*.json"],
          "schema": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "description": { "type": "string" },
              "version": { "type": "string" },
              "rules": { "type": "array" },
              "conventions": { "type": "object" },
              "templates": { "type": "object" }
            }
          }
        }
      ],

      // === MARKDOWN ENHANCEMENTS ===
      "markdown.suggest.paths.enabled": true,
      "markdown.validate.enabled": true,
      "markdown.preview.breaks": true,
      "markdown.preview.linkify": true,
      "markdown.preview.typographer": true,

      // === JSON ENHANCEMENTS ===
      "json.suggest.mode": "allDocuments",
      "json.validate.enable": true,
      "json.format.enable": true,
      "json.maxItemsComputed": 10000,

      // === FILE NESTING FOR AAI ===
      "explorer.fileNesting.enabled": true,
      "explorer.fileNesting.expand": false,
      "explorer.fileNesting.patterns": {
        ...currentSettings["explorer.fileNesting.patterns"],
        "*.mdc": "${capture}.md, ${capture}.json, ${capture}.yaml, ${capture}.yml",
        "*.config.json": "${capture}.schema.json, ${capture}.template.json",
        "*.rules.mdc": "${capture}.examples.md, ${capture}.tests.json",
        "*.memory.json": "${capture}.analysis.json, ${capture}.context.json",
        "*.intelligence.json": "${capture}.patterns.json, ${capture}.insights.json"
      },

      // === ENHANCED OUTLINE ===
      "outline.showFiles": true,
      "outline.showModules": true,
      "outline.showPackages": true,
      "outline.showClasses": true,
      "outline.showMethods": true,
      "outline.showProperties": true,
      "outline.showFields": true,
      "outline.showConstructors": true,
      "outline.showEnums": true,
      "outline.showInterfaces": true,
      "outline.showFunctions": true,
      "outline.showVariables": true,
      "outline.showConstants": true,
      "outline.showStrings": true,
      "outline.showNumbers": true,
      "outline.showBooleans": true,
      "outline.showArrays": true,
      "outline.showObjects": true,
      "outline.showKeys": true,
      "outline.showNull": true,
      "outline.showEnumMembers": true,
      "outline.showEvents": true,
      "outline.showOperators": true,
      "outline.showTypeParameters": true,

      // === EMMET FOR AAI FILES ===
      "emmet.includeLanguages": {
        ...currentSettings["emmet.includeLanguages"],
        "markdown": "html",
        "mdc": "html",
        "plaintext": "html"
      },
      "emmet.showExpandedAbbreviation": "always",

      // === ENHANCED CURSOR AI INTEGRATION ===
      "cursor.ai.enableCodeActions": true,
      "cursor.ai.enableInlineCompletions": true,
      "cursor.ai.enableChatInEditor": true,
      "cursor.ai.enableSmartRename": true,
      "cursor.ai.enableAutoComplete": true,
      "cursor.ai.contextFiles": [
        ...(currentSettings["cursor.ai.contextFiles"] || []),
        "agents/_core/**/*.mdc",
        "agents/_core/**/*.json",
        "agents/_store/projects/_core/**/*.mdc",
        "agents/_store/projects/_core/**/*.json",
        "agents/_store/memory/**/*.json",
        "agents/_store/analysis/**/*.json",
        "agents/_store/intelligence/**/*.json",
        "agents/workflows/**/*.json",
        "agents/prompts/**/*.md",
        "agents/config/**/*.json",
        "agents/_store/cursor-summaries/**/*.json"
      ].filter((item, index, arr) => arr.indexOf(item) === index), // Remove duplicates

      "cursor.ai.priorityFiles": [
        ...(currentSettings["cursor.ai.priorityFiles"] || []),
        "agents/_core/rules/**/*.mdc",
        "agents/_store/projects/_core/rules/**/*.mdc",
        "agents/_store/cursor-summaries/workspace-context.json",
        "agents/_store/cursor-summaries/latest-insights.json",
        "agents/workflows/core.json",
        "agents/config/main.json"
      ].filter((item, index, arr) => arr.indexOf(item) === index), // Remove duplicates

      // === VISUAL ENHANCEMENTS ===
      "workbench.colorCustomizations": {
        ...currentSettings["workbench.colorCustomizations"],
        "editorBracketHighlight.foreground1": "#FFD700",
        "editorBracketHighlight.foreground2": "#DA70D6",
        "editorBracketHighlight.foreground3": "#87CEEB",
        "editorBracketHighlight.foreground4": "#FFA500",
        "editorBracketHighlight.foreground5": "#98FB98",
        "editorBracketHighlight.foreground6": "#F0E68C",
        "editorBracketHighlight.unexpectedBracket.foreground": "#FF0000"
      },

      "editor.bracketPairColorization.enabled": true,
      "editor.guides.bracketPairs": "active",
      "editor.guides.bracketPairsHorizontal": "active",
      "editor.guides.highlightActiveIndentation": true,
      "editor.guides.indentation": true,
      "editor.renderWhitespace": "boundary",
      "editor.rulers": [80, 100, 120],
      "editor.minimap.enabled": true,
      "editor.minimap.showSlider": "always",
      "editor.minimap.renderCharacters": false,
      "editor.stickyScroll.enabled": true,
      "editor.stickyScroll.maxLineCount": 5,

      // === AAI-SPECIFIC SETTINGS ===
      "aai.memoryTracking.enabled": true,
      "aai.intelligenceMode": "enhanced",
      "aai.autoSync.enabled": true,
      "aai.contextAwareness.level": "high"
    };

    // Merge current settings with AAI enhancements
    const mergedSettings = {
      ...currentSettings,
      ...aaiEnhancements
    };

    console.log('  ✅ Enhanced settings created');
    return mergedSettings;
  }

  /**
   * Write updated settings to file
   */
  async writeUpdatedSettings(settings) {
    console.log('💾 Writing updated settings...');

    // Ensure .cursor directory exists
    if (!fs.existsSync('.cursor')) {
      fs.mkdirSync('.cursor', { recursive: true });
    }

    fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    console.log(`  ✅ Settings updated: ${this.settingsPath}`);
  }

  /**
   * Show update summary
   */
  showUpdateSummary() {
    console.log('\n📊 UPDATE SUMMARY');
    console.log('━'.repeat(50));
    console.log('');
    console.log('🎯 ENHANCED FEATURES:');
    console.log('   ✅ Extended file associations for all AAI file types');
    console.log('   ✅ Optimized file watching for AAI directories');
    console.log('   ✅ Enhanced search configuration');
    console.log('   ✅ AAI-specific JSON schemas for validation');
    console.log('   ✅ Improved editor intelligence and suggestions');
    console.log('   ✅ Enhanced Cursor AI context awareness');
    console.log('   ✅ Visual improvements and file nesting');
    console.log('   ✅ AAI-specific settings for optimal performance');
    console.log('');
    console.log('📂 NEW FILE ASSOCIATIONS:');
    console.log('   • .mdc → Enhanced markdown');
    console.log('   • .memory → JSON with AAI schema');
    console.log('   • .analysis → JSON with analysis schema');
    console.log('   • .intelligence → JSON with intelligence schema');
    console.log('   • .workflow → JSON workflow files');
    console.log('   • .context → JSON context files');
    console.log('');
    console.log('🔍 ENHANCED SEARCH:');
    console.log('   • agents/_store/memory/');
    console.log('   • agents/_store/analysis/');
    console.log('   • agents/_store/intelligence/');
    console.log('   • agents/_core/');
    console.log('   • agents/workflows/');
    console.log('   • agents/prompts/');
    console.log('   • agents/tools/');
    console.log('   • agents/config/');
    console.log('');
    console.log('🤖 CURSOR AI ENHANCEMENTS:');
    console.log('   • Extended context files for better AI assistance');
    console.log('   • Priority files for critical AAI components');
    console.log('   • Enhanced code actions and completions');
    console.log('');
    console.log('💾 BACKUP:');
    console.log(`   • Original settings backed up to: ${this.backupPath}`);
  }

  /**
   * Restore backup if update fails
   */
  async restoreBackup() {
    if (fs.existsSync(this.backupPath)) {
      console.log('🔄 Restoring backup...');
      const backup = fs.readFileSync(this.backupPath, 'utf8');
      fs.writeFileSync(this.settingsPath, backup);
      console.log('  ✅ Backup restored');
    }
  }

  /**
   * Show current status
   */
  static async showStatus() {
    console.log('📊 CURSOR SETTINGS STATUS');
    console.log('━'.repeat(40));

    const settingsPath = '.cursor/settings.json';
    const backupPath = '.cursor/settings.backup.json';

    console.log('\n📂 Files:');
    console.log(`   ${fs.existsSync(settingsPath) ? '✅' : '❌'} Current settings (${settingsPath})`);
    console.log(`   ${fs.existsSync(backupPath) ? '✅' : '❌'} Backup settings (${backupPath})`);

    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        console.log('\n🎯 AAI Integration Features:');
        console.log(`   ${settings['aai.memoryTracking.enabled'] ? '✅' : '❌'} Memory tracking`);
        console.log(`   ${settings['aai.intelligenceMode'] === 'enhanced' ? '✅' : '❌'} Enhanced intelligence mode`);
        console.log(`   ${settings['aai.autoSync.enabled'] ? '✅' : '❌'} Auto-sync`);
        console.log(`   ${settings['aai.contextAwareness.level'] === 'high' ? '✅' : '❌'} High context awareness`);

        console.log('\n📁 File Associations:');
        const associations = settings['files.associations'] || {};
        const aaiAssociations = Object.keys(associations).filter(key => key.startsWith('agents/'));
        console.log(`   ${aaiAssociations.length > 0 ? '✅' : '❌'} AAI file associations (${aaiAssociations.length} patterns)`);

        console.log('\n🔍 Search Configuration:');
        const searchInclude = settings['search.include'] || {};
        const aaiSearchPaths = Object.keys(searchInclude).filter(key => key.startsWith('agents/'));
        console.log(`   ${aaiSearchPaths.length > 0 ? '✅' : '❌'} AAI search paths (${aaiSearchPaths.length} paths)`);

        console.log('\n🤖 Cursor AI:');
        const contextFiles = settings['cursor.ai.contextFiles'] || [];
        const priorityFiles = settings['cursor.ai.priorityFiles'] || [];
        console.log(`   ${contextFiles.length > 0 ? '✅' : '❌'} Context files (${contextFiles.length} files)`);
        console.log(`   ${priorityFiles.length > 0 ? '✅' : '❌'} Priority files (${priorityFiles.length} files)`);

      } catch (error) {
        console.log('\n❌ Error reading settings file');
      }
    }
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup() {
    const settingsPath = '.cursor/settings.json';
    const backupPath = '.cursor/settings.backup.json';

    if (fs.existsSync(backupPath)) {
      console.log('🔄 Restoring settings from backup...');
      const backup = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(settingsPath, backup);
      console.log('✅ Settings restored from backup');
    } else {
      console.log('❌ No backup file found');
    }
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'update';
  
  switch (command.toLowerCase()) {
    case 'update':
      const updater = new CursorSettingsUpdater();
      updater.update();
      break;
      
    case 'status':
      CursorSettingsUpdater.showStatus();
      break;
      
    case 'restore':
      CursorSettingsUpdater.restoreFromBackup();
      break;
      
    default:
      console.log('❌ Unknown command:', command);
      console.log('Available commands: update, status, restore');
  }
}

module.exports = CursorSettingsUpdater; 
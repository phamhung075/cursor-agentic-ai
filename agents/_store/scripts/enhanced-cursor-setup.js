#!/usr/bin/env node

/**
 * 🚀 Enhanced Cursor + AAI Integration Setup
 * 
 * Advanced setup script that optimizes Cursor IDE for AAI development
 * with intelligent file associations, enhanced IntelliSense, and real-time monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnhancedCursorSetup {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.cursorDir = '.cursor';
    this.agentsDir = 'agents';
    this.version = '2.0.0';
  }

  /**
   * Main setup process
   */
  async setup() {
    console.log('🚀 Enhanced Cursor + AAI Integration Setup v' + this.version);
    console.log('━'.repeat(60));
    console.log('');

    try {
      // 1. Ensure directory structure
      await this.ensureDirectories();

      // 2. Create enhanced Cursor settings
      await this.createEnhancedCursorSettings();

      // 3. Setup Cursor rules for AAI
      await this.setupCursorRules();

      // 4. Create workspace snippets
      await this.createWorkspaceSnippets();

      // 5. Setup file watchers
      await this.setupFileWatchers();

      // 6. Create AAI-specific tasks
      await this.createAAITasks();

      // 7. Update package.json
      await this.updatePackageJson();

      // 8. Generate initial summaries
      await this.generateInitialSummaries();

      console.log('\n🎉 Enhanced Cursor + AAI Integration Complete!');
      this.showUsageInstructions();

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Ensure all necessary directories exist
   */
  async ensureDirectories() {
    console.log('📁 Setting up directory structure...');

    const dirs = [
      this.cursorDir,
      `${this.cursorDir}/rules`,
      `${this.agentsDir}/cursor-integration`,
      `${this.agentsDir}/_store/cursor-summaries`,
      `${this.agentsDir}/_store/cursor-cache`,
      '.vscode' // For compatibility
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      } else {
        console.log(`  📁 Exists: ${dir}`);
      }
    });
  }

  /**
   * Create enhanced Cursor settings with AAI optimizations
   */
  async createEnhancedCursorSettings() {
    console.log('⚙️ Creating enhanced Cursor settings...');

    const settingsPath = path.join(this.cursorDir, 'settings.json');
    
    const settings = {
      // === AAI FILE ASSOCIATIONS ===
      "files.associations": {
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
        "**/agents/_store/cursor-cache/**": true,
        "**/node_modules/**": true,
        "**/.git/**": true,
        "**/dist/**": true,
        "**/build/**": true
      },

      // === INTELLIGENT SEARCH CONFIGURATION ===
      "search.include": {
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
        "**/agents/_store/cache/**": true,
        "**/agents/_store/temp/**": true,
        "**/agents/_store/cursor-cache/**": true,
        "**/node_modules/**": true,
        "**/.git/**": true,
        "**/dist/**": true,
        "**/build/**": true,
        "**/*.min.js": true,
        "**/*.min.css": true,
        "**/*.backup": true,
        "**/*.backup.*": true,
        "**/*.bak": true,
        "**/*.old": true,
        "**/*.orig": true,
        "**/*.tmp": true,
        "**/*.temp": true,
        "**/backup/**": true,
        "**/backups/**": true,
        "**/.cursor/settings.backup.json": true,
        "**/.cursor/settings.enhanced.backup.json": true,
        "**/.cursor/*.backup.*": true,
        "**/agents/_store/backups/**": true,
        "**/agents/_store/memory/backup/**": true,
        "**/agents/_store/analysis/backup/**": true
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
        },
        {
          "fileMatch": ["agents/_store/cursor-summaries/ai-session-memory.json"],
          "schema": {
            "type": "object",
            "properties": {
              "sessionId": { "type": "string" },
              "timestamp": { "type": "string", "format": "date-time" },
              "aiInteractions": { "type": "array" },
              "learnedPatterns": { "type": "array" },
              "contextHistory": { "type": "array" },
              "decisionHistory": { "type": "array" }
            }
          }
        },
        {
          "fileMatch": ["agents/_store/cursor-summaries/shared-ai-context.json"],
          "schema": {
            "type": "object",
            "properties": {
              "sharedContext": { "type": "object" },
              "crossAIInsights": { "type": "array" },
              "collaborativeDecisions": { "type": "array" },
              "consensusPatterns": { "type": "array" }
            }
          }
        },
        {
          "fileMatch": ["agents/_store/intelligence/cursor-learning.json"],
          "schema": {
            "type": "object",
            "properties": {
              "learnedPatterns": { "type": "array" },
              "codeStyles": { "type": "object" },
              "userPreferences": { "type": "object" },
              "projectConventions": { "type": "object" }
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
      "markdown.extension.toc.levels": "1..6",

      // === JSON ENHANCEMENTS ===
      "json.suggest.mode": "allDocuments",
      "json.validate.enable": true,
      "json.format.enable": true,
      "json.maxItemsComputed": 10000,

      // === FILE MANAGEMENT ===
      "files.autoSave": "onFocusChange",
      "files.trimTrailingWhitespace": true,
      "files.insertFinalNewline": true,
      "files.trimFinalNewlines": true,
      "files.exclude": {
        "**/agents/_store/cache/**": true,
        "**/agents/_store/temp/**": true,
        "**/*.backup": true,
        "**/*.backup.*": true,
        "**/*.bak": true,
        "**/*.old": true,
        "**/*.orig": true,
        "**/*.tmp": true,
        "**/*.temp": true,
        "**/backup/**": true,
        "**/backups/**": true,
        "**/.cursor/settings.backup.json": true,
        "**/.cursor/settings.enhanced.backup.json": true,
        "**/.cursor/*.backup.*": true,
        "**/agents/_store/backups/**": true,
        "**/agents/_store/memory/backup/**": true,
        "**/agents/_store/analysis/backup/**": true
      },

      // === WORKSPACE ENHANCEMENTS ===
      "workbench.editor.enablePreview": false,
      "workbench.editor.enablePreviewFromQuickOpen": false,
      "workbench.editor.closeOnFileDelete": true,
      "workbench.editor.highlightModifiedTabs": true,
      "workbench.editor.labelFormat": "short",
      "workbench.editor.tabCloseButton": "right",
      "workbench.editor.tabSizing": "shrink",

      // === FILE NESTING FOR AAI ===
      "explorer.fileNesting.enabled": true,
      "explorer.fileNesting.expand": false,
      "explorer.fileNesting.patterns": {
        "*.mdc": "${capture}.md, ${capture}.json, ${capture}.yaml, ${capture}.yml",
        "*.config.json": "${capture}.schema.json, ${capture}.template.json",
        "*.rules.mdc": "${capture}.examples.md, ${capture}.tests.json",
        "*.memory.json": "${capture}.analysis.json, ${capture}.context.json",
        "*.intelligence.json": "${capture}.patterns.json, ${capture}.insights.json",
        "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, .npmrc, .yarnrc, .nvmrc",
        "tsconfig.json": "tsconfig.*.json, jsconfig.json",
        "tailwind.config.js": "tailwind.config.ts, postcss.config.js, postcss.config.ts"
      },

      // === BREADCRUMBS AND OUTLINE ===
      "breadcrumbs.enabled": true,
      "breadcrumbs.filePath": "on",
      "breadcrumbs.symbolPath": "on",
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

      // === GIT INTEGRATION ===
      "git.ignoreLimitWarning": true,
      "git.autofetch": true,
      "git.enableSmartCommit": true,
      "git.confirmSync": false,
      "git.decorations.enabled": true,

      // === TERMINAL CONFIGURATION ===
      "terminal.integrated.defaultProfile.osx": "zsh",
      "terminal.integrated.defaultProfile.linux": "bash",
      "terminal.integrated.defaultProfile.windows": "PowerShell",
      "terminal.integrated.cwd": "${workspaceFolder}",
      "terminal.integrated.fontSize": 14,

      // === LANGUAGE-SPECIFIC SETTINGS ===
      "typescript.suggest.autoImports": true,
      "typescript.suggest.includeCompletionsForModuleExports": true,
      "typescript.preferences.includePackageJsonAutoImports": "auto",
      "javascript.suggest.autoImports": true,
      "javascript.suggest.includeCompletionsForModuleExports": true,

      // === EMMET FOR AAI FILES ===
      "emmet.includeLanguages": {
        "markdown": "html",
        "mdc": "html",
        "plaintext": "html"
      },
      "emmet.showExpandedAbbreviation": "always",

      // === CURSOR AI ENHANCEMENTS ===
      "cursor.ai.enableCodeActions": true,
      "cursor.ai.enableInlineCompletions": true,
      "cursor.ai.enableChatInEditor": true,
      "cursor.ai.enableSmartRename": true,
      "cursor.ai.enableAutoComplete": true,
      "cursor.ai.contextFiles": [
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
        "agents/_store/cursor-summaries/**/*.json",
        ".cursor/settings.json",
        "agents/_store/docs/CURSOR-*.md",
        "agents/_store/scripts/enhanced-cursor-setup.js",
        "agents/_store/scripts/protect-enhanced-cursor-settings.js",
        "README.md",
        "package.json",
        "tsconfig.json",
        "tailwind.config.js"
      ],
      "cursor.ai.priorityFiles": [
        "agents/_core/rules/**/*.mdc",
        "agents/_store/projects/_core/rules/**/*.mdc",
        ".cursor/settings.json",
        "agents/_store/cursor-summaries/workspace-context.json",
        "agents/_store/cursor-summaries/latest-insights.json",
        "agents/_store/cursor-summaries/ai-session-memory.json",
        "agents/_store/cursor-summaries/shared-ai-context.json",
        "agents/workflows/core.json",
        "agents/config/main.json"
      ],

      // === VISUAL ENHANCEMENTS ===
      "workbench.colorCustomizations": {
        "editorBracketHighlight.foreground1": "#FFD700",
        "editorBracketHighlight.foreground2": "#DA70D6",
        "editorBracketHighlight.foreground3": "#87CEEB",
        "editorBracketHighlight.foreground4": "#FFA500",
        "editorBracketHighlight.foreground5": "#98FB98",
        "editorBracketHighlight.foreground6": "#F0E68C",
        "editorBracketHighlight.unexpectedBracket.foreground": "#FF0000",
        "statusBar.background": "#1e1e1e",
        "statusBar.foreground": "#ffffff",
        "activityBar.background": "#2d2d30",
        "sideBar.background": "#252526"
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

      // === PROBLEM MANAGEMENT ===
      "problems.showCurrentInStatus": true,
      "problems.sortOrder": "severity",

      // === EXTENSIONS ===
      "extensions.ignoreRecommendations": false,
      "extensions.showRecommendationsOnlyOnDemand": false,

      // === WORKSPACE TRUST ===
      "security.workspace.trust.untrustedFiles": "open",

      // === DIFF EDITOR ===
      "diffEditor.ignoreTrimWhitespace": false,
      "diffEditor.renderSideBySide": true,
      "diffEditor.wordWrap": "on",

      // === SOURCE CONTROL ===
      "scm.defaultViewMode": "tree",
      "scm.diffDecorations": "all",
      "scm.diffDecorationsGutterVisibility": "always",

      // === AAI-SPECIFIC SETTINGS ===
      "aai.memoryTracking.enabled": true,
      "aai.intelligenceMode": "enhanced",
      "aai.autoSync.enabled": true,
      "aai.contextAwareness.level": "high",

      // === AI COOPERATION ENHANCEMENTS ===
      "cursor.ai.sessionMemory": {
        "enabled": true,
        "persistAcrossSessions": true,
        "memoryPath": "agents/_store/cursor-summaries/ai-session-memory.json",
        "maxMemoryEntries": 1000,
        "contextRetention": "7d"
      },

      "cursor.ai.crossAISharing": {
        "enabled": true,
        "sharedContextPath": "agents/_store/cursor-summaries/shared-ai-context.json",
        "includeDecisionHistory": true,
        "includePatternLearning": true,
        "syncInterval": "5m"
      },

      "cursor.ai.learningMode": {
        "enabled": true,
        "patternRecognition": true,
        "codeStyleLearning": true,
        "projectConventionLearning": true,
        "userPreferenceLearning": true,
        "learningDataPath": "agents/_store/intelligence/cursor-learning.json"
      },

      "cursor.ai.adaptiveContext": {
        "enabled": true,
        "dynamicContextAdjustment": true,
        "relevanceScoring": true,
        "contextOptimization": "auto",
        "maxContextTokens": 50000
      },

      "cursor.ai.fileTypeIntelligence": {
        "*.mdc": {
          "treatAs": "enhanced-markdown",
          "includeMetadata": true,
          "contextWeight": "high",
          "suggestionsMode": "comprehensive"
        },
        "*.memory.json": {
          "treatAs": "aai-memory",
          "includeEmbeddings": false,
          "contextWeight": "medium",
          "suggestionsMode": "structured"
        },
        "*.analysis.json": {
          "treatAs": "aai-analysis",
          "includeInsights": true,
          "contextWeight": "high",
          "suggestionsMode": "analytical"
        },
        "*.intelligence.json": {
          "treatAs": "aai-intelligence",
          "includePatterns": true,
          "contextWeight": "very-high",
          "suggestionsMode": "intelligent"
        }
      },

      "cursor.ai.realTimeSync": {
        "enabled": true,
        "syncWithAAIAgent": true,
        "syncPath": "agents/_store/cursor-summaries/realtime-sync.json",
        "syncEvents": [
          "fileChange",
          "codeCompletion",
          "chatInteraction",
          "analysisUpdate"
        ],
        "syncInterval": "30s"
      },

      // === CURSOR CHAT EXCLUSIONS ===
      "cursor.chat.excludeFiles": [
        "**/*.backup",
        "**/*.backup.*",
        "**/*.bak",
        "**/*.old",
        "**/*.orig",
        "**/*.tmp",
        "**/*.temp",
        "**/backup/**",
        "**/backups/**",
        "**/.cursor/settings.backup.json",
        "**/.cursor/settings.enhanced.backup.json",
        "**/.cursor/*.backup.*",
        "**/agents/_store/backups/**",
        "**/agents/_store/memory/backup/**",
        "**/agents/_store/analysis/backup/**",
        "**/agents/_store/cache/**",
        "**/agents/_store/temp/**",
        "**/agents/_store/cursor-cache/**",
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/*.min.js",
        "**/*.min.css"
      ],
      "cursor.ai.excludeFromContext": [
        "**/*.backup",
        "**/*.backup.*",
        "**/*.bak",
        "**/*.old",
        "**/*.orig",
        "**/*.tmp",
        "**/*.temp",
        "**/backup/**",
        "**/backups/**",
        "**/.cursor/settings.backup.json",
        "**/.cursor/settings.enhanced.backup.json",
        "**/.cursor/*.backup.*",
        "**/agents/_store/backups/**",
        "**/agents/_store/memory/backup/**",
        "**/agents/_store/analysis/backup/**"
      ]
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`  ✅ Enhanced settings created: ${settingsPath}`);
  }

  /**
   * Setup Cursor rules for AAI development
   */
  async setupCursorRules() {
    console.log('📋 Setting up Cursor rules for AAI...');

    const rulesPath = path.join(this.cursorDir, 'rules', 'aai.md');
    
    const rules = `# AAI Development Rules for Cursor

## Context Awareness
- Always check agents/_store/cursor-summaries/ for latest context
- Reference agents/_core/rules/ for coding conventions
- Use agents/_store/memory/ for historical insights

## File Patterns
- \`.mdc\` files are enhanced markdown with metadata
- \`.memory.json\` files contain agent learning data
- \`.analysis.json\` files contain code analysis results
- \`.intelligence.json\` files contain AI insights

## Development Workflow
1. Check workspace-context.json for current focus
2. Review latest-insights.json for recent analysis
3. Follow conventions in agents/_store/projects/_core/rules/
4. Update memory when making significant changes

## AI Assistance Guidelines
- Leverage AAI memory for context-aware suggestions
- Use project-specific memory for targeted recommendations
- Reference core framework patterns for consistency
- Maintain dual memory system (agent + project)

## Performance Considerations
- Cache frequently accessed AAI data
- Use incremental analysis for large codebases
- Optimize memory storage for quick retrieval
- Monitor file watcher performance

## Integration Points
- npm run AAI:* commands for agent operations
- Real-time memory sync with development actions
- Automatic context updates on file changes
- Intelligent code suggestions based on patterns
`;

    fs.writeFileSync(rulesPath, rules);
    console.log(`  ✅ AAI rules created: ${rulesPath}`);
  }

  /**
   * Create workspace snippets for AAI development
   */
  async createWorkspaceSnippets() {
    console.log('📝 Creating AAI workspace snippets...');

    const snippetsDir = path.join(this.cursorDir, 'snippets');
    if (!fs.existsSync(snippetsDir)) {
      fs.mkdirSync(snippetsDir, { recursive: true });
    }

    const snippets = {
      "AAI Memory Entry": {
        "prefix": "aai-memory",
        "body": [
          "{",
          "  \"id\": \"${1:memory-id}\",",
          "  \"type\": \"${2:learning|decision|pattern}\",",
          "  \"content\": \"${3:content}\",",
          "  \"metadata\": {",
          "    \"timestamp\": \"${4:${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}T${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND}Z}\",",
          "    \"memoryClass\": \"${5:agent|project}\",",
          "    \"source\": \"${6:source}\"",
          "  },",
          "  \"embedding\": []",
          "}"
        ],
        "description": "Create AAI memory entry structure"
      },
      "AAI Analysis Template": {
        "prefix": "aai-analysis",
        "body": [
          "{",
          "  \"timestamp\": \"${1:${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}T${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND}Z}\",",
          "  \"source\": \"${2:analysis-source}\",",
          "  \"type\": \"${3:code|performance|security}\",",
          "  \"analysis\": {",
          "    \"summary\": \"${4:analysis-summary}\",",
          "    \"findings\": [],",
          "    \"recommendations\": [],",
          "    \"metrics\": {}",
          "  },",
          "  \"improvements\": [",
          "    {",
          "      \"category\": \"${5:category}\",",
          "      \"description\": \"${6:description}\",",
          "      \"priority\": \"${7:high|medium|low}\"",
          "    }",
          "  ]",
          "}"
        ],
        "description": "Create AAI analysis template"
      },
      "AAI Project Memory": {
        "prefix": "aai-project",
        "body": [
          "{",
          "  \"projectName\": \"${1:project-name}\",",
          "  \"memoryClass\": \"project\",",
          "  \"type\": \"project_${2:context|decision|issue|solution}\",",
          "  \"content\": \"${3:content}\",",
          "  \"metadata\": {",
          "    \"timestamp\": \"${4:${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}T${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND}Z}\",",
          "    \"projectName\": \"${1:project-name}\",",
          "    \"category\": \"${5:category}\"",
          "  }",
          "}"
        ],
        "description": "Create project-specific memory entry"
      }
    };

    fs.writeFileSync(
      path.join(snippetsDir, 'aai.json'),
      JSON.stringify(snippets, null, 2)
    );
    console.log(`  ✅ AAI snippets created`);
  }

  /**
   * Setup file watchers for real-time AAI integration
   */
  async setupFileWatchers() {
    console.log('👁️ Setting up file watchers...');

    const watcherScript = `#!/usr/bin/env node

/**
 * 👁️ AAI File Watcher for Cursor Integration
 * 
 * Monitors AAI files and updates Cursor summaries in real-time
 */

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

class AAIFileWatcher {
  constructor() {
    this.summariesPath = 'agents/_store/cursor-summaries';
    this.isWatching = false;
  }

  start() {
    if (this.isWatching) return;

    console.log('👁️ Starting AAI file watcher...');

    // Watch AAI directories
    const watcher = chokidar.watch([
      'agents/_store/memory/**/*.json',
      'agents/_store/analysis/**/*.json',
      'agents/_store/intelligence/**/*.json',
      'agents/_core/**/*.mdc',
      'agents/_core/**/*.json'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher
      .on('add', path => this.onFileChange('added', path))
      .on('change', path => this.onFileChange('changed', path))
      .on('unlink', path => this.onFileChange('removed', path));

    this.isWatching = true;
    console.log('✅ File watcher active');
  }

  onFileChange(event, filePath) {
    console.log(\`📁 \${event}: \${filePath}\`);
    
    // Update workspace context
    this.updateWorkspaceContext();
    
    // Update latest insights if it's a memory or analysis file
    if (filePath.includes('memory') || filePath.includes('analysis')) {
      this.updateLatestInsights();
    }
  }

  updateWorkspaceContext() {
    // Implementation would update workspace-context.json
    const contextPath = path.join(this.summariesPath, 'workspace-context.json');
    const context = {
      timestamp: new Date().toISOString(),
      lastUpdate: 'File watcher update',
      status: 'active'
    };
    
    if (!fs.existsSync(this.summariesPath)) {
      fs.mkdirSync(this.summariesPath, { recursive: true });
    }
    
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
  }

  updateLatestInsights() {
    // Implementation would update latest-insights.json
    const insightsPath = path.join(this.summariesPath, 'latest-insights.json');
    const insights = {
      timestamp: new Date().toISOString(),
      source: 'File watcher',
      recentChanges: true
    };
    
    fs.writeFileSync(insightsPath, JSON.stringify(insights, null, 2));
  }
}

// Start watcher if run directly
if (require.main === module) {
  const watcher = new AAIFileWatcher();
  watcher.start();
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\\n👋 Stopping file watcher...');
    process.exit(0);
  });
}

module.exports = AAIFileWatcher;
`;

    const watcherPath = path.join(this.agentsDir, 'cursor-integration', 'file-watcher.js');
    fs.writeFileSync(watcherPath, watcherScript);
    console.log(`  ✅ File watcher created: ${watcherPath}`);
  }

  /**
   * Create AAI-specific tasks for Cursor
   */
  async createAAITasks() {
    console.log('⚡ Creating AAI tasks...');

    const tasksPath = path.join(this.cursorDir, 'tasks.json');
    
    const tasks = {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "AAI: Start Agent",
          "type": "shell",
          "command": "npm",
          "args": ["run", "AAI:start"],
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "focus": false,
            "panel": "shared"
          },
          "problemMatcher": []
        },
        {
          "label": "AAI: Analyze Code",
          "type": "shell",
          "command": "npm",
          "args": ["run", "AAI:analyze"],
          "group": "test",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "focus": false,
            "panel": "shared"
          }
        },
        {
          "label": "AAI: Update Cursor Summaries",
          "type": "shell",
          "command": "npm",
          "args": ["run", "cursor:update-summaries"],
          "group": "build",
          "presentation": {
            "echo": true,
            "reveal": "silent",
            "focus": false,
            "panel": "shared"
          }
        },
        {
          "label": "AAI: Start File Watcher",
          "type": "shell",
          "command": "node",
          "args": ["agents/cursor-integration/file-watcher.js"],
          "group": "build",
          "isBackground": true,
          "presentation": {
            "echo": true,
            "reveal": "silent",
            "focus": false,
            "panel": "shared"
          }
        },
        {
          "label": "AAI: Memory Stats",
          "type": "shell",
          "command": "npm",
          "args": ["run", "AAI:memory-stats"],
          "group": "test",
          "presentation": {
            "echo": true,
            "reveal": "always",
            "focus": false,
            "panel": "shared"
          }
        }
      ]
    };

    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
    console.log(`  ✅ AAI tasks created: ${tasksPath}`);
  }

  /**
   * Update package.json with enhanced scripts
   */
  async updatePackageJson() {
    console.log('📦 Updating package.json...');

    const packagePath = 'package.json';
    
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add enhanced cursor integration scripts
        pkg.scripts = pkg.scripts || {};
        
        // Enhanced cursor scripts
        pkg.scripts['cursor:setup-enhanced'] = 'node agents/_store/scripts/enhanced-cursor-setup.js';
        pkg.scripts['cursor:update-summaries'] = 'node agents/cursor-integration/update-summaries.js';
        pkg.scripts['cursor:start-watcher'] = 'node agents/cursor-integration/file-watcher.js';
        pkg.scripts['cursor:test-integration'] = 'printf "Testing enhanced integration...\\n" && ls -la agents/_store/cursor-summaries/';
        pkg.scripts['cursor:status'] = 'node agents/_store/scripts/enhanced-cursor-setup.js status';
        
        // AAI Task Management scripts
        pkg.scripts['aai:task-init'] = 'node agents/_store/scripts/aai-task-manager.js init';
        pkg.scripts['aai:task-analyze'] = 'node agents/_store/scripts/aai-task-manager.js analyze';
        pkg.scripts['aai:task-execute'] = 'node agents/_store/scripts/aai-task-manager.js execute';
        pkg.scripts['aai:task-status'] = 'node agents/_store/scripts/aai-task-manager.js status';
        pkg.scripts['aai:task-auto-manage'] = 'node agents/_store/scripts/aai-task-manager.js auto-manage';
        
        // Cursor-AAI Integration scripts
        pkg.scripts['cursor:aai-init'] = 'node agents/_store/scripts/cursor-aai-integration.js init';
        pkg.scripts['cursor:aai-request'] = 'node agents/_store/scripts/cursor-aai-integration.js request';
        pkg.scripts['cursor:aai-quick'] = 'node agents/_store/scripts/cursor-aai-integration.js quick';
        pkg.scripts['cursor:aai-auto-manage'] = 'node agents/_store/scripts/cursor-aai-integration.js auto-manage';
        pkg.scripts['cursor:aai-status'] = 'node agents/_store/scripts/cursor-aai-integration.js status';
        
        // AAI enhancement scripts
        pkg.scripts['AAI:cursor-sync'] = 'npm run cursor:update-summaries && printf "Cursor sync complete\\n"';
        pkg.scripts['AAI:enhanced-start'] = 'npm run cursor:start-watcher & npm run AAI:start';
        pkg.scripts['AAI:task-workflow'] = 'npm run cursor:aai-init && npm run aai:task-auto-manage';
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        console.log('  ✅ Package.json updated with enhanced scripts');
      } catch (error) {
        console.warn('  ⚠️ Could not update package.json:', error.message);
      }
    }
  }

  /**
   * Generate initial summaries for Cursor
   */
  async generateInitialSummaries() {
    console.log('📋 Generating initial summaries...');

    const summariesPath = path.join(this.agentsDir, '_store', 'cursor-summaries');
    
    // Workspace context
    const workspaceContext = {
      timestamp: new Date().toISOString(),
      source: 'Enhanced Cursor Setup',
      version: this.version,
      workspace: this.workspaceRoot,
      aaiIntegration: {
        status: 'active',
        features: [
          'Enhanced file associations',
          'Intelligent search configuration',
          'Real-time file watching',
          'AAI-specific snippets',
          'Cursor AI context files',
          'Enhanced JSON schemas'
        ]
      },
      quickAccess: {
        memory: 'agents/_store/memory/',
        analysis: 'agents/_store/analysis/',
        core: 'agents/_core/',
        summaries: 'agents/_store/cursor-summaries/'
      },
      recommendations: [
        'Use Ctrl/Cmd+P to quickly find AAI files',
        'Check cursor-summaries/ for latest context',
        'Use AAI snippets for consistent formatting',
        'Enable file watcher for real-time updates'
      ]
    };

    fs.writeFileSync(
      path.join(summariesPath, 'workspace-context.json'),
      JSON.stringify(workspaceContext, null, 2)
    );

    // Latest insights placeholder
    const latestInsights = {
      timestamp: new Date().toISOString(),
      source: 'Enhanced Cursor Setup',
      insights: [
        'Enhanced Cursor integration active',
        'AAI file associations configured',
        'Intelligent search enabled',
        'Real-time monitoring ready'
      ],
      nextSteps: [
        'Start AAI agent with: npm run AAI:start',
        'Enable file watcher with: npm run cursor:start-watcher',
        'Test integration with: npm run cursor:test-integration'
      ]
    };

    fs.writeFileSync(
      path.join(summariesPath, 'latest-insights.json'),
      JSON.stringify(latestInsights, null, 2)
    );

    console.log('  ✅ Initial summaries generated');
  }

  /**
   * Show usage instructions
   */
  showUsageInstructions() {
    console.log('\n📖 ENHANCED CURSOR + AAI INTEGRATION READY!');
    console.log('━'.repeat(60));
    console.log('');
    console.log('🚀 QUICK START:');
    console.log('   1. npm run AAI:start                    # Start AAI agent');
    console.log('   2. npm run cursor:start-watcher         # Enable real-time sync');
    console.log('   3. Press Ctrl/Cmd+P → type "aai"       # Find AAI files instantly');
    console.log('');
    console.log('🎯 KEY FEATURES:');
    console.log('   ✅ Enhanced file associations for all AAI file types');
    console.log('   ✅ Intelligent search across AAI directories');
    console.log('   ✅ Real-time file watching and summaries');
    console.log('   ✅ AAI-specific code snippets');
    console.log('   ✅ Cursor AI context awareness');
    console.log('   ✅ Enhanced JSON schemas for validation');
    console.log('   ✅ Visual enhancements and file nesting');
    console.log('');
    console.log('📂 QUICK ACCESS:');
    console.log('   • agents/_store/cursor-summaries/       # Latest context');
    console.log('   • agents/_store/memory/                 # Agent memory');
    console.log('   • agents/_core/rules/                   # Development rules');
    console.log('   • .cursor/snippets/aai.json             # Code snippets');
    console.log('');
    console.log('⚡ TASKS (Ctrl/Cmd+Shift+P):');
    console.log('   • AAI: Start Agent');
    console.log('   • AAI: Analyze Code');
    console.log('   • AAI: Update Cursor Summaries');
    console.log('   • AAI: Start File Watcher');
    console.log('');
    console.log('🔧 MAINTENANCE:');
    console.log('   npm run cursor:status                   # Check integration status');
    console.log('   npm run cursor:update-summaries         # Refresh summaries');
    console.log('   npm run cursor:test-integration         # Test setup');
    console.log('');
    console.log('💡 TIP: Use "aai-" prefix in code for AAI snippets!');
  }

  /**
   * Show current status
   */
  static async showStatus() {
    console.log('📊 ENHANCED CURSOR + AAI INTEGRATION STATUS');
    console.log('━'.repeat(60));

    const files = {
      '.cursor/settings.json': 'Enhanced Cursor settings',
      '.cursor/rules/aai.md': 'AAI development rules',
      '.cursor/snippets/aai.json': 'AAI code snippets',
      '.cursor/tasks.json': 'AAI tasks',
      'agents/cursor-integration/file-watcher.js': 'File watcher',
      'agents/_store/cursor-summaries/workspace-context.json': 'Workspace context',
      'agents/_store/cursor-summaries/latest-insights.json': 'Latest insights'
    };

    console.log('\n📂 Integration Files:');
    Object.entries(files).forEach(([file, description]) => {
      const exists = fs.existsSync(file);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${description}`);
      console.log(`      ${file}`);
    });

    console.log('\n🎯 Integration Status: ' + 
      (Object.keys(files).every(f => fs.existsSync(f)) ? '✅ FULLY ACTIVE' : '⚠️ PARTIAL'));
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'setup';
  
  switch (command.toLowerCase()) {
    case 'setup':
      const setup = new EnhancedCursorSetup();
      setup.setup();
      break;
      
    case 'status':
      EnhancedCursorSetup.showStatus();
      break;
      
    default:
      console.log('❌ Unknown command:', command);
      console.log('Available commands: setup, status');
  }
}

module.exports = EnhancedCursorSetup; 
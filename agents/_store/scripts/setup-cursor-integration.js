#!/usr/bin/env node

/**
 * 🔧 Setup Cursor Integration with Existing agents/* Structure
 * 
 * This script configures Cursor to work with your existing AAI agent
 * files without requiring you to move or duplicate anything.
 */

const fs = require('fs');
const path = require('path');

class CursorIntegrationSetup {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.cursorDir = '.cursor';
    this.agentsDir = 'agents/_store';
  }

  /**
   * Main setup function
   */
  async setup() {
    console.log('🔧 Setting up Cursor integration with existing agents/* structure...\n');

    try {
      // 1. Create .cursor directory if it doesn't exist
      this.ensureCursorDirectory();

      // 2. Create Cursor settings for agents/* integration
      this.createCursorSettings();

      // 3. Create a bridge script for easy access
      this.createBridgeScript();

      // 4. Test the integration
      this.testIntegration();

      console.log('\n✅ Setup completed successfully!');
      console.log('\n📖 How to use:');
      console.log('   1. Cursor can now read all files in agents/_store/');
      console.log('   2. Use Ctrl/Cmd+P to search for .json files in agents/');
      console.log('   3. Run "npm run cursor:bridge" to generate summaries');
      console.log('   4. AAI analysis will be visible in Cursor automatically');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    }
  }

  ensureCursorDirectory() {
    if (!fs.existsSync(this.cursorDir)) {
      fs.mkdirSync(this.cursorDir, { recursive: true });
      console.log(`📁 Created ${this.cursorDir} directory`);
    } else {
      console.log(`📁 ${this.cursorDir} directory already exists`);
    }
  }

  createCursorSettings() {
    const settingsPath = path.join(this.cursorDir, 'settings.json');
    
    const settings = {
      // File associations for AAI files
      "files.associations": {
        "agents/**/*.json": "json",
        "agents/**/*.analysis": "json",
        "agents/**/*.memory": "json",
        "agents/**/*.mdc": "markdown"
      },
      
      // Make sure Cursor watches agents directory
      "files.watcherExclude": {
        "**/agents/_store/memory/**": false,
        "**/agents/_store/analysis/**": false,
        "**/agents/_store/projects/**": false
      },
      
      // Include agents directory in search
      "search.include": {
        "agents/_store/memory": true,
        "agents/_store/analysis": true,
        "agents/_store/projects": true
      },
      
      // Enable IntelliSense for JSON files in agents
      "json.schemas": [
        {
          "fileMatch": ["agents/**/*.json"],
          "schema": {
            "type": "object",
            "properties": {
              "timestamp": { "type": "string" },
              "source": { "type": "string" },
              "analysis": { "type": "object" },
              "improvements": { "type": "array" },
              "agentInsights": { "type": "object" }
            }
          }
        }
      ],
      
      // Quick suggestions for AAI-related content
      "editor.quickSuggestions": {
        "other": true,
        "comments": true,
        "strings": true
      }
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log(`⚙️ Created Cursor settings: ${settingsPath}`);
  }

  createBridgeScript() {
    const bridgeDir = 'agents/cursor-integration';
    const bridgePath = path.join(bridgeDir, 'bridge.js');

    // Create directory
    if (!fs.existsSync(bridgeDir)) {
      fs.mkdirSync(bridgeDir, { recursive: true });
      console.log(`📁 Created ${bridgeDir} directory`);
    }

    const bridgeScript = `#!/usr/bin/env node

/**
 * 🌉 AAI → Cursor Bridge
 * 
 * Reads existing AAI memory and analysis files and creates
 * Cursor-friendly summaries without moving the original files.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class AAICursorBridge {
  constructor() {
    this.memoryPath = 'agents/_store/memory';
    this.analysisPath = 'agents/_store/analysis';
    this.outputPath = 'agents/_store/cursor-summaries';
  }

  async generateCursorSummaries() {
    console.log('🌉 Generating Cursor summaries from existing AAI data...');

    // Ensure output directory
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    // Read agent memory
    const agentMemory = this.readMemoryFiles(path.join(this.memoryPath, 'agent'));
    const projectMemory = this.readMemoryFiles(path.join(this.memoryPath, 'project'));

    // Generate workspace context
    const workspaceContext = {
      timestamp: new Date().toISOString(),
      source: 'AAI Agent → Cursor Bridge',
      workspace: process.cwd(),
      agentMemory: {
        totalEntries: agentMemory.length,
        recentLearning: agentMemory.slice(-5),
        patterns: this.extractPatterns(agentMemory)
      },
      projectMemory: {
        totalEntries: projectMemory.length,
        recentAnalysis: projectMemory.slice(-5),
        focusAreas: this.extractFocusAreas(projectMemory)
      },
      recommendations: this.generateRecommendations(agentMemory, projectMemory)
    };

    // Write summaries
    fs.writeFileSync(
      path.join(this.outputPath, 'workspace-context.json'),
      JSON.stringify(workspaceContext, null, 2)
    );

    fs.writeFileSync(
      path.join(this.outputPath, 'latest-insights.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        agentInsights: agentMemory.slice(-10),
        projectInsights: projectMemory.slice(-10)
      }, null, 2)
    );

    console.log(\`📋 Summaries generated in: \$\{this.outputPath\}\`);
    console.log('🔍 Files created:');
    console.log('   - workspace-context.json (overall context)');
    console.log('   - latest-insights.json (recent analysis)');
  }

  readMemoryFiles(dirPath) {
    const memories = [];
    
    if (!fs.existsSync(dirPath)) {
      return memories;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
        memories.push({
          file,
          ...content
        });
      } catch (error) {
        console.warn(\`⚠️ Could not read \$\{file\}: \$\{error.message\}\`);
      }
    });

    return memories.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }

  extractPatterns(memories) {
    const patterns = new Set();
    memories.forEach(memory => {
      if (memory.metadata && memory.metadata.type) {
        patterns.add(memory.metadata.type);
      }
    });
    return Array.from(patterns);
  }

  extractFocusAreas(memories) {
    const areas = new Set();
    memories.forEach(memory => {
      if (memory.metadata && memory.metadata.fileName) {
        const ext = path.extname(memory.metadata.fileName);
        areas.add(ext || 'unknown');
      }
    });
    return Array.from(areas);
  }

  generateRecommendations(agentMemory, projectMemory) {
    return {
      immediate: [
        'Use Cursor to explore agents/_store/memory/ for insights',
        'Check workspace-context.json for current focus areas',
        'Review latest-insights.json for recent analysis'
      ],
      planning: [
        'Set up file watchers for real-time AAI updates',
        'Create custom Cursor snippets based on AAI patterns',
        'Use AAI recommendations in code reviews'
      ]
    };
  }
}

// Run if called directly
if (require.main === module) {
  const bridge = new AAICursorBridge();
  bridge.generateCursorSummaries();
}

module.exports = AAICursorBridge;
`;

    fs.writeFileSync(bridgePath, bridgeScript);
    console.log(`🌉 Created bridge script: ${bridgePath}`);

    // Make it executable
    try {
      fs.chmodSync(bridgePath, '755');
    } catch (error) {
      // chmod might not work on all systems, that's okay
    }
  }

  testIntegration() {
    console.log('\n🧪 Testing integration...');

    // Check if agents directory exists
    if (fs.existsSync(this.agentsDir)) {
      console.log('✅ agents/_store directory found');
      
      // Check for memory files
      const memoryDir = path.join(this.agentsDir, 'memory');
      if (fs.existsSync(memoryDir)) {
        const agentMemoryDir = path.join(memoryDir, 'agent');
        const projectMemoryDir = path.join(memoryDir, 'project');
        
        const agentFiles = fs.existsSync(agentMemoryDir) ? fs.readdirSync(agentMemoryDir).length : 0;
        const projectFiles = fs.existsSync(projectMemoryDir) ? fs.readdirSync(projectMemoryDir).length : 0;
        
        console.log(`📊 Found \$\{agentFiles\} agent memory files`);
        console.log(`📊 Found ${projectFiles} project memory files`);
      } else {
        console.log('ℹ️ No memory directory found yet (will be created when AAI runs)');
      }
    } else {
      console.log('ℹ️ agents/_store directory will be created when AAI runs');
    }

    console.log('✅ Cursor integration ready!');
  }

  /**
   * Update package.json with cursor integration scripts
   */
  updatePackageJson() {
    const packagePath = 'package.json';
    
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add cursor integration scripts
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['cursor:bridge'] = 'node agents/cursor-integration/bridge.js';
        pkg.scripts['cursor:setup'] = 'node setup-cursor-integration.js';
        pkg.scripts['cursor:test'] = 'printf "Testing Cursor integration...\\n" && ls -la agents/_store/';
        
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
        console.log('📦 Updated package.json with cursor integration scripts');
      } catch (error) {
        console.warn('⚠️ Could not update package.json:', error.message);
      }
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new CursorIntegrationSetup();
  setup.setup().then(() => {
    setup.updatePackageJson();
  });
}

module.exports = CursorIntegrationSetup; 
#!/usr/bin/env node

/**
 * 🔄 Agents Architecture Integration Script
 * 
 * This script integrates the migrated .cursor content with the agents architecture
 * by updating all references, configurations, and ensuring proper file structure.
 */

const fs = require('fs');
const path = require('path');

class AgentsArchitectureIntegrator {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = `agents/_store/logs/integration-${this.timestamp}.log`;
    this.results = {
      filesUpdated: 0,
      pathsFixed: 0,
      integrationSteps: 0,
      errors: []
    };
    
    // Ensure logs directory exists
    if (!fs.existsSync('agents/_store/logs')) {
      fs.mkdirSync('agents/_store/logs', { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async integrate() {
    try {
      this.log('🚀 Starting Agents Architecture Integration...');
      
      // Step 1: Update Agent AI configuration
      await this.updateAgentConfiguration();
      
      // Step 2: Update file manager to recognize new structure
      await this.updateFileManager();
      
      // Step 3: Update project memory to reference new paths
      await this.updateProjectMemory();
      
      // Step 4: Fix all .cursor references in the migrated content
      await this.fixCursorReferences();
      
      // Step 5: Update Agent AI core files to integrate new structure
      await this.updateAgentAICore();
      
      // Step 6: Create integration manifest
      await this.createIntegrationManifest();
      
      this.log('✅ Agents Architecture Integration completed!');
      return this.results;
      
    } catch (error) {
      this.log(`❌ Integration failed: ${error.message}`);
      this.results.errors.push(error.message);
      throw error;
    }
  }

  async updateAgentConfiguration() {
    this.log('📝 Step 1: Updating Agent AI configuration...');
    
    const configPath = 'agents/self-improvement/config/default.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Add core framework path to configuration
      config.coreFramework = {
        path: 'agents/_store/projects/_core',
        rulesPath: 'agents/_store/projects/_core/rules',
        workflowPath: 'agents/_store/projects/_core/rules/01__AI-RUN',
        templatesPath: 'agents/_store/projects/_core/rules/02__AI-DOCS',
        specsPath: 'agents/_store/projects/_core/rules/03__SPECS'
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      this.log('✅ Updated Agent AI configuration with core framework paths');
      this.results.integrationSteps++;
    }
  }

  async updateFileManager() {
    this.log('📁 Step 2: Updating File Manager integration...');
    
    const fileManagerPath = 'agents/self-improvement/core/fileManager.js';
    if (fs.existsSync(fileManagerPath)) {
      let content = fs.readFileSync(fileManagerPath, 'utf8');
      
      // Add core framework access methods
      const coreFrameworkMethods = `
  /**
   * Get core framework path
   */
  getCoreFrameworkPath() {
    return path.resolve('agents/_store/projects/_core');
  }

  /**
   * Access core workflow files
   */
  getCoreWorkflowFiles() {
    const workflowPath = path.join(this.getCoreFrameworkPath(), 'rules/01__AI-RUN');
    return this.listFiles(workflowPath, '.mdc');
  }

  /**
   * Access core templates
   */
  getCoreTemplates() {
    const templatesPath = path.join(this.getCoreFrameworkPath(), 'rules/02__AI-DOCS');
    return this.listFiles(templatesPath, '.mdc');
  }

  /**
   * Access core specifications
   */
  getCoreSpecs() {
    const specsPath = path.join(this.getCoreFrameworkPath(), 'rules/03__SPECS');
    return this.listFiles(specsPath, '.mdc');
  }
`;
      
      // Insert before the last closing brace
      const lastBraceIndex = content.lastIndexOf('}');
      content = content.slice(0, lastBraceIndex) + coreFrameworkMethods + '\n}';
      
      fs.writeFileSync(fileManagerPath, content);
      this.log('✅ Updated File Manager with core framework integration');
      this.results.integrationSteps++;
    }
  }

  async updateProjectMemory() {
    this.log('🧠 Step 3: Updating Project Memory integration...');
    
    const memoryManagerPath = 'agents/self-improvement/core/memory.js';
    if (fs.existsSync(memoryManagerPath)) {
      let content = fs.readFileSync(memoryManagerPath, 'utf8');
      
      // Add core framework memory integration
      const memoryIntegration = `
  /**
   * Store core framework learning
   */
  async storeCoreFrameworkLearning(pattern, context = {}) {
    const metadata = {
      type: 'core_framework',
      source: 'agents/_store/projects/_core',
      ...context,
      timestamp: Date.now()
    };
    
    return await this.storeAgentMemory('core_learning', JSON.stringify(pattern), metadata);
  }

  /**
   * Retrieve core framework patterns
   */
  async getCoreFrameworkPatterns(query) {
    const memories = await this.searchAgentMemory(query, {
      filter: { type: 'core_framework' },
      limit: 10
    });
    
    return memories.map(memory => JSON.parse(memory.content));
  }
`;
      
      // Insert before the last closing brace
      const lastBraceIndex = content.lastIndexOf('}');
      content = content.slice(0, lastBraceIndex) + memoryIntegration + '\n}';
      
      fs.writeFileSync(memoryManagerPath, content);
      this.log('✅ Updated Memory Manager with core framework integration');
      this.results.integrationSteps++;
    }
  }

  async fixCursorReferences() {
    this.log('🔧 Step 4: Fixing .cursor references in migrated content...');
    
    const coreDir = 'agents/_store/projects/_core';
    const files = this.findAllMdcFiles(coreDir);
    
    for (const filePath of files) {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      
      // Replace .cursor/rules/ with relative paths within the _core structure
      content = this.fixPathReferences(content, filePath);
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.results.filesUpdated++;
        this.log(`✅ Fixed references in ${filePath}`);
      }
    }
    
    this.log(`✅ Fixed references in ${this.results.filesUpdated} files`);
    this.results.integrationSteps++;
  }

  fixPathReferences(content, currentFilePath) {
    const currentDir = path.dirname(currentFilePath);
    const coreRulesPath = 'agents/_store/projects/_core/rules';
    
    // Calculate relative position within _core structure
    const relativeToCore = path.relative(coreRulesPath, currentDir);
    
    // Replace .cursor/rules/ references with proper relative paths
    content = content.replace(/\.cursor\/rules\/([^\s\)\]\,\;]+)/g, (match, targetPath) => {
      if (relativeToCore === '') {
        // We're in the rules directory
        return targetPath;
      } else if (relativeToCore.startsWith('..')) {
        // We're outside rules directory
        return path.join('rules', targetPath).replace(/\\/g, '/');
      } else {
        // We're in a subdirectory of rules
        const depth = relativeToCore.split(path.sep).length;
        const backtrack = '../'.repeat(depth);
        return (backtrack + targetPath).replace(/\\/g, '/');
      }
    });
    
    // Fix markdown links
    content = content.replace(/\[([^\]]+)\]\(\.cursor\/rules\/([^)]+)\)/g, (match, text, targetPath) => {
      const relativePath = this.calculateRelativePath(currentDir, targetPath);
      return `[${text}](${relativePath})`;
    });
    
    this.results.pathsFixed++;
    return content;
  }

  calculateRelativePath(currentDir, targetPath) {
    const coreRulesPath = 'agents/_store/projects/_core/rules';
    const relativeToCore = path.relative(coreRulesPath, currentDir);
    
    if (relativeToCore === '') {
      return targetPath;
    } else if (relativeToCore.startsWith('..')) {
      return path.join('rules', targetPath).replace(/\\/g, '/');
    } else {
      const depth = relativeToCore.split(path.sep).length;
      const backtrack = '../'.repeat(depth);
      return (backtrack + targetPath).replace(/\\/g, '/');
    }
  }

  async updateAgentAICore() {
    this.log('🤖 Step 5: Updating Agent AI core integration...');
    
    const analyzerPath = 'agents/self-improvement/core/analyzer.js';
    if (fs.existsSync(analyzerPath)) {
      let content = fs.readFileSync(analyzerPath, 'utf8');
      
      // Add core framework analysis methods
      const coreAnalysisMethods = `
  /**
   * Analyze core framework files
   */
  async analyzeCoreFramework() {
    const coreFrameworkPath = 'agents/_store/projects/_core';
    const workflowFiles = this.findFiles(path.join(coreFrameworkPath, 'rules/01__AI-RUN'), '.mdc');
    
    const analysis = {
      workflowStages: workflowFiles.length,
      templates: this.findFiles(path.join(coreFrameworkPath, 'rules/02__AI-DOCS'), '.mdc').length,
      specifications: this.findFiles(path.join(coreFrameworkPath, 'rules/03__SPECS'), '.mdc').length,
      totalFiles: this.findFiles(coreFrameworkPath, '.mdc').length
    };
    
    return analysis;
  }

  /**
   * Get core framework suggestions
   */
  async getCoreFrameworkSuggestions(context) {
    const coreAnalysis = await this.analyzeCoreFramework();
    
    return {
      framework: 'Agentic Coding Framework',
      version: '2.0',
      location: 'agents/_store/projects/_core',
      analysis: coreAnalysis,
      recommendations: [
        'Use core workflow templates for new projects',
        'Reference established patterns from core framework',
        'Leverage proven specifications and documentation templates'
      ]
    };
  }
`;
      
      // Insert before the last closing brace
      const lastBraceIndex = content.lastIndexOf('}');
      content = content.slice(0, lastBraceIndex) + coreAnalysisMethods + '\n}';
      
      fs.writeFileSync(analyzerPath, content);
      this.log('✅ Updated Analyzer with core framework integration');
      this.results.integrationSteps++;
    }
  }

  findAllMdcFiles(directory) {
    const files = [];
    
    if (!fs.existsSync(directory)) {
      return files;
    }
    
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory()) {
        files.push(...this.findAllMdcFiles(fullPath));
      } else if (item.name.endsWith('.mdc')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async createIntegrationManifest() {
    this.log('📋 Step 6: Creating integration manifest...');
    
    const manifest = {
      integrationTimestamp: this.timestamp,
      coreFrameworkLocation: 'agents/_store/projects/_core',
      integration: {
        agentConfiguration: '✅ Updated',
        fileManager: '✅ Integrated',
        projectMemory: '✅ Enhanced',
        pathReferences: '✅ Fixed',
        agentAICore: '✅ Updated'
      },
      statistics: this.results,
      structure: {
        rules: 'agents/_store/projects/_core/rules',
        workflows: 'agents/_store/projects/_core/rules/01__AI-RUN',
        templates: 'agents/_store/projects/_core/rules/02__AI-DOCS',
        specifications: 'agents/_store/projects/_core/rules/03__SPECS',
        projects: 'agents/_store/projects/_core/rules/projet'
      },
      commands: {
        access: 'agents > analyze _core',
        workflow: 'agents > context "core-framework"',
        templates: 'agents > dependencies analyze _core'
      }
    };
    
    const manifestPath = 'agents/_store/projects/_core/INTEGRATION_MANIFEST.json';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    this.log('✅ Integration manifest created');
    this.results.integrationSteps++;
  }
}

// Export for use as module
module.exports = AgentsArchitectureIntegrator;

// CLI usage
if (require.main === module) {
  const integrator = new AgentsArchitectureIntegrator();
  integrator.integrate().then(results => {
    console.log('\n🎉 Integration Results:', results);
  }).catch(console.error);
} 
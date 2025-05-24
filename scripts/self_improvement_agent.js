#!/usr/bin/env node

/**
 * 🧠 Interactive Self-Improvement Agent - Context-Aware Framework Enhancement
 * 
 * This agent analyzes specific .mdc files when you interact with them,
 * providing targeted improvements based on your current work context.
 */

const fs = require('fs').promises;
const path = require('path');

class InteractiveSelfImprovementAgent {
  constructor() {
    this.rulesPath = '.cursor/rules';
    this.knowledgeBase = new Map();
    this.improvementHistory = [];
    this.currentContext = null;
    
    // Focused detection patterns
    this.obsolescencePatterns = {
      'React 16': 'Consider upgrading to React 18+ for better performance',
      'Node.js 14': 'Node.js 16+ is recommended for security updates', 
      'TypeScript 4.0': 'TypeScript 5.0+ offers significant improvements',
      'class component': 'Consider functional components with hooks',
      'componentWillMount': 'Use useEffect hook instead'
    };
    
    this.criticalIssues = [
      'Missing error handling',
      'No input validation', 
      'Missing security considerations',
      'No examples provided'
    ];
  }

  /**
   * Start interactive mode - lightweight startup
   */
  async start() {
    console.log('🧠 Interactive Self-Improvement Agent ready!');
    console.log('💡 I will analyze files as you work with them.\n');
    
    // Show available commands
    this.showCommands();
    
    // Set up command line interface
    this.setupInteractiveMode();
  }

  /**
   * Show available commands
   */
  showCommands() {
    console.log('📋 Available Commands:');
    console.log('  analyze <filename>     - Analyze specific .mdc file');
    console.log('  improve <filename>     - Get improvement suggestions');
    console.log('  context <topic>        - Set current work context');
    console.log('  smart-detect           - Analyze based on current context');
    console.log('  help                   - Show this help');
    console.log('  exit                   - Stop the agent\n');
  }

  /**
   * Set up interactive command mode
   */
  setupInteractiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 > '
    });

    rl.prompt();

    rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      
      if (command === 'exit') {
        console.log('👋 Self-Improvement Agent shutting down...');
        rl.close();
        return;
      }
      
      await this.handleCommand(command);
      rl.prompt();
    });

    rl.on('close', () => {
      process.exit(0);
    });
  }

  /**
   * Handle user commands
   */
  async handleCommand(command) {
    const [action, ...args] = command.split(' ');
    
    switch (action) {
      case 'analyze':
        if (args.length === 0) {
          console.log('❌ Please specify a filename: analyze <filename>');
          return;
        }
        await this.analyzeSpecificFile(args[0]);
        break;
        
      case 'improve':
        if (args.length === 0) {
          console.log('❌ Please specify a filename: improve <filename>');
          return;
        }
        await this.getImprovementSuggestions(args[0]);
        break;
        
      case 'context':
        if (args.length === 0) {
          console.log('❌ Please specify a context: context <topic>');
          return;
        }
        this.setContext(args.join(' '));
        break;
        
      case 'smart-detect':
        await this.smartContextDetection();
        break;
        
      case 'help':
        this.showCommands();
        break;
        
      default:
        console.log('❌ Unknown command. Type "help" for available commands.');
    }
  }

  /**
   * Analyze a specific file requested by user
   */
  async analyzeSpecificFile(filename) {
    console.log(`🔍 Analyzing: ${filename}`);
    
    // Find the file in the rules directory
    const filePath = await this.findFile(filename);
    if (!filePath) {
      console.log(`❌ File not found: ${filename}`);
      return;
    }
    
    try {
      const improvements = await this.analyzeFile(filePath);
      
      if (improvements.length === 0) {
        console.log('✅ No immediate improvements detected!');
        return;
      }
      
      console.log(`\n📊 Found ${improvements.length} improvement opportunities:\n`);
      improvements.forEach((improvement, index) => {
        this.displayImprovement(improvement, index + 1);
      });
      
    } catch (error) {
      console.error(`❌ Error analyzing file: ${error.message}`);
    }
  }

  /**
   * Get specific improvement suggestions for a file
   */
  async getImprovementSuggestions(filename) {
    console.log(`💡 Getting improvement suggestions for: ${filename}`);
    
    const filePath = await this.findFile(filename);
    if (!filePath) {
      console.log(`❌ File not found: ${filename}`);
      return;
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const suggestions = await this.generateSmartSuggestions(content, filePath);
      
      if (suggestions.length === 0) {
        console.log('✨ This file looks good! No suggestions at the moment.');
        return;
      }
      
      console.log('\n🎯 Smart Improvement Suggestions:\n');
      suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.title}`);
        console.log(`   💡 ${suggestion.description}`);
        console.log(`   🔧 Implementation: ${suggestion.implementation}\n`);
      });
      
    } catch (error) {
      console.error(`❌ Error getting suggestions: ${error.message}`);
    }
  }

  /**
   * Set current work context
   */
  setContext(context) {
    this.currentContext = context;
    console.log(`🎯 Context set to: "${context}"`);
    console.log('💡 Use "smart-detect" to analyze files relevant to this context.');
  }

  /**
   * Smart detection based on current context
   */
  async smartContextDetection() {
    if (!this.currentContext) {
      console.log('❌ No context set. Use "context <topic>" first.');
      return;
    }
    
    console.log(`🎯 Smart detection for context: "${this.currentContext}"`);
    
    // Find files relevant to current context
    const relevantFiles = await this.findRelevantFiles(this.currentContext);
    
    if (relevantFiles.length === 0) {
      console.log('🔍 No files found matching current context.');
      return;
    }
    
    console.log(`📁 Found ${relevantFiles.length} relevant files:`);
    relevantFiles.forEach(file => console.log(`   • ${file}`));
    
    // Analyze most relevant file
    console.log(`\n🔍 Analyzing most relevant file: ${relevantFiles[0]}`);
    await this.analyzeSpecificFile(path.basename(relevantFiles[0]));
  }

  /**
   * Find files relevant to current context
   */
  async findRelevantFiles(context) {
    const allFiles = await this.getAllMdcFiles();
    const relevantFiles = [];
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const filename = path.basename(file).toLowerCase();
        
        // Check if file is relevant to context
        if (content.toLowerCase().includes(context.toLowerCase()) ||
            filename.includes(context.toLowerCase())) {
          relevantFiles.push(file);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return relevantFiles;
  }

  /**
   * Find a specific file in the rules directory
   */
  async findFile(filename) {
    // If filename already has .mdc extension, use as is
    const searchName = filename.endsWith('.mdc') ? filename : `${filename}.mdc`;
    
    const allFiles = await this.getAllMdcFiles();
    
    // Find exact match or partial match
    const exactMatch = allFiles.find(file => 
      path.basename(file).toLowerCase() === searchName.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const partialMatch = allFiles.find(file => 
      path.basename(file).toLowerCase().includes(filename.toLowerCase())
    );
    
    return partialMatch;
  }

  /**
   * Get all .mdc files (cached for performance)
   */
  async getAllMdcFiles() {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.mdc')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that don't exist
      }
    }
    
    await scanDirectory(this.rulesPath);
    return files;
  }

  /**
   * Analyze a file for improvements (focused analysis)
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const improvements = [];
      
      // Quick critical issue detection
      const criticalIssues = this.detectCriticalIssues(content, filePath);
      improvements.push(...criticalIssues);
      
      // Check for obsolete patterns (only most important ones)
      const obsoleteIssues = this.detectObsoleteContent(content, filePath);
      improvements.push(...obsoleteIssues.slice(0, 3)); // Limit to top 3
      
      return improvements;
      
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Detect critical issues that need immediate attention
   */
  detectCriticalIssues(content, filePath) {
    const improvements = [];
    
    // Missing examples
    if (content.includes('```') === false && content.length > 500) {
      improvements.push({
        type: 'missing_examples',
        file: filePath,
        issue: 'No code examples found',
        suggestion: 'Add practical code examples to improve usability',
        priority: 'high'
      });
    }
    
    // Missing error handling in code examples
    if (content.includes('fetch(') && !content.includes('catch')) {
      improvements.push({
        type: 'missing_error_handling',
        file: filePath,
        issue: 'Code examples missing error handling',
        suggestion: 'Add error handling to all fetch/async examples',
        priority: 'high'
      });
    }
    
    return improvements;
  }

  /**
   * Detect obsolete content (focused on most important)
   */
  detectObsoleteContent(content, filePath) {
    const improvements = [];
    
    Object.entries(this.obsolescencePatterns).forEach(([pattern, suggestion]) => {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        improvements.push({
          type: 'obsolete_technology',
          file: filePath,
          pattern: pattern,
          suggestion: suggestion,
          priority: 'medium',
          location: this.findPatternLocation(content, pattern)
        });
      }
    });
    
    return improvements;
  }

  /**
   * Generate smart, context-aware suggestions
   */
  async generateSmartSuggestions(content, filePath) {
    const suggestions = [];
    
    // Context-aware suggestions based on file type
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('getting_started')) {
      suggestions.push({
        title: 'Add Quick Start Section',
        description: 'Getting started files should have a 30-second quick start',
        implementation: 'Add a ## Quick Start section with minimal setup steps'
      });
    }
    
    if (filename.includes('agent') || filename.includes('ai')) {
      suggestions.push({
        title: 'Add Prompt Engineering Examples',
        description: 'AI-related files benefit from concrete prompt examples',
        implementation: 'Include 2-3 example prompts with expected outputs'
      });
    }
    
    // Content-based suggestions
    if (content.includes('TODO') || content.includes('TBD')) {
      suggestions.push({
        title: 'Complete Placeholder Content',
        description: 'Found TODO/TBD markers that need completion',
        implementation: 'Search for TODO/TBD and replace with actual content'
      });
    }
    
    return suggestions;
  }

  /**
   * Find pattern location in content
   */
  findPatternLocation(content, pattern) {
    const lines = content.split('\n');
    const lineNumber = lines.findIndex(line => 
      line.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return lineNumber >= 0 ? `Line ${lineNumber + 1}` : 'Unknown';
  }

  /**
   * Display improvement in user-friendly format
   */
  displayImprovement(improvement, index) {
    const emoji = {
      'high': '🚨',
      'medium': '⚠️', 
      'low': 'ℹ️'
    }[improvement.priority] || 'ℹ️';
    
    console.log(`${emoji} ${index}. ${improvement.type.replace(/_/g, ' ').toUpperCase()}`);
    
    if (improvement.issue) {
      console.log(`   Issue: ${improvement.issue}`);
    }
    
    if (improvement.pattern) {
      console.log(`   Pattern: ${improvement.pattern}`);
    }
    
    if (improvement.location) {
      console.log(`   Location: ${improvement.location}`);
    }
    
    console.log(`   💡 ${improvement.suggestion}\n`);
  }
}

// Command line interface
if (require.main === module) {
  const agent = new InteractiveSelfImprovementAgent();
  
  process.on('SIGINT', () => {
    console.log('\n👋 Interactive Self-Improvement Agent shutting down...');
    process.exit(0);
  });
  
  agent.start().catch(console.error);
}

module.exports = InteractiveSelfImprovementAgent; 
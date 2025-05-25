/**
 * 📍 Context Manager - Work context tracking and management
 * 
 * Manages user work context and finds relevant files
 */

class ContextManager {
  constructor() {
    this.currentContext = null;
    this.contextHistory = [];
    this.contextMappings = new Map();
    this.relevantFiles = [];
  }

  /**
   * Set current work context
   */
  setContext(context) {
    this.currentContext = context.toLowerCase();
    
    // Add to history if not already present
    if (!this.contextHistory.includes(this.currentContext)) {
      this.contextHistory.push(this.currentContext);
      
      // Keep only last 10 contexts
      if (this.contextHistory.length > 10) {
        this.contextHistory.shift();
      }
    }
  }

  /**
   * Get current context
   */
  getCurrentContext() {
    return this.currentContext;
  }

  /**
   * Get context history
   */
  getContextHistory() {
    return [...this.contextHistory];
  }

  /**
   * Map context to relevant file patterns
   */
  mapContextToPatterns(context) {
    const patterns = {
      // Workflow contexts
      'workflow': ['workflow', 'process', 'step', 'phase'],
      'autopilot': ['autopilot', 'automation', 'orchestrat'],
      'testing': ['test', 'qa', 'quality', 'validation'],
      'deployment': ['deploy', 'production', 'release'],
      
      // Development contexts  
      'frontend': ['ui', 'component', 'react', 'next', 'tailwind'],
      'backend': ['api', 'server', 'database', 'supabase'],
      'fullstack': ['frontend', 'backend', 'api', 'database'],
      
      // Documentation contexts
      'documentation': ['doc', 'guide', 'readme', 'template'],
      'specs': ['spec', 'requirement', 'feature', 'epic'],
      'architecture': ['architecture', 'design', 'structure'],
      
      // Agent contexts
      'agent': ['agent', 'ai', 'automation', 'assistant'],
      'improvement': ['improve', 'enhance', 'optimize', 'refactor'],
      'analysis': ['analyze', 'detect', 'pattern', 'issue']
    };

    const contextKey = Object.keys(patterns).find(key => 
      context.includes(key) || patterns[key].some(pattern => context.includes(pattern))
    );

    return patterns[contextKey] || [context];
  }

  /**
   * Find files relevant to current context
   */
  async findContextRelevantFiles(analyzer) {
    if (!this.currentContext) {
      return [];
    }

    const patterns = this.mapContextToPatterns(this.currentContext);
    const allFiles = await analyzer.getAllMdcFiles();
    const relevantFiles = [];

    for (const file of allFiles) {
      const relevanceScore = await this.calculateRelevanceScore(file, patterns, analyzer);
      
      if (relevanceScore > 0) {
        relevantFiles.push({
          path: file,
          relevanceScore,
          matchedPatterns: patterns
        });
      }
    }

    // Sort by relevance score (highest first)
    relevantFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    this.relevantFiles = relevantFiles;
    return relevantFiles;
  }

  /**
   * Calculate how relevant a file is to the current context
   */
  async calculateRelevanceScore(filePath, patterns, analyzer) {
    let score = 0;
    const fileName = filePath.toLowerCase();
    
    try {
      const content = await require('fs').promises.readFile(filePath, 'utf8');
      const contentLower = content.toLowerCase();
      
      // File name matching (high weight)
      patterns.forEach(pattern => {
        if (fileName.includes(pattern)) {
          score += 3;
        }
      });
      
      // Content matching (medium weight)
      patterns.forEach(pattern => {
        const matches = (contentLower.match(new RegExp(pattern, 'g')) || []).length;
        score += matches * 0.5;
      });
      
      // Special file type bonuses
      if (fileName.includes('workflow') && patterns.includes('workflow')) {
        score += 2;
      }
      
      if (fileName.includes('agent') && patterns.includes('agent')) {
        score += 2;
      }
      
      // Recent modification bonus (files modified recently are more relevant)
      const stats = await require('fs').promises.stat(filePath);
      const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceModified < 7) {
        score += 1; // Recent files get bonus
      }
      
    } catch (error) {
      // If we can't read the file, it gets no score
      return 0;
    }
    
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get suggested contexts based on file analysis
   */
  suggestContexts(filePaths) {
    const suggestions = new Set();
    
    filePaths.forEach(filePath => {
      const fileName = filePath.toLowerCase();
      
      // Analyze filename for context clues
      if (fileName.includes('workflow')) suggestions.add('workflow');
      if (fileName.includes('test')) suggestions.add('testing');
      if (fileName.includes('deploy')) suggestions.add('deployment');
      if (fileName.includes('agent')) suggestions.add('agent');
      if (fileName.includes('improve')) suggestions.add('improvement');
      if (fileName.includes('doc')) suggestions.add('documentation');
      if (fileName.includes('spec')) suggestions.add('specs');
      if (fileName.includes('ui') || fileName.includes('component')) suggestions.add('frontend');
      if (fileName.includes('api') || fileName.includes('server')) suggestions.add('backend');
    });
    
    return Array.from(suggestions);
  }

  /**
   * Reset context
   */
  clearContext() {
    this.currentContext = null;
    this.relevantFiles = [];
  }

  /**
   * Get context analytics
   */
  getContextAnalytics() {
    return {
      currentContext: this.currentContext,
      historyLength: this.contextHistory.length,
      relevantFilesCount: this.relevantFiles.length,
      topContexts: this.getTopContexts()
    };
  }

  /**
   * Get most frequently used contexts
   */
  getTopContexts() {
    const frequency = {};
    
    this.contextHistory.forEach(context => {
      frequency[context] = (frequency[context] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([context, count]) => ({ context, count }));
  }
}

module.exports = ContextManager; 
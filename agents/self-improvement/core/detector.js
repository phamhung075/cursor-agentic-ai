/**
 * 🎯 Pattern Detector - Issue and obsolescence detection
 * 
 * Responsible for detecting various types of issues in content
 */

class PatternDetector {
  constructor(config) {
    this.patterns = config.patterns;
    this.detectionRules = config.detectionRules;
  }

  /**
   * Detect critical issues that need immediate attention
   */
  detectCriticalIssues(content, filePath) {
    const issues = [];
    
    // Security patterns
    this.patterns.security.forEach(pattern => {
      if (content.includes(pattern.text)) {
        issues.push({
          type: 'CRITICAL',
          category: 'Security',
          issue: pattern.issue,
          suggestion: pattern.fix,
          line: this.findLineNumber(content, pattern.text),
          priority: 'HIGH'
        });
      }
    });
    
    // Broken syntax patterns
    this.patterns.syntax.forEach(pattern => {
      if (content.match(pattern.regex)) {
        issues.push({
          type: 'CRITICAL',
          category: 'Syntax',
          issue: pattern.issue,
          suggestion: pattern.fix,
          priority: 'HIGH'
        });
      }
    });
    
    return issues;
  }

  /**
   * Detect obsolete content and outdated patterns
   */
  detectObsoleteContent(content, filePath) {
    const issues = [];
    
    // Technology obsolescence
    Object.entries(this.patterns.obsolete.technology).forEach(([tech, message]) => {
      if (content.includes(tech)) {
        issues.push({
          type: 'OBSOLETE',
          category: 'Technology',
          issue: `Outdated reference to ${tech}`,
          suggestion: message,
          line: this.findLineNumber(content, tech),
          priority: 'MEDIUM'
        });
      }
    });
    
    // Deprecated APIs
    Object.entries(this.patterns.obsolete.apis).forEach(([api, replacement]) => {
      if (content.includes(api)) {
        issues.push({
          type: 'OBSOLETE',
          category: 'API',
          issue: `Deprecated API: ${api}`,
          suggestion: replacement,
          line: this.findLineNumber(content, api),
          priority: 'MEDIUM'
        });
      }
    });
    
    // Best practice violations
    this.patterns.bestPractices.forEach(practice => {
      if (content.match(practice.antiPattern)) {
        issues.push({
          type: 'IMPROVEMENT',
          category: 'Best Practice',
          issue: practice.issue,
          suggestion: practice.betterApproach,
          priority: 'LOW'
        });
      }
    });
    
    return issues;
  }

  /**
   * Detect missing content or gaps
   */
  detectMissingContent(content, filePath) {
    const issues = [];
    const fileName = filePath.split('/').pop();
    
    // Check for missing sections based on file type
    if (fileName.includes('workflow') || fileName.includes('Workflow')) {
      if (!content.includes('## Prerequisites')) {
        issues.push({
          type: 'MISSING',
          category: 'Structure',
          issue: 'Missing Prerequisites section',
          suggestion: 'Add prerequisites section for better user guidance',
          priority: 'MEDIUM'
        });
      }
      
      if (!content.includes('## Error Handling')) {
        issues.push({
          type: 'MISSING',
          category: 'Structure',
          issue: 'Missing Error Handling section',
          suggestion: 'Add error handling guidance',
          priority: 'LOW'
        });
      }
    }
    
    return issues;
  }

  /**
   * Detect inconsistencies in the content
   */
  detectInconsistencies(content, filePath) {
    const issues = [];
    
    // Check for inconsistent terminology
    this.patterns.terminology.forEach(term => {
      const variations = content.match(new RegExp(term.pattern, 'gi')) || [];
      if (variations.length > 1) {
        const uniqueVariations = [...new Set(variations)];
        if (uniqueVariations.length > 1) {
          issues.push({
            type: 'INCONSISTENCY',
            category: 'Terminology',
            issue: `Inconsistent terminology: ${uniqueVariations.join(', ')}`,
            suggestion: `Use consistent term: ${term.preferred}`,
            priority: 'LOW'
          });
        }
      }
    });
    
    return issues;
  }

  /**
   * Find line number of a specific text in content
   */
  findLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return null;
  }

  /**
   * Analyze content complexity and readability
   */
  analyzeComplexity(content) {
    const lines = content.split('\n');
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const longLines = lines.filter(line => line.length > 120).length;
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    
    return {
      avgLineLength: Math.round(avgLineLength),
      longLines,
      codeBlocks,
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }

  /**
   * Calculate a simple readability score
   */
  calculateReadabilityScore(content) {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple scoring: lower is better (more readable)
    if (avgWordsPerSentence < 15) return 'Good';
    if (avgWordsPerSentence < 25) return 'Fair';
    return 'Complex';
  }
}

module.exports = PatternDetector; 
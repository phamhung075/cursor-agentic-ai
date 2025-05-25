#!/usr/bin/env node

/**
 * 🤖 AAI → Cursor Integration Demo
 * 
 * This script demonstrates how AAI agent analysis can be formatted
 * for Cursor IDE consumption through various integration methods.
 */

const fs = require('fs');
const path = require('path');

class AAICursorIntegrationDemo {
  constructor() {
    this.outputDir = '.cursor/aai';
    this.setupOutputDirectory();
  }

  setupOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created Cursor integration directory: ${this.outputDir}`);
    }
  }

  /**
   * Demo: Convert AAI analysis to Cursor-readable format
   */
  generateCursorAnalysisFile(filename, analysisData) {
    const cursorFormat = {
      fileAnalyzed: filename,
      timestamp: new Date().toISOString(),
      source: "AAI Agent v2.0",
      analysis: {
        summary: `Found ${analysisData.improvements?.length || 0} improvement opportunities`,
        improvements: analysisData.improvements || [],
        agentInsights: analysisData.agentInsights || {},
        projectContext: analysisData.projectContext || {},
        recommendations: this.generateRecommendations(analysisData)
      },
      cursorIntegration: {
        // Cursor-specific hints
        quickFixes: this.generateQuickFixes(analysisData),
        codeActions: this.generateCodeActions(analysisData),
        symbolInformation: this.generateSymbolInfo(analysisData)
      }
    };

    const outputFile = path.join(this.outputDir, `${path.basename(filename, path.extname(filename))}-analysis.json`);
    fs.writeFileSync(outputFile, JSON.stringify(cursorFormat, null, 2));
    console.log(`✅ Analysis exported to: ${outputFile}`);
    return outputFile;
  }

  /**
   * Demo: Generate context file for current Cursor session
   */
  generateCursorContext() {
    const contextData = {
      workspace: process.cwd(),
      timestamp: new Date().toISOString(),
      aaiAgent: {
        version: "2.0.0",
        status: "active",
        lastAnalysis: new Date().toISOString()
      },
      activeContext: {
        currentFocus: "React component optimization",
        recentAnalyses: [
          "src/components/UserProfile.jsx",
          "src/components/Dashboard.jsx"
        ],
        patterns: [
          "Missing React.memo optimizations",
          "Accessibility improvements needed",
          "Performance optimization opportunities"
        ]
      },
      recommendations: {
        immediate: [
          "Add React.memo to UserProfile component",
          "Implement aria-labels for accessibility"
        ],
        planning: [
          "Consider extracting custom hooks",
          "Review component re-render patterns"
        ]
      },
      memory: {
        agentLearning: "85% confidence based on 12 similar cases",
        projectHistory: "3 successful optimizations this week"
      }
    };

    const contextFile = path.join(this.outputDir, 'current-context.json');
    fs.writeFileSync(contextFile, JSON.stringify(contextData, null, 2));
    console.log(`📋 Context exported to: ${contextFile}`);
    return contextFile;
  }

  /**
   * Demo: Generate inline code comments from AAI analysis
   */
  generateInlineComments(analysisData) {
    const comments = [];
    
    comments.push('// 🤖 AAI Agent Analysis Results:');
    comments.push(`// Generated: ${new Date().toLocaleString()}`);
    comments.push('//');
    
    if (analysisData.improvements) {
      analysisData.improvements.forEach((improvement, index) => {
        comments.push(`// ${index + 1}. ${improvement.category}: ${improvement.issue}`);
        comments.push(`//    💡 Suggestion: ${improvement.suggestion}`);
        if (improvement.line) {
          comments.push(`//    📍 Line: ${improvement.line}`);
        }
        comments.push(`//    ⚡ Priority: ${improvement.priority}`);
        comments.push('//');
      });
    }

    if (analysisData.agentInsights) {
      comments.push('// 🧠 Agent Insights:');
      comments.push(`//    Confidence: ${Math.round((analysisData.agentInsights.confidence || 0.8) * 100)}%`);
      comments.push(`//    Similar cases: ${analysisData.agentInsights.similarCases || 'N/A'}`);
      comments.push('//');
    }

    const commentsFile = path.join(this.outputDir, 'inline-comments.txt');
    fs.writeFileSync(commentsFile, comments.join('\n'));
    console.log(`💬 Inline comments exported to: ${commentsFile}`);
    return comments;
  }

  /**
   * Demo: Generate workspace symbols for Cursor
   */
  generateWorkspaceSymbols() {
    const symbols = {
      aaiRecommendations: [
        {
          name: "React Performance Optimization",
          kind: "Function",
          location: "src/components/UserProfile.jsx:15",
          detail: "Add React.memo wrapper",
          priority: "medium"
        },
        {
          name: "Accessibility Enhancement",
          kind: "Interface", 
          location: "src/components/Dashboard.jsx:23",
          detail: "Missing aria-labels",
          priority: "high"
        }
      ],
      aaiInsights: [
        {
          pattern: "React re-render optimization",
          confidence: 0.85,
          frequency: 12,
          recommendation: "Implement memoization strategies"
        }
      ],
      projectContext: {
        activeAnalysis: true,
        lastUpdate: new Date().toISOString(),
        focusArea: "Performance optimization"
      }
    };

    const symbolsFile = path.join(this.outputDir, 'workspace-symbols.json');
    fs.writeFileSync(symbolsFile, JSON.stringify(symbols, null, 2));
    console.log(`🔗 Workspace symbols exported to: ${symbolsFile}`);
    return symbols;
  }

  generateRecommendations(analysisData) {
    const recommendations = [];
    
    if (analysisData.improvements) {
      analysisData.improvements.forEach(improvement => {
        recommendations.push({
          action: improvement.suggestion,
          priority: improvement.priority,
          confidence: improvement.confidence || 0.8,
          estimatedTime: this.estimateTime(improvement),
          category: improvement.category
        });
      });
    }

    return recommendations;
  }

  generateQuickFixes(analysisData) {
    const quickFixes = [];
    
    if (analysisData.improvements) {
      analysisData.improvements.forEach(improvement => {
        if (improvement.category === 'Performance' && improvement.issue.includes('React.memo')) {
          quickFixes.push({
            title: "Add React.memo wrapper",
            kind: "quickfix",
            edit: {
              line: improvement.line,
              suggestion: "React.memo(YourComponent)"
            }
          });
        }
      });
    }

    return quickFixes;
  }

  generateCodeActions(analysisData) {
    const codeActions = [];
    
    if (analysisData.improvements) {
      analysisData.improvements.forEach(improvement => {
        codeActions.push({
          title: `Fix: ${improvement.issue}`,
          kind: "refactor",
          description: improvement.suggestion,
          priority: improvement.priority
        });
      });
    }

    return codeActions;
  }

  generateSymbolInfo(analysisData) {
    return {
      totalIssues: analysisData.improvements?.length || 0,
      categories: [...new Set(analysisData.improvements?.map(i => i.category) || [])],
      confidence: analysisData.agentInsights?.confidence || 0.8
    };
  }

  estimateTime(improvement) {
    const timeMap = {
      'low': '5-15 minutes',
      'medium': '15-45 minutes', 
      'high': '1-3 hours'
    };
    
    return timeMap[improvement.priority] || '15-30 minutes';
  }

  /**
   * Run the complete demo
   */
  runDemo() {
    console.log('🚀 Running AAI → Cursor Integration Demo...\n');

    // Sample analysis data (simulates AAI agent output)
    const sampleAnalysis = {
      improvements: [
        {
          category: 'Performance',
          issue: 'Missing React.memo optimization',
          suggestion: 'Wrap component in React.memo to prevent unnecessary re-renders',
          line: 15,
          priority: 'medium',
          confidence: 0.85
        },
        {
          category: 'Accessibility',
          issue: 'Missing aria-labels for interactive elements',
          suggestion: 'Add aria-label attributes to buttons and inputs',
          line: 23,
          priority: 'high',
          confidence: 0.92
        },
        {
          category: 'Code Quality',
          issue: 'Complex useEffect can be extracted',
          suggestion: 'Extract logic into custom hook for reusability',
          line: 45,
          priority: 'low',
          confidence: 0.78
        }
      ],
      agentInsights: {
        similarCases: 12,
        confidence: 0.85,
        recommendation: 'High impact optimization with minimal effort'
      },
      projectContext: {
        projectName: 'React Dashboard App',
        analysisDate: new Date().toISOString()
      }
    };

    // Generate all integration formats
    console.log('1. 📁 Generating Cursor analysis file...');
    this.generateCursorAnalysisFile('src/components/UserProfile.jsx', sampleAnalysis);

    console.log('\n2. 📋 Generating current context...');
    this.generateCursorContext();

    console.log('\n3. 💬 Generating inline comments...');
    this.generateInlineComments(sampleAnalysis);

    console.log('\n4. 🔗 Generating workspace symbols...');
    this.generateWorkspaceSymbols();

    console.log('\n✅ Demo completed! Check the .cursor/aai/ directory for all generated files.');
    console.log('\n📖 Integration Guide:');
    console.log('   1. Open the generated JSON files in Cursor');
    console.log('   2. Copy inline comments into your code files');
    console.log('   3. Use workspace symbols for quick navigation');
    console.log('   4. Set up file watchers for real-time updates');
    
    return this.outputDir;
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new AAICursorIntegrationDemo();
  demo.runDemo();
}

module.exports = AAICursorIntegrationDemo; 
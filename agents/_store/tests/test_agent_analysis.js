#!/usr/bin/env node

/**
 * 🧠 Self-Improvement Agent Analysis Demo
 * 
 * Demonstrates the agent analyzing .cursor/rules files and providing improvements
 * Located in agents/_store/tests per organizational rules
 */

require('dotenv').config();
const path = require('path');
const SelfImprovementAgent = require('../../self-improvement/index.js');

async function demonstrateAgentAnalysis() {
  console.log('🚀 Starting Self-Improvement Agent Analysis Demo...');
  console.log('📁 Test location: agents/_store/tests/');
  console.log('');
  
  const agent = new SelfImprovementAgent();
  
  try {
    // Initialize agent in non-interactive mode
    await agent.start({ interactive: false, testMode: false });
    
    console.log('✅ Agent initialized successfully');
    console.log('');
    
    // Analyze key framework files
    const filesToAnalyze = [
      '00_Getting_Started.mdc',
      '01_AutoPilot.mdc', 
      '07_Start_Building.mdc',
      'logic.mdc'
    ];
    
    for (const filename of filesToAnalyze) {
      console.log(`🔍 Analyzing: ${filename}`);
      console.log('━'.repeat(60));
      
      // Analyze the file
      const result = await agent.analyzeSpecificFile(filename);
      
      if (result.success) {
        if (result.improvements.length === 0) {
          console.log('✅ No issues found - file looks good!');
        } else {
          console.log(`📊 Found ${result.improvements.length} improvement opportunities:`);
          console.log('');
          
          result.improvements.forEach((item, index) => {
            console.log(`${index + 1}. 🎯 ${item.category}: ${item.issue}`);
            console.log(`   💡 ${item.suggestion}`);
            if (item.line) {
              console.log(`   📍 Line ${item.line}`);
            }
            console.log('');
          });
          
          // Get detailed improvement suggestions
          const suggestions = await agent.getImprovementSuggestions(filename);
          if (suggestions.success) {
            console.log('🔧 Detailed Improvement Plan:');
            console.log('');
            
            suggestions.suggestions.forEach((suggestion, index) => {
              console.log(`${index + 1}. ${suggestion.category}: ${suggestion.issue}`);
              console.log(`   ⏱️ Estimate: ${suggestion.timeEstimate} (${suggestion.difficulty} difficulty)`);
              console.log(`   🎯 Impact: ${suggestion.impact}`);
              
              // Show agent insights if available
              if (suggestion.agentInsights) {
                console.log(`   🧠 Agent Confidence: ${Math.round(suggestion.agentInsights.confidence * 100)}%`);
              }
              
              console.log('   📋 Action Steps:');
              suggestion.actionSteps.forEach((step, stepIndex) => {
                console.log(`      ${stepIndex + 1}. ${step}`);
              });
              console.log('');
            });
          }
        }
      } else {
        console.log(`❌ ${result.message}`);
      }
      
      console.log('━'.repeat(60));
      console.log('');
    }
    
    // Set context and do smart detection
    console.log('🎯 Setting Context and Running Smart Detection');
    console.log('━'.repeat(60));
    
    agent.setContext('workflow optimization and technology updates');
    
    const smartResults = await agent.smartDetectIssues('workflow optimization and technology updates');
    
    if (smartResults.success) {
      console.log(`🎯 Smart Detection Results:`);
      console.log(`📄 Found ${smartResults.relevantFiles.length} relevant files`);
      console.log(`📊 Total issues detected: ${smartResults.totalIssues}`);
      console.log('');
      
      smartResults.relevantFiles.forEach(file => {
        console.log(`📄 ${file.path} (${file.issues.length} issues)`);
        file.issues.slice(0, 2).forEach(issue => {
          console.log(`  • ${issue.category}: ${issue.issue}`);
        });
        if (file.issues.length > 2) {
          console.log(`  • ... and ${file.issues.length - 2} more issues`);
        }
        console.log('');
      });
      
      // Show memory insights
      if (smartResults.agentInsights && smartResults.agentInsights.length > 0) {
        console.log('🧠 Agent Learning Insights:');
        smartResults.agentInsights.forEach((insight, i) => {
          console.log(`  ${i + 1}. Confidence: ${Math.round(insight.score * 100)}%`);
        });
        console.log('');
      }
    } else {
      console.log(`❌ Smart detection failed: ${smartResults.message}`);
    }
    
    console.log('━'.repeat(60));
    console.log('');
    
    // Store some learning patterns
    console.log('🧠 Storing Agent Learning Patterns');
    console.log('━'.repeat(60));
    
    await agent.storeAgentLearning({
      pattern: 'Workflow files often need technology stack updates',
      context: 'Framework analysis revealed multiple outdated technology references',
      confidence: 0.85,
      category: 'technology_updates'
    }, {
      analysisDate: Date.now(),
      filesAnalyzed: filesToAnalyze.length,
      framework: 'agentic-coding'
    });
    
    await agent.storeAgentLearning({
      pattern: 'Documentation consistency is critical for AI agent guidance',
      context: 'Multiple files showed inconsistent naming and reference patterns',
      confidence: 0.92,
      category: 'documentation_quality'
    }, {
      analysisDate: Date.now(),
      framework: 'agentic-coding'
    });
    
    console.log('✅ Stored learning patterns for future improvement cycles');
    console.log('');
    
    // Get final agent status
    console.log('📊 Final Agent Status');
    console.log('━'.repeat(60));
    
    const status = await agent.getStatus();
    console.log(`🤖 Agent: ${status.agent.name} v${status.agent.version}`);
    console.log(`🧠 Agent Memory: ${status.memory?.agent?.localMemories || 0} entries`);
    console.log(`📁 Project Memory: ${status.memory?.project?.localMemories || 0} entries`);
    console.log(`🔗 Dependencies: ${status.memory?.cacheSize || 0} cached`);
    console.log(`📈 Context Analysis: ${status.context?.totalContexts || 0} contexts processed`);
    
    console.log('');
    console.log('🎉 Self-Improvement Agent Analysis Complete!');
    console.log('');
    console.log('💡 Key Findings:');
    console.log('  • Framework files analyzed for potential improvements');
    console.log('  • Learning patterns stored for future cycles');
    console.log('  • Agent memory system is actively learning');
    console.log('  • Ready for continuous improvement iterations');
    console.log('  • Proper file organization in agents/_store/tests');
    
    // Graceful shutdown
    await agent.shutdown();
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateAgentAnalysis().then(() => {
    console.log('✅ Demo completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Demo error:', error.message);
    process.exit(1);
  });
}

module.exports = demonstrateAgentAnalysis; 
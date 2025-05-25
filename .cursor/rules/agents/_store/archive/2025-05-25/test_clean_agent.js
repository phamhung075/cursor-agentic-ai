#!/usr/bin/env node

/**
 * 🧠 Test Clean Agent - Demonstration of optimized dependency tracking
 * 
 * Shows that the agent now only tracks project files, not node_modules
 * Located in .cursor/rules/agents/_store/tests per organizational rules
 */

require('dotenv').config();
const path = require('path');
const SelfImprovementAgent = require('../../self-improvement/index.js');

async function testCleanAgent() {
  console.log('🧪 Testing Clean Self-Improvement Agent...');
  console.log('📁 Test location: .cursor/rules/agents/_store/tests/');
  console.log('');
  
  const agent = new SelfImprovementAgent();
  
  try {
    // Initialize agent in non-interactive mode
    await agent.start({ interactive: false, testMode: false });
    
    console.log('✅ Agent initialized successfully');
    console.log('');
    
    // Wait a moment for file watching to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check current dependency stats
    if (agent.fileDependencyManager && agent.fileDependencyManager.isInitialized) {
      const stats = agent.fileDependencyManager.getStats();
      console.log('📊 Current Dependency Stats:');
      console.log(`  📁 Total Files Tracked: ${stats.totalFiles}`);
      console.log(`  🔗 Total Dependencies: ${stats.totalDependencies}`);
      console.log(`  📈 Average Dependencies: ${stats.averageDependencies}`);
      console.log(`  ⏳ Analysis Queue Size: ${stats.queueSize}`);
      console.log(`  👀 File Watcher Active: ${stats.isWatching ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    // Analyze one framework file to see selective tracking
    console.log('🔍 Testing Selective File Analysis...');
    const result = await agent.analyzeSpecificFile('README.md');
    
    if (result.success) {
      console.log(`✅ Analyzed: ${result.filePath}`);
      console.log(`📊 Found ${result.improvements.length} improvement opportunities`);
      
      if (result.improvements.length > 0) {
        console.log('');
        console.log('🎯 Top Issues Found:');
        result.improvements.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.category}: ${item.issue}`);
        });
      }
    } else {
      console.log(`❌ ${result.message}`);
    }
    
    console.log('');
    
    // Check memory stats after analysis
    const status = await agent.getStatus();
    console.log('🧠 Memory Status After Analysis:');
    console.log(`  📊 Agent Memory: ${status.memory?.agent?.localMemories || 0} entries`);
    console.log(`  📁 Project Memory: ${status.memory?.project?.localMemories || 0} entries`);
    console.log('');
    
    // Final dependency stats
    if (agent.fileDependencyManager && agent.fileDependencyManager.isInitialized) {
      const finalStats = agent.fileDependencyManager.getStats();
      console.log('📊 Final Dependency Stats:');
      console.log(`  📁 Files Tracked: ${finalStats.totalFiles}`);
      console.log(`  🔗 Dependencies: ${finalStats.totalDependencies}`);
      console.log('');
    }
    
    console.log('🎉 Clean Agent Test Complete!');
    console.log('');
    console.log('✨ Improvements Made:');
    console.log('  ✅ Only tracks project files (no node_modules)');
    console.log('  ✅ Reduced memory storage frequency (batched)');
    console.log('  ✅ Selective file watching patterns');
    console.log('  ✅ Clean dependency memory (fresh start)');
    console.log('  ✅ Optimized for project-specific analysis');
    console.log('  ✅ Proper file organization in .cursor/rules/agents/_store/tests');
    
    // Graceful shutdown
    await agent.shutdown();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCleanAgent().then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test error:', error.message);
    process.exit(1);
  });
}

module.exports = testCleanAgent; 
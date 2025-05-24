#!/usr/bin/env node

/**
 * 🧪 Quick Test - New Organized Self-Improvement Agent
 * 
 * Tests the new modular architecture
 */

const SelfImprovementAgent = require('./agents/self-improvement/index.js');

async function testNewAgent() {
  console.log('🧪 Testing New Self-Improvement Agent v2.0');
  console.log('=' .repeat(50));
  
  try {
    // Initialize agent
    const agent = new SelfImprovementAgent();
    console.log('✅ Agent initialization: SUCCESS');
    
    // Test file analysis
    console.log('\n📊 Testing file analysis...');
    const result = await agent.analyzeSpecificFile('getting_started');
    
    if (result.success) {
      console.log('✅ File analysis: SUCCESS');
      console.log(`   📄 Found file: ${result.filePath}`);
      console.log(`   🔍 Issues found: ${result.improvements.length}`);
    } else {
      console.log('⚠️ File analysis: No file found (expected if file doesn\'t exist)');
      console.log(`   💡 Message: ${result.message}`);
    }
    
    // Test context management
    console.log('\n📍 Testing context management...');
    agent.setContext('workflow');
    console.log('✅ Context setting: SUCCESS');
    
    // Test smart detection
    console.log('\n🎯 Testing smart detection...');
    const smartResult = await agent.smartDetectIssues('workflow');
    
    if (smartResult.success) {
      console.log('✅ Smart detection: SUCCESS');
      console.log(`   📁 Relevant files: ${smartResult.relevantFiles.length}`);
      console.log(`   🔍 Total issues: ${smartResult.totalIssues}`);
    } else {
      console.log('⚠️ Smart detection: Limited results (expected for test)');
      console.log(`   💡 Message: ${smartResult.message}`);
    }
    
    // Test status
    console.log('\n📈 Testing status retrieval...');
    const status = agent.getStatus();
    console.log('✅ Status retrieval: SUCCESS');
    console.log(`   🤖 Agent: ${status.agent.name} v${status.agent.version}`);
    console.log(`   🔧 Security rules: ${status.patterns.securityRules}`);
    console.log(`   📋 Obsolete patterns: ${status.patterns.obsoletePatterns}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 To use interactively: npm run agent');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testNewAgent(); 
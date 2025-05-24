#!/usr/bin/env node

/**
 * 🎯 Demo: Interactive Self-Improvement Agent
 * 
 * This demonstrates how the agent analyzes specific files on demand
 * instead of scanning the entire project.
 */

const InteractiveSelfImprovementAgent = require('./scripts/self_improvement_agent.js');

async function demo() {
  console.log('🎯 Interactive Self-Improvement Agent Demo');
  console.log('============================================\n');
  
  const agent = new InteractiveSelfImprovementAgent();
  
  // Example 1: Analyze a specific file
  console.log('Example 1: Analyzing a specific file');
  console.log('Command: analyze 00_Getting_Started\n');
  
  await agent.analyzeSpecificFile('00_Getting_Started');
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Example 2: Get improvement suggestions
  console.log('Example 2: Getting improvement suggestions');
  console.log('Command: improve logic\n');
  
  await agent.getImprovementSuggestions('logic');
  
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Example 3: Context-aware analysis
  console.log('Example 3: Setting context and smart detection');
  console.log('Command: context "agent workflow"\n');
  
  agent.setContext('agent workflow');
  
  console.log('\nCommand: smart-detect\n');
  await agent.smartContextDetection();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Demo Complete!');
  console.log('💡 The agent now only analyzes files when you need it');
  console.log('🚀 Much faster and more focused than scanning everything');
  console.log('='.repeat(50));
}

// Run the demo
demo().catch(console.error); 
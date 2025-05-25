#!/usr/bin/env node

/**
 * 🧪 AutoPilot Integration Test - Verify new Self-Improvement Agent v2.0
 * 
 * Tests AutoPilot integration with the reorganized agent
 */

const fs = require('fs').promises;
const path = require('path');

async function testAutoPilotIntegration() {
  console.log('🧪 Testing AutoPilot Integration with Self-Improvement Agent v2.0');
  console.log('=' .repeat(70));
  
  try {
    // Test 1: Check AutoPilot file references new agent
    console.log('\n📄 Testing AutoPilot file...');
    const autopilotPath = '.cursor/rules/01__AI-RUN/01_AutoPilot.mdc';
    const autopilotContent = await fs.readFile(autopilotPath, 'utf8');
    
    // Check for new agent references
    const hasNewAgentRef = autopilotContent.includes('.cursor/rules/agents/self-improvement/');
    const hasNpmRunAgent = autopilotContent.includes('npm run AAI:agent');
    const hasContextCommands = autopilotContent.includes('context <');
    const hasSmartDetect = autopilotContent.includes('smart-detect');
    const hasV2Reference = autopilotContent.includes('v2.0');
    
    console.log(`✅ New agent path reference: ${hasNewAgentRef ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ npm run AAI:agent command: ${hasNpmRunAgent ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Context commands: ${hasContextCommands ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Smart detect feature: ${hasSmartDetect ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Version 2.0 reference: ${hasV2Reference ? 'FOUND' : 'MISSING'}`);
    
    // Test 2: Check Quick Reference file
    console.log('\n📋 Testing Quick Reference file...');
    const quickRefPath = '.cursor/rules/01__AI-RUN/Quick_Self_Improvement_Reference.mdc';
    const quickRefContent = await fs.readFile(quickRefPath, 'utf8');
    
    const hasModularRef = quickRefContent.includes('modular Self-Improvement Agent');
    const hasNewCommands = quickRefContent.includes('🤖 >');
    const hasAgentActivation = quickRefContent.includes('npm run AAI:agent');
    
    console.log(`✅ Modular agent reference: ${hasModularRef ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ New CLI commands: ${hasNewCommands ? 'FOUND' : 'MISSING'}`);
    console.log(`✅ Agent activation: ${hasAgentActivation ? 'FOUND' : 'MISSING'}`);
    
    // Test 3: Verify agent files exist
    console.log('\n🔍 Testing agent file structure...');
    const agentFiles = [
      '.cursor/rules/agents/self-improvement/index.js',
      '.cursor/rules/agents/self-improvement/core/analyzer.js',
      '.cursor/rules/agents/self-improvement/core/detector.js',
      '.cursor/rules/agents/self-improvement/core/context.js',
      '.cursor/rules/agents/self-improvement/cli/interface.js',
      '.cursor/rules/agents/self-improvement/config/default.json'
    ];
    
    for (const file of agentFiles) {
      try {
        await fs.access(file);
        console.log(`✅ ${file}: EXISTS`);
      } catch (error) {
        console.log(`❌ ${file}: MISSING`);
      }
    }
    
    // Test 4: Check package.json scripts
    console.log('\n📦 Testing package.json scripts...');
    const packagePath = 'package.json';
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    
    const has.cursor/rules/agentscript = packageData.scripts && packageData.scripts.agent;
    const hasLegacyScript = packageData.scripts && packageData.scripts.legacy;
    const .cursor/rules/agentscriptCorrect = has.cursor/rules/agentscript && packageData.scripts.agent.includes('.cursor/rules/agents/self-improvement/index.js');
    
    console.log(`✅ 'agent' script exists: ${has.cursor/rules/agentscript ? 'YES' : 'NO'}`);
    console.log(`✅ 'legacy' script exists: ${hasLegacyScript ? 'YES' : 'NO'}`);
    console.log(`✅ Agent script path correct: ${.cursor/rules/agentscriptCorrect ? 'YES' : 'NO'}`);
    
    // Test 5: Integration score
    console.log('\n📊 Integration Score...');
    const totalChecks = 11;
    const passedChecks = [
      hasNewAgentRef, hasNpmRunAgent, hasContextCommands, hasSmartDetect, hasV2Reference,
      hasModularRef, hasNewCommands, hasAgentActivation,
      has.cursor/rules/agentscript, hasLegacyScript, .cursor/rules/agentscriptCorrect
    ].filter(Boolean).length;
    
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    console.log(`📈 Integration Score: ${score}% (${passedChecks}/${totalChecks} checks passed)`);
    
    if (score >= 90) {
      console.log('🎉 EXCELLENT: AutoPilot integration is complete and ready!');
    } else if (score >= 70) {
      console.log('⚠️ GOOD: AutoPilot integration mostly complete, minor issues detected');
    } else {
      console.log('❌ NEEDS WORK: AutoPilot integration requires attention');
    }
    
    console.log('\n💡 To test the integration:');
    console.log('   1. Start AutoPilot workflow');
    console.log('   2. When framework improvements are needed, run: npm run AAI:agent');
    console.log('   3. Set context and use smart detection features');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAutoPilotIntegration(); 
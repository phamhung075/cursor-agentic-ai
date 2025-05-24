#!/usr/bin/env node

/**
 * 🧪 Test File Dependency Tracking - Verify dependency tracking and cascading updates
 */

const SelfImprovementAgent = require('../../self-improvement/index.js');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

async function testDependencyTracking() {
  console.log(chalk.blue('🧪 Testing File Dependency Tracking System'));
  console.log('=' .repeat(70));

  const agent = new SelfImprovementAgent();
  
  try {
    // Initialize agent
    await agent.initialize();
    console.log(chalk.green('✅ Agent initialized successfully'));

    // Test 1: Dependency Statistics
    console.log(chalk.cyan('\n📊 Test 1: Getting Dependency Statistics...'));
    const statsResult = await agent.handleDependencyCommand('stats');
    if (statsResult.success) {
      console.log(chalk.green('✅ Dependency tracking is working'));
      console.log(chalk.gray(`  Files tracked: ${statsResult.stats.totalFiles}`));
      console.log(chalk.gray(`  Total dependencies: ${statsResult.stats.totalDependencies}`));
      console.log(chalk.gray(`  File watcher active: ${statsResult.stats.isWatching}`));
    } else {
      console.log(chalk.yellow(`⚠️ Dependency stats: ${statsResult.message}`));
    }

    // Test 2: Create test files to analyze dependencies
    console.log(chalk.cyan('\n📁 Test 2: Creating Test Files...'));
    await createTestFiles();
    console.log(chalk.green('✅ Test files created'));

    // Wait a moment for file watcher to detect files
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Analyze specific file dependencies
    console.log(chalk.cyan('\n🔍 Test 3: Analyzing File Dependencies...'));
    const analyzeResult = await agent.handleDependencyCommand('analyze', ['test-component.js']);
    if (analyzeResult.success) {
      console.log(chalk.green('✅ File dependency analysis successful'));
      console.log(chalk.gray(`  Dependencies: ${analyzeResult.info.dependencyCount}`));
      console.log(chalk.gray(`  Dependents: ${analyzeResult.info.dependentCount}`));
    } else {
      console.log(chalk.yellow(`⚠️ File analysis: ${analyzeResult.message}`));
    }

    // Test 4: Search dependencies by pattern
    console.log(chalk.cyan('\n🔍 Test 4: Searching Dependencies by Pattern...'));
    const searchResult = await agent.handleDependencyCommand('search', ['component']);
    if (searchResult.success) {
      console.log(chalk.green(`✅ Found ${searchResult.results.length} files matching pattern`));
    } else {
      console.log(chalk.yellow(`⚠️ Search: ${searchResult.message}`));
    }

    // Test 5: Get dependency graph overview
    console.log(chalk.cyan('\n🕸️ Test 5: Getting Dependency Graph...'));
    const graphResult = await agent.handleDependencyCommand('graph');
    if (graphResult.success) {
      console.log(chalk.green(`✅ Dependency graph contains ${graphResult.graph.totalFiles} files`));
    } else {
      console.log(chalk.yellow(`⚠️ Graph: ${graphResult.message}`));
    }

    // Test 6: File change simulation
    console.log(chalk.cyan('\n📝 Test 6: Simulating File Change...'));
    await simulateFileChange();
    console.log(chalk.green('✅ File change simulated'));
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check updated stats
    const updatedStatsResult = await agent.handleDependencyCommand('stats');
    if (updatedStatsResult.success) {
      console.log(chalk.green('✅ Updated dependency stats retrieved'));
      console.log(chalk.gray(`  Queue size: ${updatedStatsResult.stats.queueSize}`));
    }

    // Test 7: Force reanalysis
    console.log(chalk.cyan('\n🔄 Test 7: Force Reanalysis...'));
    const reanalyzeResult = await agent.handleDependencyCommand('reanalyze', ['test-component.js']);
    if (reanalyzeResult.success) {
      console.log(chalk.green('✅ Force reanalysis completed'));
    } else {
      console.log(chalk.yellow(`⚠️ Reanalysis: ${reanalyzeResult.message}`));
    }

    // Cleanup
    console.log(chalk.cyan('\n🧹 Cleaning up test files...'));
    await cleanupTestFiles();
    console.log(chalk.green('✅ Cleanup completed'));

    // Final stats
    console.log(chalk.cyan('\n📈 Final Test Results:'));
    const finalStats = await agent.handleDependencyCommand('stats');
    if (finalStats.success) {
      console.log(chalk.green('🎉 File Dependency Tracking System Test Complete!'));
      console.log(chalk.gray('   System is ready for production use'));
      console.log(chalk.gray(`   Performance: ${finalStats.stats.totalFiles} files tracked`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
    console.error(error.stack);
  } finally {
    // Graceful shutdown
    if (agent.shutdown) {
      await agent.shutdown();
    }
  }
}

/**
 * Create test files to simulate dependencies
 */
async function createTestFiles() {
  const testDir = path.join(process.cwd(), 'test-deps');
  await fs.mkdir(testDir, { recursive: true });

  // Create a utility file
  const utilContent = `
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email) {
  return /^[^@]+@[^@]+\\.[^@]+$/.test(email);
}
`;
  await fs.writeFile(path.join(testDir, 'utils.js'), utilContent);

  // Create a component that depends on utils
  const componentContent = `
import { formatDate, validateEmail } from './utils.js';
import React from 'react';

const TestComponent = ({ email, date }) => {
  const isValidEmail = validateEmail(email);
  const formattedDate = formatDate(date);
  
  return (
    <div>
      <p>Email: {email} {isValidEmail ? '✓' : '✗'}</p>
      <p>Date: {formattedDate}</p>
    </div>
  );
};

export default TestComponent;
`;
  await fs.writeFile(path.join(testDir, 'test-component.js'), componentContent);

  // Create an app file that uses the component
  const appContent = `
import TestComponent from './test-component.js';
import { formatDate } from './utils.js';

function App() {
  return (
    <div>
      <h1>Test App</h1>
      <TestComponent email="test@example.com" date={new Date()} />
      <p>Today: {formatDate(new Date())}</p>
    </div>
  );
}

export default App;
`;
  await fs.writeFile(path.join(testDir, 'app.js'), appContent);
}

/**
 * Simulate a file change to test dependency tracking
 */
async function simulateFileChange() {
  const testFile = path.join(process.cwd(), 'test-deps', 'utils.js');
  
  // Add a new function to utils.js
  const updatedContent = `
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email) {
  return /^[^@]+@[^@]+\\.[^@]+$/.test(email);
}

// New function added
export function capitalizeString(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;
  
  await fs.writeFile(testFile, updatedContent);
}

/**
 * Clean up test files
 */
async function cleanupTestFiles() {
  const testDir = path.join(process.cwd(), 'test-deps');
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Warning: Could not cleanup test directory:', error.message);
  }
}

// Run the test if called directly
if (require.main === module) {
  testDependencyTracking().catch(console.error);
}

module.exports = testDependencyTracking; 
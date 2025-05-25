#!/usr/bin/env node

/**
 * 🔍 Check Running AAI Processes
 * 
 * Checks for any running AAI processes that might have old health check messages
 */

const { exec } = require('child_process');

console.log('🔍 Checking for running AAI processes...\n');

// Check for Node.js processes that might be AAI-related
exec('ps aux | grep -E "(launch-aai|task-monitor|aai-agent|cursor-integration)" | grep -v grep', (error, stdout, stderr) => {
  if (stdout.trim()) {
    console.log('📊 Found running AAI processes:');
    console.log(stdout);
    console.log('\n💡 To stop all AAI processes and restart cleanly:');
    console.log('   1. Press Ctrl+C in any terminal running npm run launch');
    console.log('   2. Wait a few seconds for graceful shutdown');
    console.log('   3. Run: npm run launch');
    console.log('');
  } else {
    console.log('✅ No AAI processes currently running');
    console.log('💡 You can safely start the system with: npm run launch');
    console.log('');
  }
});

// Check for any processes using the task monitoring ports/files
exec('lsof +D agents/_store/logs/task-monitoring 2>/dev/null', (error, stdout, stderr) => {
  if (stdout.trim()) {
    console.log('📁 Found processes using task monitoring files:');
    console.log(stdout);
    console.log('');
  }
});

// Show current system status
console.log('📊 Current System Status:');
console.log('━'.repeat(50));

// Check if task monitoring files exist
const fs = require('fs');
const path = require('path');

const tasksFile = 'agents/_store/projects/_core/tasks/nested_tasks.json';
const logsDir = 'agents/_store/logs/task-monitoring';

console.log(`📋 Tasks file: ${fs.existsSync(tasksFile) ? '✅ Exists' : '❌ Missing'}`);
console.log(`📁 Logs directory: ${fs.existsSync(logsDir) ? '✅ Exists' : '❌ Missing'}`);

// Check launch script
const launchScript = 'agents/_store/scripts/launch-aai-complete.js';
console.log(`🚀 Launch script: ${fs.existsSync(launchScript) ? '✅ Ready' : '❌ Missing'}`);

console.log('\n🎯 Recommended Action:');
console.log('   If you see old "Task Management" messages, restart the system:');
console.log('   1. Stop any running npm run launch (Ctrl+C)');
console.log('   2. Wait for graceful shutdown');
console.log('   3. Run: npm run launch');
console.log('   The new system will show "Task Monitoring" instead of "Task Management"');
console.log(''); 
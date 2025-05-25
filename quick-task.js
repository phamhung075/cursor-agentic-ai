#!/usr/bin/env node

/**
 * 🚀 Quick Task Creator
 * 
 * Simple interface to create tasks from chat commands
 * Usage: node quick-task.js "your request here"
 */

const CursorChatIntegration = require('./agents/_store/scripts/cursor-chat-integration');

const args = process.argv.slice(2);
const command = args.join(' ');

if (!command) {
  console.log('🚀 Quick Task Creator');
  console.log('━'.repeat(30));
  console.log('Usage: node quick-task.js "your request"');
  console.log('');
  console.log('Examples:');
  console.log('  node quick-task.js "Create a login form with validation"');
  console.log('  node quick-task.js "Add dark mode toggle to the header"');
  console.log('  node quick-task.js "Fix the responsive layout on mobile"');
  console.log('');
  console.log('📋 Tasks will be created in .cursor/tasks.json');
  console.log('🔄 Use Cursor Command Palette → "Tasks: Run Task" to execute');
  process.exit(0);
}

console.log('🚀 Quick Task Creator');
console.log('━'.repeat(50));
console.log(`📝 Request: "${command}"`);
console.log('');

// Add the command to the queue
CursorChatIntegration.addMessage(command);

// Process it immediately
const { spawn } = require('child_process');

console.log('🔄 Processing command and creating tasks...');

const processor = spawn('node', [
  'agents/_store/scripts/process-chat-command.js',
  command
], {
  stdio: 'inherit'
});

processor.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ Tasks created successfully!');
    console.log('🎯 Open Cursor Command Palette (Ctrl/Cmd+Shift+P)');
    console.log('📋 Type "Tasks: Run Task" to execute your tasks');
  } else {
    console.log('');
    console.log('⚠️ Task creation completed with warnings');
    console.log('📋 Check .cursor/tasks.json for available tasks');
  }
});

processor.on('error', (error) => {
  console.error('❌ Error processing command:', error.message);
}); 
#!/usr/bin/env node

/**
 * 🗣️ Process Chat Command API
 * 
 * Simple API to process user chat commands and update .cursor/tasks.json
 * Usage: node process-chat-command.js "your command here"
 */

const fs = require('fs');
const path = require('path');
const CursorChatProcessor = require('./cursor-chat-processor');

async function processCommand(userCommand) {
  if (!userCommand) {
    console.log('❌ Please provide a command to process');
    console.log('Usage: node process-chat-command.js "your command here"');
    process.exit(1);
  }

  console.log('🗣️ Processing Chat Command API');
  console.log('━'.repeat(50));
  console.log(`Command: "${userCommand}"`);
  console.log('');

  try {
    const processor = new CursorChatProcessor();
    const session = await processor.processCommand(userCommand);

    if (session) {
      console.log('✅ Command processed successfully!');
      console.log('');
      console.log('📋 Results:');
      console.log(`• Session ID: ${session.id}`);
      console.log(`• Tasks Created: ${session.cursorTasks ? session.cursorTasks.length : session.taskCount || 'N/A'}`);
      console.log(`• Status: ${session.status}`);
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('1. Open Command Palette (Ctrl/Cmd+Shift+P)');
      console.log('2. Type "Tasks: Run Task"');
      console.log('3. Select tasks in order to execute them');
      console.log('');
      console.log('📁 Files Updated:');
      console.log('• .cursor/tasks.json - Updated with new tasks');
      console.log(`• .cursor/chat-logs/session-${session.id}.json - Session details`);
      console.log('• .cursor/chat-logs/latest-session.json - Latest session info');
      
      // Ensure process exits
      process.exit(0);
    } else {
      console.log('❌ Failed to process command');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error processing command:', error.message);
    process.exit(1);
  }
}

// API for programmatic access
async function processCommandAPI(userCommand, context = {}) {
  const processor = new CursorChatProcessor();
  return await processor.processCommand(userCommand, context);
}

// Create API file for other scripts to trigger processing
function createCommandAPI(userCommand, context = {}) {
  const apiPath = '.cursor/chat-logs/process-command.json';
  
  // Ensure directory exists
  const dir = path.dirname(apiPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const commandData = {
    command: userCommand,
    context: context,
    timestamp: Date.now(),
    autoProcess: true
  };

  fs.writeFileSync(apiPath, JSON.stringify(commandData, null, 2));
  console.log(`✅ Command queued for processing: "${userCommand}"`);
  console.log('🔄 Will be processed automatically by the launch system');
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args.join(' ');

  if (args.includes('--api')) {
    // Create API file for automatic processing
    const commandIndex = args.indexOf('--api');
    const userCommand = args.slice(commandIndex + 1).join(' ');
    createCommandAPI(userCommand);
  } else {
    // Process command directly
    processCommand(command);
  }
}

module.exports = {
  processCommand: processCommandAPI,
  createCommandAPI
}; 
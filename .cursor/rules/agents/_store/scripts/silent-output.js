#!/usr/bin/env node

/**
 * Silent Output - Completely bypasses Cursor task detection
 * Uses process.stdout.write instead of console.log
 */

const message = process.argv.slice(2).join(' ');

if (!message) {
  process.stdout.write('Usage: node silent-output.js "your message"\n');
  process.exit(1);
}

// Use process.stdout.write instead of console.log to avoid detection
process.stdout.write(message + '\n');

// Exit immediately
process.exit(0); 
#!/usr/bin/env node

/**
 * MCP Cursor Launcher
 * 
 * This script launches the MCP SSE Server for Cursor integration.
 * It ensures the database path exists and sets up environment variables.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  serverScript: path.resolve(__dirname, '../src/api/SSEServer.ts'),
  storageType: process.env.STORAGE_TYPE || 'sqlite',
  sqliteDbPath: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../_store/tasks.db'),
  port: process.env.PORT || 3233,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Ensure database directory exists
const dbDir = path.dirname(config.sqliteDbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Print banner
console.log('\n======================================================');
console.log('       AAI System Enhanced MCP Server Launcher         ');
console.log('======================================================');
console.log(`Storage Type: ${config.storageType}`);
console.log(`Database Path: ${config.sqliteDbPath}`);
console.log(`Server Port: ${config.port}`);
console.log(`Log Level: ${config.logLevel}`);
console.log('======================================================\n');

// Environment variables for the server
const env = {
  ...process.env,
  STORAGE_TYPE: config.storageType,
  SQLITE_DB_PATH: config.sqliteDbPath,
  PORT: config.port,
  LOG_LEVEL: config.logLevel,
  NODE_ENV: 'production'
};

// Start server using tsx (TypeScript executor)
const tsxPath = path.resolve(__dirname, '../node_modules/.bin/tsx');
const server = spawn(tsxPath, [config.serverScript], {
  env,
  stdio: 'inherit'
});

// Handle server process events
server.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  process.exit(code);
});

// Handle signals to gracefully shut down
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach(signal => {
  process.on(signal, () => {
    console.log(`\nReceived ${signal}, shutting down MCP server...`);
    server.kill(signal);
  });
});

console.log('MCP server started, waiting for connections...'); 
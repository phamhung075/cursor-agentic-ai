#!/usr/bin/env node

/**
 * 🧹 Clean Dependency Memory Script
 * 
 * Cleans all dependency-related memory entries and resets the tracking system
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;

async function cleanDependencyMemory() {
  console.log('🧹 Starting Dependency Memory Cleanup...');
  console.log('');
  
  try {
    // Clean local agent memory store
    const agentMemoryPath = path.join(__dirname, '../.cursor/rules/agents/_store/agent-memory');
    
    // Remove dependencies directory
    const dependenciesPath = path.join(agentMemoryPath, 'dependencies');
    try {
      await fs.rm(dependenciesPath, { recursive: true, force: true });
      console.log('✅ Cleaned local agent memory dependencies');
    } catch (error) {
      console.log('💡 No local dependency memory found to clean');
    }
    
    // Remove analysis directory (contains dependency-related analysis)
    const analysisPath = path.join(agentMemoryPath, 'analysis');
    try {
      await fs.rm(analysisPath, { recursive: true, force: true });
      console.log('✅ Cleaned local agent memory analysis');
    } catch (error) {
      console.log('💡 No local analysis memory found to clean');
    }
    
    // Clean project memory stores (all projects)
    const projectMemoryPath = path.join(__dirname, '../.cursor/rules/agents/_store/project-memory');
    try {
      const projects = await fs.readdir(projectMemoryPath);
      for (const project of projects) {
        const projectDepsPath = path.join(projectMemoryPath, project, 'dependencies');
        try {
          await fs.rm(projectDepsPath, { recursive: true, force: true });
          console.log(`✅ Cleaned project memory dependencies for: ${project}`);
        } catch (error) {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.log('💡 No project memory found to clean');
    }
    
    console.log('');
    console.log('🎉 Dependency Memory Cleanup Complete!');
    console.log('');
    console.log('📊 What was cleaned:');
    console.log('  ✅ Agent dependency memory (global patterns)');
    console.log('  ✅ Agent analysis memory (file analysis records)');
    console.log('  ✅ Project dependency memory (project-specific)');
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. The agent will start with a clean dependency graph');
    console.log('  2. Only project files will be tracked (no node_modules)');
    console.log('  3. Dependency tracking will be more selective');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  cleanDependencyMemory().then(() => {
    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Cleanup error:', error.message);
    process.exit(1);
  });
}

module.exports = cleanDependencyMemory; 
#!/usr/bin/env node

/**
 * 🔧 Simple Cursor Integration Setup
 * 
 * Sets up Cursor to work with your existing agents/* structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Cursor integration with existing agents/* structure...\n');

// 1. Create .cursor directory
if (!fs.existsSync('.cursor')) {
  fs.mkdirSync('.cursor', { recursive: true });
  console.log('📁 Created .cursor directory');
} else {
  console.log('📁 .cursor directory already exists');
}

// 2. Create Cursor settings
const settings = {
  "files.associations": {
    "agents/**/*.json": "json",
    "agents/**/*.mdc": "markdown"
  },
  "files.watcherExclude": {
    "**/agents/_store/memory/**": false,
    "**/agents/_store/analysis/**": false
  },
  "search.include": {
    "agents/_store/memory": true,
    "agents/_store/analysis": true
  },
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  }
};

fs.writeFileSync('.cursor/settings.json', JSON.stringify(settings, null, 2));
console.log('⚙️ Created Cursor settings');

// 3. Create simple bridge directory
if (!fs.existsSync('agents/cursor-integration')) {
  fs.mkdirSync('agents/cursor-integration', { recursive: true });
  console.log('📁 Created agents/cursor-integration directory');
}

// 4. Update package.json
if (fs.existsSync('package.json')) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['cursor:setup'] = 'node agents/_store/scripts/simple-cursor-setup.js';
    pkg.scripts['cursor:test'] = 'echo "Testing..." && ls -la agents/_store/ 2>/dev/null || echo "agents/_store not found yet"';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('📦 Updated package.json');
  } catch (error) {
    console.warn('⚠️ Could not update package.json:', error.message);
  }
}

// 5. Test existing structure
console.log('\n🧪 Testing current structure:');
if (fs.existsSync('agents/_store')) {
  console.log('✅ agents/_store directory found');
  
  if (fs.existsSync('agents/_store/memory')) {
    const agentDir = 'agents/_store/memory/agent';
    const projectDir = 'agents/_store/memory/project';
    
    const agentCount = fs.existsSync(agentDir) ? fs.readdirSync(agentDir).length : 0;
    const projectCount = fs.existsSync(projectDir) ? fs.readdirSync(projectDir).length : 0;
    
    console.log('📊 Found ' + agentCount + ' agent memory files');
    console.log('📊 Found ' + projectCount + ' project memory files');
  }
} else {
  console.log('ℹ️ agents/_store will be created when AAI runs');
}

console.log('\n✅ Setup completed!');
console.log('\n📖 How to use:');
console.log('   1. Cursor can now read all files in agents/_store/');
console.log('   2. Use Ctrl/Cmd+P to search for .json files in agents/');
console.log('   3. Open any .json file in agents/_store/memory/ directly');
console.log('   4. AAI analysis will be visible automatically');
console.log('\n🎯 Key Point: You can keep all files in agents/* - Cursor will find them!'); 
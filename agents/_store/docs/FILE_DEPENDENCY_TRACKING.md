# 🔗 File Dependency Tracking System

**Automatically track file relationships and update memory when files change**

## 🌟 Overview

The File Dependency Tracking System is an advanced feature of the Agent AI that automatically monitors file changes and updates memory for related files. When you edit a file, the system identifies which other files might be affected and automatically reanalyzes them to keep the AI's understanding current.

## ✨ Key Features

### **🔍 Automatic Dependency Detection**
- **Import/Require Tracking**: Automatically detects JavaScript/TypeScript imports and requires
- **CSS Import Detection**: Tracks CSS `@import` statements
- **Component References**: Identifies React/Vue component usage
- **Configuration Files**: Monitors references to config files, package.json, .env files

### **⚡ Real-Time Monitoring**
- **File Watcher**: Monitors file changes in real-time using `chokidar`
- **Hash-Based Change Detection**: Only processes actual content changes
- **Debounced Analysis**: Prevents excessive processing during rapid edits
- **Queue Management**: Efficiently handles multiple file changes

### **🧠 Intelligent Memory Updates**
- **Cascade Updates**: When file A changes, automatically updates memory for files B, C, D that depend on A
- **Dependency Graph**: Maintains bidirectional dependency relationships
- **Memory Invalidation**: Marks outdated analysis for refresh
- **Context Preservation**: Maintains project context during updates

### **📊 Dependency Analytics**
- **Dependency Statistics**: Track total files, dependencies, and relationships
- **Impact Analysis**: See which files will be affected by changes
- **Search Capabilities**: Find files by dependency patterns
- **Graph Visualization**: Overview of dependency relationships

## 🚀 Getting Started

### **1. Enable Dependency Tracking**
The system is enabled by default when memory is enabled. To disable:

```json
// agents/self-improvement/config/default.json
{
  "agent": {
    "memoryEnabled": true,
    "dependencyTrackingEnabled": false  // Add this to disable
  }
}
```

### **2. Start the Agent**
```bash
npm run AAI:agent
```

The system automatically initializes and begins monitoring your project files.

## 📋 Available Commands

### **📊 Get Statistics**
```bash
dependencies stats
```
Shows tracking statistics including:
- Total files tracked
- Total dependencies found
- Files with dependents
- Average dependencies per file
- Analysis queue size
- File watcher status

### **🔍 Analyze File Dependencies**
```bash
dependencies analyze <filename>
```
Analyzes a specific file and shows its dependencies and dependents.

### **📄 Get Dependency Info**
```bash
dependencies info <filename>
```
Shows detailed dependency information for a file:
- Files this file depends on
- Files that depend on this file
- Dependency counts
- File hash for change detection

### **🔎 Search by Pattern**
```bash
dependencies search <pattern>
```
Find files that have dependencies matching a pattern:
```bash
dependencies search component    # Find files importing components
dependencies search utils        # Find files importing utilities
dependencies search config      # Find files referencing config
```

### **🕸️ View Dependency Graph**
```bash
dependencies graph
```
Shows an overview of the dependency graph with sample relationships.

### **🔄 Force Reanalysis**
```bash
dependencies reanalyze <filename>
```
Forces reanalysis of a file and all its dependents.

## 🔧 How It Works

### **File Change Detection**
1. **File Watcher** monitors project files (js, ts, jsx, tsx, json, md, css, etc.)
2. **Hash Comparison** ensures only real content changes trigger processing
3. **Debounced Processing** delays analysis to avoid excessive updates during editing

### **Dependency Extraction**
The system parses file content to identify:

```javascript
// JavaScript/TypeScript imports
import { Component } from './component.js';
import utils from '../utils/index.js';
const helper = require('./helper.js');

// CSS imports
@import './styles.css';
@import url('./theme.css');

// Component references
<MyComponent prop="value" />
<div><AnotherComponent /></div>

// Configuration references
"./package.json"
"./config/app.config.js"
"./.env.local"
```

### **Dependency Graph**
- **Forward Dependencies**: Files that this file depends on
- **Reverse Dependencies**: Files that depend on this file
- **Bidirectional Updates**: Changes propagate through the graph
- **Persistent Storage**: Graph saved to agent memory for persistence

### **Memory Integration**
- **Analysis Records**: Stores dependency analysis in memory
- **Invalidation Markers**: Flags outdated analysis for refresh
- **Reanalysis Triggers**: Automatically reruns analysis when dependencies change
- **Context Preservation**: Maintains project context during updates

## 🎯 Use Cases

### **1. Refactoring Support**
When refactoring a utility function:
1. Edit the utility file
2. System automatically identifies all files that import this utility
3. Reanalyzes dependent files to update AI understanding
4. AI provides informed suggestions about impact

### **2. Component Development**
When updating a React component:
1. Modify component props or API
2. System finds all files using this component
3. Updates analysis for parent components
4. AI can suggest necessary updates to component usage

### **3. Configuration Changes**
When updating package.json or config files:
1. Change configuration
2. System identifies files that reference configs
3. Updates analysis for affected files
4. AI understands impact on build process or environment

### **4. API Changes**
When modifying API utilities or services:
1. Update API functions
2. System tracks all consumers of the API
3. Reanalyzes files calling the API
4. AI can suggest migration steps or breaking changes

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run AAI:test-dependencies
```

This test:
- ✅ Verifies dependency tracking initialization
- ✅ Creates test files with dependencies
- ✅ Tests automatic dependency detection
- ✅ Simulates file changes and cascading updates
- ✅ Validates search and graph functionality
- ✅ Tests force reanalysis
- ✅ Cleans up test files

## ⚙️ Configuration

### **File Patterns**
The system monitors these file types by default:
- **JavaScript**: `*.js`, `*.jsx`, `*.ts`, `*.tsx`
- **Styles**: `*.css`, `*.scss`, `*.sass`
- **Markup**: `*.html`, `*.vue`, `*.svelte`
- **Config**: `*.json`, `*.md`, `*.mdc`

### **Ignored Patterns**
These are automatically excluded:
- `node_modules/` - Dependencies
- `.git/` - Version control
- `agents/_store/memory/` - Agent memory files
- `agents/_store/logs/` - Agent log files

### **Debounce Settings**
- **Default Delay**: 2000ms (2 seconds)
- **Cascade Delay**: 500ms between dependent file processing
- **Configurable**: Can be adjusted in FileDependencyManager constructor

## 🛡️ Performance & Security

### **Performance Optimizations**
- **Hash-based change detection** prevents unnecessary processing
- **Debounced analysis** reduces CPU usage during rapid edits
- **Queue management** processes files efficiently
- **Local caching** reduces memory system load

### **Security Features**
- **Path sanitization** prevents directory traversal
- **File type validation** only processes safe file types
- **Memory isolation** keeps dependency data separate from user data
- **Graceful error handling** prevents system crashes

### **Resource Management**
- **Memory efficient** dependency graph storage
- **Automatic cleanup** of stale dependency records
- **Configurable retention** for dependency history
- **Graceful shutdown** properly closes file watchers

## 🔮 Advanced Features

### **Custom Dependency Patterns**
You can extend dependency detection by modifying `extractDependencies()` in `FileDependencyManager.js`:

```javascript
// Add custom pattern for your framework
const customPattern = /myFramework\.import\(['"`]([^'"`]+)['"`]\)/g;
```

### **Selective Tracking**
Disable tracking for specific directories:

```javascript
// Modify ignored patterns in initializeFileWatcher()
ignored: [
  '**/node_modules/**',
  '**/dist/**',           // Add build directories
  '**/coverage/**',       // Add test coverage
  '**/your-custom-dir/**' // Add your custom directories
]
```

### **Integration with Memory System**
The dependency tracker integrates seamlessly with the Agent AI memory system:
- **Pinecone Integration**: Stores dependency vectors for similarity search
- **Local Fallback**: Works without external services
- **Context Awareness**: Maintains project context across sessions
- **Learning Patterns**: Identifies common dependency patterns

## 📚 Troubleshooting

### **Common Issues**

**Issue**: "Dependency tracking is disabled"
**Solution**: Enable memory in config and ensure `dependencyTrackingEnabled` is not false

**Issue**: File watcher not detecting changes
**Solution**: Check file permissions and ensure files are not in ignored directories

**Issue**: High CPU usage during file editing
**Solution**: Increase debounce delay or reduce monitored file patterns

**Issue**: Missing dependencies in analysis
**Solution**: Check if file patterns match your import syntax

### **Debug Information**
Enable detailed logging:
```bash
DEBUG=true npm run AAI:agent
```

Check dependency statistics:
```bash
dependencies stats
```

## 🤝 Contributing

To extend the dependency tracking system:

1. **Add New File Types**: Modify `watchPatterns` in `initializeFileWatcher()`
2. **Add Import Patterns**: Extend `extractDependencies()` method
3. **Custom Analyzers**: Create specialized dependency extractors
4. **Performance Improvements**: Optimize graph algorithms

## 🎉 Benefits

### **For Developers**
- ✅ **Automatic Context Updates** - AI stays informed about code changes
- ✅ **Refactoring Support** - Understand impact of changes across codebase
- ✅ **Real-time Analysis** - Get up-to-date suggestions as you code
- ✅ **Dependency Insights** - Visualize project structure and relationships

### **For AI Assistants**
- ✅ **Current Understanding** - Always have latest file analysis
- ✅ **Impact Awareness** - Know which files are affected by changes
- ✅ **Context Preservation** - Maintain project context across sessions
- ✅ **Pattern Recognition** - Learn from dependency patterns and relationships

### **For Projects**
- ✅ **Code Quality** - Better understanding leads to better suggestions
- ✅ **Architecture Insights** - Visualize and understand project structure
- ✅ **Maintenance Support** - Easier refactoring and updates
- ✅ **Technical Debt** - Identify complex dependencies and coupling

---

**🚀 The File Dependency Tracking System makes your Agent AI smarter by automatically maintaining current understanding of your codebase structure and relationships!** 
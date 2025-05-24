# 🤖 Agents System - Organized AI Agent Architecture

Welcome to the **reorganized** and **modular** agents system for the Agentic Coding Framework!

## 📁 **New Structure Overview**

```
agents/
├── self-improvement/          # 🧠 Self-Improvement Agent v2.0
│   ├── core/                 # Core functionality modules
│   │   ├── analyzer.js       # File analysis engine
│   │   ├── detector.js       # Pattern detection system
│   │   └── context.js        # Context management
│   ├── cli/                  # Command line interface
│   │   └── interface.js      # Interactive CLI
│   ├── config/               # Configuration files
│   │   └── default.json      # Default settings & patterns
│   ├── data/                 # Runtime data (gitignored)
│   ├── docs/                 # Documentation
│   └── index.js              # Main entry point
├── shared/                   # Shared utilities across agents
│   ├── utils/                # Common utility functions
│   └── types/                # Type definitions
└── README.md                 # This file
```

## 🚀 **Quick Start**

### Start the Self-Improvement Agent
```bash
# New modular version (recommended)
npm run agent

# Or directly
node agents/self-improvement/index.js

# Legacy version (still available)
npm run legacy
```

### Available Commands
```bash
🤖 > analyze <filename>        # Analyze specific .mdc file
🤖 > improve <filename>        # Get improvement suggestions  
🤖 > context <topic>           # Set current work context
🤖 > smart-detect              # Analyze based on context
🤖 > help                      # Show help
🤖 > exit                      # Stop agent
```

## ✨ **What's New in v2.0**

### 🏗️ **Modular Architecture**
- **Separated concerns** - each module has a single responsibility
- **Easy to maintain** - clear structure and organization
- **Extensible** - add new modules easily
- **Testable** - isolated components for better testing

### 🎯 **Enhanced Features**
- **Context-aware analysis** - understands your current work focus
- **Smart file detection** - automatically finds relevant files
- **Priority-based improvements** - focuses on high-impact issues
- **Detailed suggestions** - actionable steps with time estimates
- **Beautiful CLI** - colored output with clear formatting

### ⚡ **Performance Improvements**
- **No more full project scans** - only analyzes what you need
- **Efficient file searching** - smart pattern matching
- **Configurable patterns** - easily customizable detection rules
- **Context caching** - remembers your work patterns

## 🔧 **Configuration**

The agent is configured via `agents/self-improvement/config/default.json`:

```json
{
  "agent": {
    "name": "Self-Improvement Agent",
    "version": "2.0.0"
  },
  "patterns": {
    "security": [...],      // Security issue patterns
    "obsolete": {...},      // Outdated technology detection
    "bestPractices": [...]  // Best practice violations
  },
  "detectionRules": {
    "maxIssuesPerAnalysis": 5,
    "contextSensitive": true
  }
}
```

## 📊 **Usage Examples**

### Analyze a Specific File
```bash
🤖 > analyze getting_started
🔍 Analyzing: getting_started
📊 Found 2 improvement opportunities:
1. ⚠️ Technology: Outdated reference to React 16
   💡 Consider upgrading to React 18+ for better performance
```

### Context-Aware Analysis
```bash
🤖 > context workflow
📍 Context set to: workflow

🤖 > smart-detect
🎯 Smart detection for context: workflow
🎯 Found 3 relevant files
📊 Total issues detected: 5
```

## 🔄 **Migration from Legacy**

The old monolithic agent (`scripts/self_improvement_agent.js`) is still available but deprecated. 

**Benefits of migrating:**
- ✅ Faster performance (no full project scans)
- ✅ Better user experience (cleaner CLI)
- ✅ More maintainable code
- ✅ Enhanced features and capabilities

## 🛠️ **Development**

### Adding New Detection Patterns
Edit `agents/self-improvement/config/default.json`:

```json
{
  "patterns": {
    "obsolete": {
      "technology": {
        "Your Pattern": "Your suggestion message"
      }
    }
  }
}
```

### Extending Functionality
1. Create new modules in `agents/self-improvement/core/`
2. Import and integrate in `agents/self-improvement/index.js`
3. Add CLI commands in `agents/self-improvement/cli/interface.js`

## 📚 **Documentation**

- **Main Documentation**: `agents/self-improvement/docs/`
- **Configuration Guide**: `agents/self-improvement/config/default.json`
- **Legacy Documentation**: Original files in `.cursor/rules/`

## 🎉 **Next Steps**

1. **Try the new agent**: `npm run agent`
2. **Set your context**: `context <your-current-work>`
3. **Analyze files**: `analyze <filename>`
4. **Get smart suggestions**: `smart-detect`

This reorganized structure makes the self-improvement agent much more manageable, extensible, and powerful! 🚀 
# 🧠 Agent AI System

**Self-improving AI agent with intelligent memory and file dependency tracking**

## 🌟 Overview

The Agent AI System is a sophisticated, modular artificial intelligence agent designed to enhance your development workflow. It provides intelligent code analysis, suggestions, and learns from your patterns to become more effective over time.

## 📂 File Organization

**All JavaScript files have been organized into the `_store/` directory for better maintainability:**

```
agents/
├── self-improvement/           # 🧠 Main Agent System
│   ├── index.js               # Main agent entry point
│   ├── cli/interface.js       # Command line interface
│   ├── core/                  # Core agent modules
│   │   ├── FileDependencyManager.js # File dependency tracking
│   │   ├── analyzer.js        # File analysis engine
│   │   ├── context.js         # Context management
│   │   ├── detector.js        # Pattern detection
│   │   ├── fileManager.js     # File operations
│   │   └── memory.js          # Memory management
│   └── config/default.json    # Configuration
│
├── _store/                    # 📦 Organized Supporting Files
│   ├── scripts/               # 🛠️ Utility Scripts
│   │   ├── demo_agent.js      # Demo script (moved from root)
│   │   ├── setup-env.js       # Environment setup
│   │   ├── install-agent-ai.js # Universal installer
│   │   └── self_improvement_agent_legacy.js # Legacy compatibility
│   ├── tests/                 # 🧪 Test Suite
│   ├── docs/                  # 📚 Documentation
│   ├── templates/             # 📄 Configuration templates
│   ├── memory/                # 🧠 Memory storage
│   └── projects/              # 📁 Project data
│
└── utils/                     # 🔧 Migration utilities
```

## 🚀 Quick Start

### **Start the Agent**
```bash
npm run AAI:agent          # Interactive agent
npm run AAI:demo           # Quick demo
npm run AAI:setup-env      # Environment setup
```

### **Test Installation**
```bash
npm run AAI:test-system         # System tests
npm run AAI:test-dependencies   # Dependency tracking tests
npm run AAI:test-agent          # Agent functionality tests
```

## ✨ Key Features

### **🔍 Intelligent Analysis**
- Automatically detects code patterns and issues
- Provides context-aware suggestions
- Learns from your feedback to improve

### **🧠 Advanced Memory System**
- **Pinecone Integration**: Vector-based memory for similarity search
- **Local Fallback**: Works without external APIs
- **Learning Patterns**: Remembers successful patterns and solutions
- **Context Preservation**: Maintains project context across sessions

### **🔗 File Dependency Tracking**
- **Real-time Monitoring**: Watches file changes automatically
- **Dependency Mapping**: Tracks relationships between files
- **Cascade Updates**: Updates memory when dependencies change
- **Impact Analysis**: Shows which files are affected by changes

### **📁 Project Management**
- **Multi-project Support**: Organize work across different projects
- **File Migration**: Easy migration from legacy structures
- **Store Organization**: Clean, organized file storage system

## 🛠️ Available Commands

### **Analysis Commands**
```bash
analyze <filename>         # Analyze specific file
improve <filename>         # Get improvement suggestions
context <topic>           # Set current work context
smart-detect              # Context-based analysis
```

### **Memory Commands**
```bash
memory stats              # Memory system statistics
memory search <query>     # Search stored memories
memory cleanup [days]     # Clean old memories
```

### **Dependency Commands**
```bash
dependencies stats        # Dependency tracking stats
dependencies analyze <file> # Analyze file dependencies
dependencies info <file>  # Get dependency information
dependencies search <pattern> # Search by dependency pattern
dependencies graph        # Show dependency overview
dependencies reanalyze <file> # Force reanalysis
```

### **Project Commands**
```bash
projects list             # List available projects
projects set <name>       # Set current project
projects stats [name]     # Project statistics
projects overview         # All projects overview
```

## 🔧 Configuration

The system uses `agents/self-improvement/config/default.json` for configuration:

```json
{
  "agent": {
    "memoryEnabled": true,
    "fileStoreEnabled": true,
    "dependencyTrackingEnabled": true
  },
  "memory": {
    "enablePinecone": true,
    "enableOpenAI": true,
    "maxLocalMemories": 1000
  }
}
```

## 🌐 Environment Setup

Create a `.env` file with your API keys:

```bash
# Run the interactive setup
npm run AAI:setup-env

# Or manually create .env with:
PINECONE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PROJECT_NAME=my-project
```

**Note**: The agent works 100% locally without API keys, but enhanced features require Pinecone and OpenAI.

## 📚 Documentation

### **Core Documentation**
- **[File Organization](/_store/docs/FILE_ORGANIZATION.md)** - New file structure guide
- **[File Dependency Tracking](/_store/docs/FILE_DEPENDENCY_TRACKING.md)** - Dependency system documentation
- **[Installation Guide](/_store/docs/INSTALLATION_GUIDE.md)** - Installation instructions

### **Technical Docs**
- **Core Modules**: Located in `self-improvement/core/`
- **CLI Interface**: `self-improvement/cli/interface.js`
- **Configuration**: `self-improvement/config/default.json`

## 🧪 Testing

Comprehensive test suite to verify functionality:

```bash
npm run AAI:test-dependencies  # Test dependency tracking
npm run AAI:test-system        # Test core system
npm run AAI:test-agent         # Test agent functionality
```

## 🔄 Migration from Legacy

If upgrading from older versions:

```bash
# Old paths (deprecated)
node demo_agent.js
node scripts/self_improvement_agent.js

# New paths (current)
npm run AAI:demo
npm run AAI:legacy
```

## 🎯 Benefits of New Organization

### **✅ Clean Structure**
- No JavaScript files cluttering the root directory
- Clear separation of concerns
- Modular, maintainable architecture

### **✅ Enhanced Features**
- File dependency tracking with real-time updates
- Advanced memory system with vector search
- Comprehensive testing and documentation

### **✅ Developer Experience**
- Easy to find and modify components
- Clear upgrade path from legacy versions
- Comprehensive error handling and logging

### **✅ Production Ready**
- Universal installer for easy deployment
- Works with all AI coding assistants
- Scalable architecture for future enhancements

## 🤝 Contributing

To contribute to the Agent AI system:

1. **Core Agent**: Modify files in `self-improvement/`
2. **Utilities**: Add scripts to `_store/scripts/`
3. **Tests**: Add tests to `_store/tests/`
4. **Documentation**: Update docs in `_store/docs/`

## 🔮 Future Enhancements

The organized structure supports:
- **Plugin System**: Easy addition of new modules
- **Multiple Agent Types**: Support for specialized agents
- **Advanced Analytics**: Enhanced usage patterns and insights
- **Cloud Integration**: Seamless deployment to cloud platforms

---

**🎉 The Agent AI System is now organized, professional, and ready to enhance your development workflow with intelligent assistance and continuous learning!** 
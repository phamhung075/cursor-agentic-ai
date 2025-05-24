# 🗂️ Agent Store - Organized Agent AI Files

This directory contains all Agent AI working files, organized and separated from user project code.

## 📁 **Directory Structure**

```
agents/_store/
├── scripts/                  # 🔧 Agent utility scripts
│   └── setup-env.js         # Environment setup script
├── tests/                    # 🧪 Agent test files
│   ├── test_new_agent.js     # Agent functionality tests
│   ├── test_new_system.js    # System integration tests
│   └── test_autopilot_integration.js # AutoPilot integration tests
├── templates/                # 📄 Template files
│   └── environment-template.env # Environment configuration template
├── docs/                     # 📚 Agent documentation & completion reports
│   ├── AGENT_FILES_REORGANIZED.md # File reorganization summary
│   ├── AGENT_STORE_COMPLETE.md # Agent store implementation report
│   ├── AUTOPILOT_INTEGRATION_COMPLETE.md # AutoPilot integration report
│   ├── README_Self_Improvement_Agent.md # Agent documentation
│   ├── REORGANIZATION_COMPLETE.md # Agent reorganization report
│   └── SELF_IMPROVEMENT_INTEGRATION_SUMMARY.md # Integration summary
├── projects/                 # 📂 Project-specific working files
│   └── [project-name]/       # Individual project directories
├── memory/                   # 🧠 Pinecone memory storage
│   ├── embeddings/           # Vector embeddings cache
│   ├── contexts/             # Context memory
│   └── learning/             # Learning patterns
└── logs/                     # 📝 Agent operation logs
```

## 🚀 **Usage Commands**

### **Setup & Environment**
```bash
npm run AAI:setup-env         # Setup environment variables
```

### **Testing**
```bash
npm run AAI:test-agent        # Test agent functionality
npm run AAI:test-system       # Test system integration
npm run AAI:test-integration  # Test AutoPilot integration
```

### **Agent Operations**
```bash
npm run AAI:agent             # Start the agent
npm run AAI:migrate-files     # Migrate existing files
```

## 🎯 **File Organization Benefits**

### **✅ Clean Separation**
- Agent working files separated from user project code
- No more cluttered project root directory
- Organized by function and purpose

### **✅ Easy Maintenance**
- All agent-related files in one location
- Clear structure for finding and updating files
- Consistent organization across projects

### **✅ Better Security**
- Agent files properly gitignored
- Sensitive data isolated and protected
- Clear boundaries between agent and user code

## 🔧 **Development Guidelines**

### **Adding New Scripts**
Place utility scripts in `scripts/` directory:
```bash
agents/_store/scripts/your-new-script.js
```

### **Adding New Tests**
Place test files in `tests/` directory:
```bash
agents/_store/tests/test-your-feature.js
```

### **Adding New Templates**
Place template files in `templates/` directory:
```bash
agents/_store/templates/your-template.extension
```

### **Adding New Documentation**
Place documentation files in `docs/` directory:
```bash
agents/_store/docs/your-documentation.md
```

## 🛡️ **Security Notes**

- All directories in `_store/` are gitignored except templates
- Sensitive data (API keys, project files) automatically protected  
- Templates are committed but actual working files are not
- Environment files are never committed to repository

## 📖 **Related Documentation**

- **Agent Documentation**: `../self-improvement/docs/`
- **Configuration Guide**: `../self-improvement/config/default.json`
- **Main Agent Code**: `../self-improvement/`

---

**🎉 This organized structure keeps your Agent AI files clean, secure, and maintainable!** 
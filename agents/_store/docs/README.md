# 🤖 Agentic Coding Framework + Cursor Integration

**Self-improving AI agent with complete Cursor IDE integration**

## 🚀 **Quick Start (One Command)**

### **Single Command Launch:**
```bash
npm run launch
```

This **one command** does everything:
- ✅ Sets up Cursor integration automatically
- ✅ Launches all AAI components (Agent, Auto-Sync, Memory, Monitoring)
- ✅ Starts continuous improvement cycles
- ✅ Keeps everything running and synchronized
- ✅ Provides automatic recovery and health monitoring

## 🎯 **How to Use AAI with Cursor**

### **In Cursor IDE:**
1. **Press `Ctrl/Cmd + P`** → type any script name to find it instantly
2. **Open** `agents/_store/cursor-summaries/script-summary.json` for overview
3. **Check** `script-improvements.json` for actionable improvements
4. **Use terminal** for manual commands when needed

### **Key Manual Commands (when needed):**
```bash
npm run AAI:cleanup            # Manual cleanup operations
npm run AAI:memory-index       # View preserved code memory
npm run AAI:sync-preserved     # Manual memory sync
npm run AAI:test-*            # Run specific tests
npm run cursor:auto-sync-status # Check integration status
```

## 📋 **What's Integrated**

- **Complete AAI System** with single-command launch
- **10+ Active Scripts** automatically discoverable in Cursor
- **30+ NPM commands** cataloged and searchable
- **Real-time script awareness** with auto-sync
- **Improvement suggestions** with time estimates
- **Complete workspace symbols** for navigation
- **Memory preservation** of all useful code
- **Continuous monitoring** and auto-recovery

## 📂 **Key Files & Directories**

### **Documentation:**
- `agents/_store/docs/COMPLETE-LAUNCHER-README.md` - Complete launcher guide
- `agents/_store/docs/CLEANUP-AND-MEMORY-INTEGRATION-SUMMARY.md` - Recent cleanup summary

### **System Files:**
- `agents/_store/scripts/launch-aai-complete.js` - Main launcher
- `agents/_store/cursor-summaries/` - All script awareness files
- `agents/_store/memory/` - Preserved code memory
- `.cursor/settings.json` - Cursor integration settings

### **Active Scripts:**
- `agents/_store/scripts/` - All AAI utility scripts
- `agents/_store/tests/` - All test files

## 🔧 **System Status**

### **Current State:**
- ✅ **Clean codebase** (76% file reduction from recent cleanup)
- ✅ **Single launch command** for all functionality
- ✅ **Complete Cursor integration** with auto-sync
- ✅ **Memory preservation** of all useful code in Pinecone
- ✅ **Continuous improvement** cycles running automatically
- ✅ **Health monitoring** and auto-recovery

### **File Organization:**
```
agents/
├── cursor-integration/     # Cursor IDE integration
├── self-improvement/      # Main AAI agent
├── shared/               # Shared utilities
└── _store/
    ├── scripts/          # All AAI scripts (moved from root)
    ├── docs/            # Documentation (moved from root)
    ├── memory/          # Preserved code memory
    ├── cursor-summaries/ # Cursor integration files
    └── archive/         # Safely archived obsolete files
```

## 🚨 **Troubleshooting**

### **If Launch Fails:**
1. **Check Node.js version**: `node --version` (needs >=14.0.0)
2. **Install dependencies**: `npm install`
3. **Check file permissions**: `ls -la agents/_store/scripts/launch-aai-complete.js`

### **If Cursor Integration Issues:**
- The system auto-regenerates Cursor files
- Check `.cursor/settings.json` exists
- Run `npm run cursor:auto-sync-status` to check status

### **If Memory Sync Issues:**
- Check `npm run AAI:sync-preserved-status`
- Verify Pinecone configuration in environment

## 🎉 **Success Test**

1. Open this project in Cursor
2. Run `npm run launch` in terminal
3. Press `Ctrl/Cmd + P` in Cursor
4. Type "script-summary" and open the file
5. **You're ready to code with full AAI assistance!** 🚀

---

**🤖 Your complete AAI system is ready with one-command launch and full Cursor integration!** 
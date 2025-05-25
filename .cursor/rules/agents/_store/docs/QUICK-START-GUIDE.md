# 🚀 Quick Start: Complete AAI System

## 📂 **When You Open This Project**

### **Step 1: Open Project in Cursor**
```bash
# Navigate to project directory
cd /Users/admin/Documents/Hung/AI/cursor-agentic-ai

# Open in Cursor
cursor .
```

### **Step 2: Launch Complete AAI System (One Command)**
```bash
# This single command does everything:
npm run launch
```

**What this does automatically:**
- ✅ Sets up Cursor integration
- ✅ Launches AAI Agent with interactive mode
- ✅ Starts Auto-Sync for real-time Cursor updates
- ✅ Initializes Memory Sync with Pinecone
- ✅ Begins Core Monitoring and health checks
- ✅ Starts continuous improvement cycles
- ✅ Provides automatic recovery and error handling

### **Step 3: Verify Everything is Working**
```bash
# Check system status (in another terminal)
npm run cursor:auto-sync-status
```

## 🎯 **How to Use AAI with Cursor**

### **Method 1: Interactive AAI Agent**
The AAI agent runs automatically with the launcher in interactive mode:
```
🤖 AAI Agent ready for interaction!
🤖 > help                    # Get help
🤖 > analyze src/           # Analyze specific directory  
🤖 > improve               # Get improvement suggestions
🤖 > context set project   # Set project context
```

### **Method 2: Direct Commands in Cursor Terminal**
Open Cursor's integrated terminal (`Ctrl/Cmd + ` `) for manual operations:

```bash
# Manual operations (when needed)
npm run AAI:cleanup         # Run cleanup operations
npm run AAI:memory-index    # View preserved code memory
npm run AAI:sync-preserved  # Manual memory sync
npm run AAI:test-agent      # Run agent tests
```

### **Method 3: Quick File Access in Cursor**
1. **Press `Ctrl/Cmd + P`** (Quick Open)
2. **Type script names** to find AAI scripts instantly
3. **Open awareness files:**
   - Type `script-summary` → Open overview
   - Type `script-improvements` → See suggestions
   - Type `script-catalog` → Browse all scripts

## 🔧 **Essential Information**

### **System is Running When You See:**
```
✅ AAI SYSTEM FULLY OPERATIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SYSTEM STATUS:
   ✅ cursorIntegration
   ✅ aaiAgent  
   ✅ autoSync
   ✅ monitoring
   ✅ memorySync

🔄 [Time] Health check...
🔄 [Time] Improvement cycle #1
📊 System uptime: X minutes | Cycles: X
```

### **Available Manual Commands:**
```bash
# System Management
npm run launch                    # Start complete AAI system
npm run cursor:auto-sync-status   # Check integration status

# Memory & Cleanup
npm run AAI:cleanup              # Manual cleanup operations
npm run AAI:memory-index         # View memory index
npm run AAI:sync-preserved       # Sync preserved code
npm run AAI:sync-preserved-status # Check memory sync status

# Testing & Analysis  
npm run AAI:test-agent           # Test AAI agent
npm run AAI:test-system          # Test system integration
npm run AAI:scripts-analyze      # Analyze script usage
npm run AAI:core-health          # Check core framework health
```

## 📋 **What Cursor Can Now Do with AAI**

### **🔍 Automatic Script Discovery**
- **Press `Ctrl/Cmd + P`** → type any script name
- **All 10+ active scripts** are instantly searchable
- **NPM commands** are auto-cataloged and discoverable

### **💡 Smart Suggestions**
- **Open** `.cursor/rules/agents/_store/cursor-summaries/script-improvements.json`
- **See actionable improvements** with time estimates
- **Get context-aware recommendations** updated automatically

### **🎯 Quick Navigation**
- **Workspace symbols** for all AAI scripts
- **Category-based organization** in file explorer
- **Direct links** to script files and documentation

## 🚀 **Typical Workflow**

### **1. Project Startup:**
```bash
# Open project in Cursor
cursor .

# Start complete AAI system (one command)
npm run launch
```

### **2. During Development:**
- **AAI agent runs interactively** - ask it questions directly
- **Auto-sync keeps Cursor updated** automatically
- **Check improvements** via Quick Open (`Ctrl/Cmd + P` → "script-improvements")
- **All processes run continuously** with health monitoring

### **3. Manual Operations (when needed):**
```bash
# Check system status
npm run cursor:auto-sync-status

# Run cleanup
npm run AAI:cleanup

# View memory
npm run AAI:memory-index
```

## 📂 **Key Files to Know**

### **Quick Access Files (via Ctrl/Cmd + P):**
- `script-summary.json` - Complete overview of all scripts
- `script-improvements.json` - Actionable improvement suggestions  
- `script-catalog.json` - Detailed script catalog
- `script-workspace-symbols.json` - Cursor workspace symbols

### **Documentation:**
- `.cursor/rules/agents/_store/docs/COMPLETE-LAUNCHER-README.md` - Complete launcher guide
- `.cursor/rules/agents/_store/docs/CLEANUP-AND-MEMORY-INTEGRATION-SUMMARY.md` - Recent cleanup summary

### **System Files:**
- `.cursor/rules/agents/_store/scripts/launch-aai-complete.js` - Main launcher
- `.cursor/rules/agents/_store/memory/` - Preserved code memory
- `.cursor/settings.json` - Cursor integration settings

## 🔧 **Troubleshooting**

### **If Launch Fails:**
```bash
# Check Node.js version (needs >=14.0.0)
node --version

# Reinstall dependencies
npm install

# Check file permissions
ls -la .cursor/rules/agents/_store/scripts/launch-aai-complete.js
```

### **If AAI Agent Doesn't Respond:**
- The agent runs interactively in the launch terminal
- Look for the `🤖 >` prompt
- Type `help` for available commands

### **If Cursor Doesn't See Scripts:**
```bash
# Check auto-sync status
npm run cursor:auto-sync-status

# The system auto-regenerates files, but you can force update:
npm run cursor:auto-sync
```

### **If Memory Sync Issues:**
```bash
# Check memory sync status
npm run AAI:sync-preserved-status

# Manual memory sync
npm run AAI:sync-preserved
```

## ✅ **Success Indicators**

You'll know everything is working when:
- ✅ **Launch shows** "✅ AAI SYSTEM FULLY OPERATIONAL"
- ✅ **AAI agent shows** interactive `🤖 >` prompt
- ✅ **Cursor finds scripts** when you press `Ctrl/Cmd + P`
- ✅ **Auto-sync shows** periodic "✅ Full sync completed"
- ✅ **Health checks** appear every minute in the terminal
- ✅ **Improvement cycles** run every 5 minutes automatically

## 🎉 **You're Ready!**

**Your complete AAI system is now running with full Cursor integration!**

**Quick test:**
1. In the launch terminal, type at the `🤖 >` prompt: `help`
2. Press `Ctrl/Cmd + P` in Cursor and type "script-summary"
3. Open the file to see all your scripts
4. **Start coding with full AAI assistance!** 🚀

**To stop the system:** Press `Ctrl+C` in the launch terminal for graceful shutdown. 
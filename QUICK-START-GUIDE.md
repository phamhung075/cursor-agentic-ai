# 🚀 Quick Start: Cursor + AAI Integration

## 📂 **When You Open This Project**

### **Step 1: Open Project in Cursor**
```bash
# Navigate to project directory
cd /Users/admin/Documents/Hung/AI/cursor-agentic-ai

# Open in Cursor
cursor .
```

### **Step 2: Initialize AAI Integration (One-time setup)**
```bash
# Install dependencies
npm install

# Setup Cursor integration
npm run cursor:setup

# Generate initial script awareness
npm run cursor:script-awareness
```

### **Step 3: Start AAI Agent**
```bash
# Start the AAI agent
npm run AAI:start
```

### **Step 4: Enable Auto-Sync (Recommended)**
```bash
# In a new terminal, start auto-sync
npm run cursor:auto-sync
```

## 🎯 **How to Tell Cursor to Use AAI**

### **Method 1: Direct Commands in Cursor Terminal**
Open Cursor's integrated terminal (`Ctrl/Cmd + ` `) and run:

```bash
# Start AAI agent
npm run AAI:start

# Or start specific AAI functions
npm run AAI:analyze     # Analyze current code
npm run AAI:improve     # Get improvement suggestions
npm run AAI:scripts-list # See all available scripts
```

### **Method 2: Use Cursor's Command Palette**
1. **Press `Ctrl/Cmd + Shift + P`**
2. **Type "Terminal: Run Task"**
3. **Select any AAI command:**
   - `AAI:start` - Start the agent
   - `AAI:analyze` - Analyze code
   - `cursor:script-awareness` - Update script awareness

### **Method 3: Quick File Access**
1. **Press `Ctrl/Cmd + P`** (Quick Open)
2. **Type script names** to find AAI scripts instantly
3. **Open awareness files:**
   - Type `script-summary` → Open overview
   - Type `script-improvements` → See suggestions
   - Type `script-catalog` → Browse all scripts

## 🔧 **Essential Commands for Daily Use**

### **Starting AAI:**
```bash
npm run AAI:start          # Start interactive AAI agent
npm run cursor:auto-sync   # Keep Cursor updated automatically
```

### **Getting Help:**
```bash
npm run AAI:scripts-help   # See all available scripts
npm run cursor:auto-sync-status  # Check integration status
```

### **Analyzing Code:**
```bash
npm run AAI:analyze        # Analyze current project
npm run AAI:core-status    # Check core framework status
npm run AAI:scripts-analyze # Analyze script usage
```

## 📋 **What Cursor Can Now Do with AAI**

### **🔍 Automatic Script Discovery**
- **Press `Ctrl/Cmd + P`** → type any script name
- **All 16+ scripts** are instantly searchable
- **NPM commands** are auto-cataloged

### **💡 Smart Suggestions**
- **Open** `agents/_store/cursor-summaries/script-improvements.json`
- **See actionable improvements** with time estimates
- **Get context-aware recommendations**

### **🎯 Quick Navigation**
- **Workspace symbols** for all AAI scripts
- **Category-based organization**
- **Direct links to script files**

## 🚀 **Typical Workflow**

### **1. Project Startup:**
```bash
# Open project
cursor .

# Start AAI (in Cursor terminal)
npm run AAI:start

# Start auto-sync (in second terminal)
npm run cursor:auto-sync
```

### **2. During Development:**
- **Use AAI commands** through Cursor terminal
- **Check script improvements** via Quick Open (`Ctrl/Cmd + P`)
- **Let auto-sync** keep everything updated automatically

### **3. Getting AAI Help:**
```bash
# In Cursor terminal:
🤖 > help                 # AAI agent help
🤖 > analyze src/         # Analyze specific directory
🤖 > improve              # Get improvement suggestions
🤖 > context set project  # Set project context
```

## 📂 **Key Files to Know**

### **Quick Access Files:**
- `agents/_store/cursor-summaries/script-summary.json` - Overview
- `agents/_store/cursor-summaries/script-improvements.json` - Suggestions
- `CURSOR-SCRIPT-INTEGRATION-GUIDE.md` - Complete guide

### **Configuration Files:**
- `.cursor/settings.json` - Cursor integration settings
- `package.json` - All AAI commands listed

## 🔧 **Troubleshooting**

### **If AAI doesn't start:**
```bash
npm install              # Reinstall dependencies
npm run AAI:test-startup # Test AAI startup
```

### **If Cursor doesn't see scripts:**
```bash
npm run cursor:manual-sync  # Force update
npm run cursor:setup       # Re-setup integration
```

### **If auto-sync isn't working:**
```bash
npm run cursor:auto-sync-status  # Check status
npm run cursor:auto-sync         # Restart auto-sync
```

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ **AAI agent starts** with interactive prompt
- ✅ **Cursor finds scripts** when you press `Ctrl/Cmd + P`
- ✅ **Auto-sync shows** "✅ Full sync completed"
- ✅ **Script improvements** appear in cursor-summaries/

## 🎉 **You're Ready!**

**Cursor is now fully integrated with your AAI agent!**

**Quick test:**
1. Press `Ctrl/Cmd + P` in Cursor
2. Type "script-summary" 
3. Open the file to see all your scripts
4. Start coding with AAI assistance! 🚀 
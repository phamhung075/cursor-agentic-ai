# 🤖 Agentic Coding Framework + Cursor Integration

**Self-improving AI agent with complete Cursor IDE integration**

## 🚀 **Quick Start (When You Open This Project)**

### **One Command Setup:**
```bash
npm run start-cursor-aai
```

This will:
- ✅ Setup Cursor integration automatically
- ✅ Generate script awareness for all 16+ scripts
- ✅ Show you exactly what to do next
- ✅ Optionally start the AAI agent

### **Manual Steps:**
```bash
# 1. Setup Cursor integration
npm run cursor:setup

# 2. Generate script awareness
npm run cursor:script-awareness

# 3. Start AAI agent
npm run AAI:start

# 4. Enable auto-sync (in new terminal)
npm run cursor:auto-sync
```

## 🎯 **How to Use AAI with Cursor**

### **In Cursor IDE:**
1. **Press `Ctrl/Cmd + P`** → type any script name to find it instantly
2. **Open** `agents/_store/cursor-summaries/script-summary.json` for overview
3. **Check** `script-improvements.json` for actionable improvements
4. **Use terminal** for AAI commands: `npm run AAI:start`

### **Key Commands:**
```bash
npm run AAI:start              # Start interactive AAI agent
npm run AAI:scripts-list       # See all available scripts
npm run cursor:auto-sync       # Keep Cursor updated automatically
npm run cursor:auto-sync-status # Check integration status
```

## 📋 **What's Integrated**

- **16+ Scripts** automatically discoverable in Cursor
- **28+ NPM commands** cataloged and searchable
- **Real-time script awareness** with auto-sync
- **Improvement suggestions** with time estimates
- **Complete workspace symbols** for navigation

## 📂 **Key Files**

- `QUICK-START-GUIDE.md` - Complete startup instructions
- `CURSOR-SCRIPT-INTEGRATION-GUIDE.md` - Detailed integration guide
- `agents/_store/cursor-summaries/` - All script awareness files
- `.cursor/settings.json` - Cursor integration settings

## 🔧 **Troubleshooting**

```bash
npm run start-cursor-aai status  # Check integration status
npm run cursor:manual-sync       # Force update script awareness
npm run AAI:scripts-help         # See all available scripts
```

## 🎉 **Success Test**

1. Open this project in Cursor
2. Press `Ctrl/Cmd + P`
3. Type "script-summary"
4. Open the file to see all your scripts
5. **You're ready to code with AAI assistance!** 🚀

---

**🤖 Your AAI agent is ready to help with code analysis, improvements, and automation!** 
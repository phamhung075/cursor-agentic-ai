# 📋 Organizational Rules & File Structure

## 🚨 **CRITICAL RULES**

**Never save any file in root unless specifically requested by user.**

### 📁 **Correct File Locations:**

#### **For AAI Scripts:**
- ✅ `agents/_store/scripts/` - All AAI utility scripts
- ❌ Root directory - Never save scripts here

#### **For Tests:**
- ✅ `agents/_store/tests/` - All test files go here
- ❌ `test_*.js` in root - Never save here

#### **For Documentation:**
- ✅ `agents/_store/docs/` - AAI documentation and guides
- ❌ `*.md` in root - Never save documentation here

#### **For Agent Files:**
- ✅ `agents/self-improvement/` - Main AAI agent
- ✅ `agents/cursor-integration/` - Cursor IDE integration
- ✅ `agents/shared/` - Shared utilities
- ✅ `agents/_store/` - All AAI storage and utilities

#### **For Project Code:**
- ✅ `src/[project]/` - Project-specific code
- ✅ `.cursor/` - Cursor rules and configuration

---

## 🏗️ **Current System Architecture**

### **Directory Structure:**
```
cursor-agentic-ai/
├── package.json                    # Main project config
├── .cursor/                        # Cursor IDE settings
├── agents/
│   ├── self-improvement/          # Main AAI agent
│   ├── cursor-integration/        # Cursor integration
│   ├── shared/                    # Shared utilities
│   └── _store/
│       ├── scripts/              # All AAI scripts (moved from root)
│       ├── docs/                 # Documentation (moved from root)
│       ├── memory/               # Preserved code memory
│       ├── tests/                # All test files
│       ├── cursor-summaries/     # Cursor integration files
│       └── archive/              # Archived obsolete files
└── src/
    └── [project]/                # Project-specific code
```

### **Launch System:**
- **Single Entry Point:** `npm run launch`
- **Main Launcher:** `agents/_store/scripts/launch-aai-complete.js`
- **All Components:** Launched and managed automatically

---

## 🔧 **File Organization Rules**

### **For AI Agents Creating Files:**

1. **Scripts:** Always save in `agents/_store/scripts/[category]/`
2. **Tests:** Always save in `agents/_store/tests/[category]/`
3. **Documentation:** Always save in `agents/_store/docs/`
4. **Never save in root** unless explicitly requested

### **Naming Conventions:**
```
Scripts: action_target_description.js
Tests:   test_component_functionality.js
Docs:    DESCRIPTIVE_NAME.md
```

### **NPM Script Registration:**
```javascript
// All AAI scripts should be registered with AAI: prefix
"AAI:script-name": "node agents/_store/scripts/category/script-name.js"
```

---

## 🚨 **Critical Protections**

### **Prevent Recursive Loops:**
```javascript
// CRITICAL: Never track any _store files to prevent recursion
if (filePath.includes('_store') || 
    filePath.includes('memory') ||
    filePath.includes('node_modules')) {
  return false;
}
```

### **File Watching Patterns:**
```javascript
const watchPatterns = [
  'src/**/*.js',                        # Project source code
  'agents/self-improvement/**/*.js',    # AAI agent files
  'agents/cursor-integration/**/*.js',  # Cursor integration
  'agents/shared/**/*.js',              # Shared utilities
  'package.json',                       # Main config
  '.cursor/**/*'                        # Cursor settings
];
```

### **Ignored Patterns:**
```javascript
ignored: [
  '**/node_modules/**',     # Dependencies
  'agents/_store/**',       # CRITICAL: All _store files
  '**/memory/**',           # Memory directories
  '**/archive/**'           # Archived files
]
```

---

## 🎯 **Usage Guidelines**

### **For Development:**

1. **Use Single Launch:** `npm run launch` starts everything
2. **Manual Operations:** Use `npm run AAI:*` commands when needed
3. **File Creation:** Always use proper directory structure
4. **Testing:** All tests in `agents/_store/tests/`

### **Path References:**
```javascript
// Correct way to reference files from tests
const launcher = require('../../scripts/launch-aai-complete.js');
const agent = require('../../../self-improvement/index.js');
```

---

## 📊 **System Health**

### **Current Status:**
- ✅ **Clean file structure** (76% reduction from cleanup)
- ✅ **Single launch command** for all functionality
- ✅ **No recursive loops** in file watching
- ✅ **Proper memory management** with Pinecone
- ✅ **Automated monitoring** and recovery

### **Performance Metrics:**
- **Active Scripts:** 10+ (organized and discoverable)
- **NPM Commands:** 30+ (cataloged and functional)
- **Memory Usage:** Optimized with preserved code system
- **File Organization:** Clean and maintainable

---

## 🔄 **Maintenance Commands**

### **System Management:**
```bash
npm run launch                    # Start complete AAI system
npm run AAI:cleanup              # Manual cleanup operations
npm run AAI:memory-index         # View preserved code memory
```

### **Health Checks:**
```bash
npm run cursor:auto-sync-status  # Check Cursor integration
npm run AAI:core-health          # Check core framework
npm run AAI:scripts-analyze      # Analyze script usage
```

---

**Last Updated:** May 2025  
**Status:** ✅ All systems operational with single-command launch 
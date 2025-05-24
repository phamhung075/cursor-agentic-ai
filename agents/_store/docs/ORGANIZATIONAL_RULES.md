# 📋 Organizational Rules & Critical Fixes

## 🚨 **CRITICAL RULE ESTABLISHED**

**Never save any file in root unless specifically requested by user.**

### 📁 **Correct File Locations:**

#### **For Tests:**
- ✅ `agents/_store/tests/` - All test files go here
- ❌ `test_*.js` in root - Never save here

#### **For Agent Files:**
- ✅ `./agents/` - Agent-related code and modules
- ✅ `./.cursor/` - Cursor rules and configuration
- ✅ `./scripts/` - Utility and maintenance scripts

#### **For Documentation:**
- ✅ `agents/_store/docs/` - Agent documentation and guides

---

## 🔧 **Critical Fixes Implemented**

### 1. **Recursive Dependency Loop Prevention**
**Problem:** Agent was tracking its own memory files, causing infinite recursion and memory crash.

**Solution:**
- Completely excluded `agents/_store/**` from file watching
- Added multiple layers of protection against recursion
- Reduced file watching patterns to be more selective

```javascript
// CRITICAL: Never track any _store files to prevent recursion
if (filePath.includes('_store') || 
    filePath.includes('memory') ||
    // ... other exclusions
) {
  return false;
}
```

### 2. **Selective File Tracking**
**Before:** Tracked all files including node_modules, causing performance issues.

**After:** Only tracks project-relevant files:
- Project documentation (`.mdc`, `.md`)
- Source code in `src/` only
- Core agent files (specific paths)
- Essential config files
- Script files

### 3. **Reduced Memory Storage Frequency**
**Before:** Stored every dependency change immediately.

**After:** Batched storage:
- Dependency memory: Only every 5th update
- Dependency graph: Only every 10th change
- Only stores meaningful dependencies

### 4. **Proper File Organization**
**Before:** Test files scattered in root.

**After:** All files in correct locations:
- Tests: `agents/_store/tests/`
- Docs: `agents/_store/docs/` 
- Scripts: `scripts/`

---

## ✅ **Current Status**

### **Performance Metrics:**
- **Dependencies tracked:** 0 (clean start)
- **Agent memory:** 5 entries (normal system data)
- **No recursive loops:** ✅ Fixed
- **No memory crashes:** ✅ Fixed
- **Proper file organization:** ✅ Implemented

### **File Watching Patterns:**
```javascript
const watchPatterns = [
  '**/*.mdc',                           // Project docs
  '**/*.md',                            // Markdown files
  'src/**/*.js',                        // Source JS only
  '.cursor/rules/**/*.mdc',             // Cursor rules
  'agents/self-improvement/core/**/*.js', // Core agent files
  'scripts/**/*.js',                    // Scripts
  'package.json',                       // Root config
  '*.json'                              // Root configs only
];
```

### **Ignored Patterns:**
```javascript
ignored: [
  '**/node_modules/**',     // All node_modules
  'agents/_store/**',       // CRITICAL: All _store files
  '**/agents/_store/**',    // Additional protection
  '**/*memory*/**',         // Any memory directories
  '**/test_*.js'            // Test files in root
]
```

---

## 🎯 **Usage Guidelines**

### **For Future Development:**

1. **Test Files:** Always save in `agents/_store/tests/`
2. **Documentation:** Always save in `agents/_store/docs/`
3. **Agent Code:** Save in appropriate `agents/` subdirectories
4. **Scripts:** Save in `scripts/` directory
5. **Root Files:** Only save when explicitly requested by user

### **Path References in Tests:**
```javascript
// Correct way to reference agent from tests
const SelfImprovementAgent = require('../../self-improvement/index.js');
```

---

## 📊 **Monitoring**

The agent now provides clean output without excessive "Stored agent memory: dependencies" spam:

```
📊 Current Dependency Stats:
  📁 Total Files Tracked: 0
  🔗 Total Dependencies: 0
  👀 File Watcher Active: Yes (no recursion)
```

---

## 🔄 **Maintenance**

### **Clean Dependency Memory:**
```bash
node scripts/clean_dependency_memory.js
```

### **Test Agent:**
```bash
node agents/_store/tests/test_clean_agent.js
```

### **Analysis Demo:**
```bash
node agents/_store/tests/test_agent_analysis.js
```

---

**Last Updated:** December 2024  
**Status:** ✅ All critical issues resolved 
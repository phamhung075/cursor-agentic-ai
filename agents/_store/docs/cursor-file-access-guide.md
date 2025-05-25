# 📁 Cursor File Access Guide

## 🎯 **Where Can Cursor Read AAI Files?**

**Answer: ANYWHERE in your workspace!** Cursor isn't limited to `.cursor/` directories.

## 🔄 **Option 1: Keep in Existing `agents/*` Structure** (Recommended)

### ✅ Advantages:
- **No file duplication** - use existing AAI memory/analysis files
- **Consistent with your project structure**
- **AAI agent already writing there**
- **Single source of truth**

### 📂 Current Structure Works:
```
agents/
├── _store/
│   ├── memory/
│   │   ├── agent/*.json          ← Cursor can read these!
│   │   └── project/*.json        ← Cursor can read these!
│   └── analysis/
│       └── *.json                ← Cursor can read these!
└── self-improvement/
    └── outputs/*.json            ← Cursor can read these!
```

### 🔧 Integration Script:
```javascript
// agents/cursor-integration/bridge.js
const fs = require('fs');
const path = require('path');

class CursorAAIBridge {
  constructor() {
    this.memoryPath = 'agents/_store/memory';
    this.analysisPath = 'agents/_store/analysis';
  }

  // Read existing AAI memory for Cursor
  getLatestAnalysis() {
    const agentMemory = this.readMemoryFiles(`${this.memoryPath}/agent`);
    const projectMemory = this.readMemoryFiles(`${this.memoryPath}/project`);
    
    return {
      agentInsights: agentMemory,
      projectContext: projectMemory,
      recommendations: this.generateRecommendations(agentMemory, projectMemory)
    };
  }

  // Generate Cursor-friendly summary from existing files
  generateCursorSummary() {
    const analysis = this.getLatestAnalysis();
    
    // Write summary to existing agents structure
    const summaryPath = 'agents/_store/analysis/cursor-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      source: 'AAI Agent Memory → Cursor Bridge',
      summary: analysis
    }, null, 2));
    
    console.log(`📋 Cursor summary generated: ${summaryPath}`);
    return summaryPath;
  }
}
```

## 🔄 **Option 2: Mirror to `.cursor/`** (Clean but Duplicated)

### ✅ Advantages:
- **Clean separation** of IDE-specific files
- **Follows IDE conventions**
- **Easy to gitignore** if needed

### ⚠️ Disadvantages:
- **File duplication**
- **Sync overhead**
- **Two sources of truth**

### 📂 Structure:
```
.cursor/
├── aai/
│   ├── analysis/         ← Mirrored from agents/_store/
│   ├── memory/          ← Mirrored from agents/_store/
│   └── summaries/       ← Generated summaries
└── rules/               ← Optional: Cursor-specific rules
```

## 🔄 **Option 3: Hybrid Approach** (Best of Both)

### 📂 Structure:
```
agents/_store/           ← Original AAI data (source of truth)
├── memory/
├── analysis/
└── cursor-integration/  ← Cursor-specific exports
    ├── latest-analysis.json
    ├── workspace-context.json
    └── recommendations.json

.cursor/                 ← Optional: IDE-specific configs only
└── settings/
    ├── file-associations.json
    └── workspace-symbols.json
```

## 🛠 **Implementation Examples**

### **Using Existing `agents/*` Files:**
```javascript
// Cursor can directly read from agents/ directory
const analysisPath = 'agents/_store/memory/project/current-analysis.json';
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Use in Cursor as workspace context
```

### **Cursor Settings for `agents/*` Integration:**
```json
// .cursor/settings.json or .vscode/settings.json
{
  "files.associations": {
    "agents/**/*.json": "json",
    "agents/**/*.analysis": "json"
  },
  "files.watcherExclude": {
    "**/agents/_store/memory/**": false,
    "**/agents/_store/analysis/**": false
  },
  "search.include": {
    "agents/_store/memory": true,
    "agents/_store/analysis": true
  }
}
```

## 🎯 **Recommended Approach**

### **Keep using `agents/*` structure + Add Cursor integration:**

1. **Primary data stays in `agents/_store/`**
2. **Add Cursor integration layer:**

```javascript
// agents/cursor-integration/index.js
class CursorIntegration {
  constructor() {
    this.sourcePath = 'agents/_store';
    this.integration = {
      // Generate summaries without moving files
      generateWorkspaceContext: () => this.createContextFromMemory(),
      generateRecommendations: () => this.createRecsFromAnalysis(),
      // Create symbolic links or references instead of copying
      linkToIDEFormats: () => this.createIDEReferences()
    };
  }
}
```

3. **Add package.json scripts:**
```json
{
  "scripts": {
    "AAI:cursor-sync": "node agents/cursor-integration/index.js",
    "AAI:cursor-summary": "node agents/cursor-integration/summary.js",
    "AAI:cursor-watch": "chokidar 'agents/_store/**/*.json' -c 'npm run AAI:cursor-sync'"
  }
}
```

## 📋 **Quick Setup for Current Structure**

### 1. **Make Cursor aware of `agents/` files:**
```bash
# Add to Cursor workspace settings
echo '{
  "files.associations": {
    "agents/**/*.json": "json"
  },
  "files.watcherExclude": {
    "**/agents/_store/**": false
  }
}' > .cursor/settings.json
```

### 2. **Create integration script:**
```bash
mkdir -p agents/cursor-integration
```

### 3. **Test Cursor access:**
```bash
# Cursor can open these directly:
# - agents/_store/memory/agent/*.json
# - agents/_store/memory/project/*.json
# - Any analysis files AAI creates
```

## ✅ **Final Answer:**

**You DON'T need to move files to `.cursor/`**

**Cursor can read from `agents/*` perfectly fine!**

Just add proper file associations and make sure Cursor knows about your directory structure. This keeps your existing AAI workflow intact while giving Cursor full access. 
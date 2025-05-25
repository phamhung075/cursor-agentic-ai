# 🤖 AAI → Cursor Integration Guide

## Overview
Your AAI (Agentic AI) agent generates rich analysis that Cursor can consume through multiple integration methods.

## 🔗 Integration Methods

### 1. **File-Based Output** (Recommended)
AAI can save analysis results to files that Cursor automatically picks up:

```bash
# In AAI Terminal
🤖 > analyze src/components/UserProfile.jsx

# AAI outputs to: .cursor/aai-analysis.json
{
  "file": "src/components/UserProfile.jsx",
  "timestamp": "2024-01-15T10:30:00Z",
  "improvements": [
    {
      "category": "Performance",
      "issue": "Missing React.memo optimization",
      "suggestion": "Wrap component in React.memo to prevent unnecessary re-renders",
      "line": 15,
      "priority": "medium",
      "confidence": 85
    }
  ],
  "agentInsights": {
    "similarCases": 12,
    "confidence": 0.85,
    "recommendation": "High impact optimization"
  }
}
```

**In Cursor**: Open `.cursor/aai-analysis.json` to see results, or create a workspace symbol to auto-display.

### 2. **Memory-Based Context Sharing** 🧠
AAI stores analysis in dual memory (agent + project) that Cursor can access:

```bash
# Check what AAI learned about your codebase
🤖 > agent-memory search "React optimization"
🤖 > project-memory search "UserProfile component"

# Results available in:
# - agents/_store/memory/agent/*.json
# - agents/_store/memory/project/{current-project}/*.json
```

### 3. **Dependency Analysis Integration** 🔗
AAI tracks file dependencies that inform Cursor's understanding:

```bash
🤖 > dependencies analyze src/components/
🤖 > dependencies search UserProfile.jsx

# Creates dependency maps in memory that show:
# - Which files import this component
# - What this component depends on
# - Impact analysis for changes
```

### 4. **Terminal Output → Cursor Comments** 💬
Copy AAI analysis directly into your code:

```javascript
// 🤖 AAI Analysis (2024-01-15):
// - Performance: Missing React.memo (Line 15) - Medium Priority
// - Accessibility: Missing aria-labels (Line 23) - High Priority  
// - Code Quality: Extract custom hook (Line 45) - Low Priority
// Agent Confidence: 85% based on 12 similar cases

const UserProfile = ({ user, onUpdate }) => {
  // Your component code...
}
```

### 5. **Git Integration for Team Context** 🔄
AAI can sync insights to git for team-wide Cursor integration:

```bash
🤖 > git-projects sync-memory
# Saves team insights to git that all team members' Cursor instances can use
```

## 🛠 Advanced Integration Scripts

### Auto-Integration Script
Create this in your project root as `aai-cursor-bridge.js`:

```javascript
// Auto-bridge AAI analysis to Cursor-readable format
const fs = require('fs');
const path = require('path');

class AAICursorBridge {
  constructor() {
    this.outputDir = '.cursor/aai';
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Convert AAI memory to Cursor workspace symbols
  async exportToWorkspaceSymbols() {
    const memoryPath = 'agents/_store/memory/project';
    const memories = this.readMemoryFiles(memoryPath);
    
    const workspaceSymbols = {
      "recommendations": [],
      "insights": [],
      "patterns": []
    };

    memories.forEach(memory => {
      if (memory.type === 'context') {
        workspaceSymbols.insights.push({
          file: memory.fileName,
          analysis: memory.analysisResult,
          confidence: memory.confidence || 0.8
        });
      }
    });

    fs.writeFileSync(
      path.join(this.outputDir, 'workspace-symbols.json'),
      JSON.stringify(workspaceSymbols, null, 2)
    );
  }

  readMemoryFiles(memoryPath) {
    // Implementation to read AAI memory files
    // Returns array of memory objects
  }
}

module.exports = AAICursorBridge;
```

### Cursor Settings Integration
Add to your Cursor `settings.json`:

```json
{
  "files.watcherExclude": {
    "**/.cursor/aai/**": false
  },
  "files.associations": {
    "*.aai-analysis": "json",
    "*.aai-context": "markdown"
  },
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  }
}
```

## 📋 Workflow Examples

### React Component Analysis
```bash
# 1. AAI analyzes component
🤖 > analyze src/components/Dashboard.jsx

# 2. Cursor receives context via:
# - File: .cursor/aai/Dashboard-analysis.json
# - Memory: Recent analysis in project memory
# - Comments: Copy suggestions into component

# 3. Cursor can now provide enhanced suggestions based on AAI insights
```

### Code Review Integration
```bash
# 1. Before code review
🤖 > smart-detect
🤖 > dependencies check-health

# 2. AAI creates review context file
# .cursor/aai/code-review-context.md

# 3. Cursor reads this during review for enhanced context awareness
```

## 🎯 Best Practices

1. **Set up file watchers** in Cursor for `.cursor/aai/` directory
2. **Use AAI context commands** before starting new features
3. **Export AAI insights** to team-readable formats  
4. **Create keyboard shortcuts** to quickly access AAI outputs
5. **Integrate with git hooks** for automatic analysis

## 🔧 Quick Setup Commands

```bash
# Create integration directory
mkdir -p .cursor/aai

# Set up AAI to output to Cursor directory  
echo "AAI_OUTPUT_DIR=.cursor/aai" >> .env

# Test integration
npm run AAI:start
🤖 > analyze --output-cursor src/components/
```

This creates a seamless bridge where AAI's deep analysis enhances Cursor's understanding of your codebase! 
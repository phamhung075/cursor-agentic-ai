# 🧠 Interactive Self-Improvement Agent

An AI agent that analyzes and improves your Agentic Coding Framework files **on demand** - no more waiting for full project scans!

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start interactive mode
node scripts/self_improvement_agent.js

# Or run the demo
node demo_agent.js
```

## 💡 Key Features

✅ **Fast & Focused** - Only analyzes files when you need it  
✅ **Context-Aware** - Understands your current work context  
✅ **Interactive** - Easy command-line interface  
✅ **Smart Detection** - Finds relevant files automatically  
✅ **Targeted Improvements** - Specific, actionable suggestions  

## 🎯 Usage Examples

### 1. Analyze a Specific File
```bash
🤖 > analyze getting_started
🔍 Analyzing: getting_started
📊 Found 2 improvement opportunities:
🚨 1. MISSING EXAMPLES
   Issue: No code examples found
   💡 Add practical code examples to improve usability
```

### 2. Get Smart Suggestions
```bash
🤖 > improve agent_workflow
💡 Getting improvement suggestions for: agent_workflow
🎯 Smart Improvement Suggestions:
1. Add Prompt Engineering Examples
   💡 AI-related files benefit from concrete prompt examples
   🔧 Implementation: Include 2-3 example prompts with expected outputs
```

### 3. Context-Aware Analysis
```bash
🤖 > context "API development"
🎯 Context set to: "API development"

🤖 > smart-detect
🎯 Smart detection for context: "API development"
📁 Found 3 relevant files:
   • API_Agent_Core.mdc
   • Backend_Integration.mdc
   • Security_Guidelines.mdc
```

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `analyze <filename>` | Analyze specific .mdc file | `analyze getting_started` |
| `improve <filename>` | Get improvement suggestions | `improve logic` |
| `context <topic>` | Set current work context | `context "react development"` |
| `smart-detect` | Analyze based on context | `smart-detect` |
| `help` | Show available commands | `help` |
| `exit` | Stop the agent | `exit` |

## 🔍 What the Agent Detects

### Critical Issues (High Priority)
- Missing code examples
- No error handling in examples
- Security vulnerabilities
- Broken workflows

### Technology Updates (Medium Priority)
- Outdated React/Node.js versions
- Deprecated APIs
- Old coding patterns

### Content Quality (Low Priority)
- Missing sections
- Inconsistent terminology
- TODO/TBD markers

## 🎪 Interactive vs. Old Approach

| Feature | Old Approach | New Interactive Approach |
|---------|-------------|-------------------------|
| **Speed** | Scans entire project (slow) | Analyzes only needed files (fast) |
| **Relevance** | Shows all issues | Shows context-relevant issues |
| **User Experience** | Overwhelming output | Focused, actionable feedback |
| **Resource Usage** | High CPU/memory | Lightweight |
| **Workflow** | Batch processing | Interactive, on-demand |

## 🛠️ Integration with Your Workflow

### When Working on Specific Files
```bash
# You're editing a file, want to check it
🤖 > analyze my_current_file
```

### When Starting New Features
```bash
# Set context for your current work
🤖 > context "authentication system"
🤖 > smart-detect
```

### When Reviewing Documentation
```bash
# Get specific improvement suggestions
🤖 > improve documentation_guide
```

## 🎯 Benefits

1. **⚡ Faster Development** - No waiting for full scans
2. **🎯 Relevant Feedback** - Only see what matters to your current work
3. **🧠 Context Understanding** - Agent learns your work patterns
4. **🔄 Interactive Loop** - Immediate feedback and iteration
5. **📈 Continuous Learning** - Agent improves based on your usage

## 🔮 Future Enhancements

- **Auto-Fix** capabilities for simple issues
- **Learning from feedback** to improve suggestions
- **Integration with Git** to analyze changed files
- **Team collaboration** features
- **Custom rules** for your specific needs

## 🎉 Getting Started

1. **Run the demo**: `node demo_agent.js`
2. **Start interactive mode**: `node scripts/self_improvement_agent.js`
3. **Try some commands**: `analyze`, `improve`, `context`
4. **Integrate into workflow**: Use while developing

---

**💡 Pro Tip**: Set a context at the start of each work session for the most relevant suggestions! 
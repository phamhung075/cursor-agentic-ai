# 🔍 AI Agent Logging System Guide

## Overview

Your AI agent now has a comprehensive logging system that tracks all operations, decisions, and performance metrics. This helps you monitor what's happening inside the agent and debug issues.

## Features

### 📊 **Comprehensive Tracking**
- **Operations**: All major agent operations (start, analyze, memory commands, etc.)
- **File Analysis**: Detailed tracking of file analysis with results and performance
- **Memory Operations**: Agent and project memory interactions
- **Git Operations**: Git project management activities
- **User Interactions**: All CLI commands and their results
- **Performance Metrics**: Operation timing and success rates
- **Error Tracking**: Detailed error logging with context

### 🎯 **Log Levels**
- **ERROR**: Critical errors and failures
- **WARN**: Warnings and potential issues
- **INFO**: General information and operation status
- **DEBUG**: Detailed debugging information
- **TRACE**: Very detailed tracing (most verbose)

### 📁 **Dual Output**
- **Console**: Real-time colored output with timestamps
- **File**: Detailed logs saved to `agents/_store/logs/`

## Usage

### 🚀 **Starting the Agent**
The logger automatically initializes when you start the agent:

```bash
# Interactive mode with logging
node agents/self-improvement/index.js

# Test mode with logging
npm run AAI:test-logging
```

### 📋 **Logs Commands**
Use the `logs` command in the agent CLI to manage logging:

```bash
# Show current metrics and status
logs status
logs metrics

# View/change log level
logs level          # Show current level
logs level DEBUG    # Set to DEBUG level
logs level ERROR    # Set to ERROR level

# Generate session summary
logs summary

# Show help
logs help
```

### 🔧 **Log Levels Available**
- `ERROR` - Only errors
- `WARN` - Warnings and errors
- `INFO` - General info, warnings, and errors (default)
- `DEBUG` - Debug info and above
- `TRACE` - Everything (most verbose)

### 📊 **Viewing Metrics**
The logging system tracks comprehensive metrics:

```
📊 LOGGING METRICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 Session ID: 2025-05-25T06-00-43-5qlfp7
⏱️  Uptime: 3s
📈 Operations: 4
📊 Analyses: 0
🧠 Memory Ops: 3
📁 Git Ops: 5
📄 File Ops: 0
❌ Errors: 2
⚠️  Warnings: 1
📊 Log Level: info

🎯 PERFORMANCE:
   Success Rate: 50.00%
   Error Rate: 50.00%
   Ops/Min: 76.05
```

## Log File Structure

### 📁 **File Location**
Log files are stored in: `agents/_store/logs/`

### 📝 **File Naming**
- Format: `agent-{timestamp}-{random}.log`
- Example: `agent-2025-05-25T06-00-43-5qlfp7.log`

### 📄 **File Content**
Each log file contains:
1. **Session Header** with start time and configuration
2. **Timestamped Entries** with level, message, and context
3. **Session Summary** with metrics and performance data

### 🔄 **Log Rotation**
- Files automatically rotate when they exceed 10MB
- Keeps last 10 log files automatically
- Old files are cleaned up automatically

## Examples

### 🔍 **File Analysis Logging**
```
2025-05-25T06:00:46.450Z [INFO] 🔧 Operation: analyze_file
2025-05-25T06:00:46.451Z [WARN] File not found
2025-05-25T06:00:46.452Z [INFO] 📊 Analysis: test.mdc
```

### 🧠 **Memory Operations**
```
2025-05-25T06:00:46.453Z [INFO] 🧠 Memory command: agent
2025-05-25T06:00:46.454Z [INFO] 🧠 Memory command_result: agent
```

### 📁 **Git Operations**
```
2025-05-25T06:00:46.455Z [INFO] 📁 Git command: list
2025-05-25T06:00:46.456Z [INFO] 📁 Git list_projects: all
```

### ⚡ **Performance Tracking**
```
2025-05-25T06:00:46.457Z [DEBUG] ⚡ Performance: agent_initialize took 3000ms
```

## Environment Variables

### 🔧 **Configuration**
Set log level via environment variable:
```bash
export LOG_LEVEL=DEBUG
node agents/self-improvement/index.js
```

Available levels: `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`

## Troubleshooting

### 🚨 **Common Issues**

1. **Log files not created**
   - Check if `agents/_store/logs/` directory exists
   - Verify write permissions

2. **Too verbose logging**
   - Change log level: `logs level WARN`
   - Or set environment: `LOG_LEVEL=WARN`

3. **Missing context in logs**
   - Increase log level: `logs level DEBUG`
   - Check if operations are being tracked

### 🔍 **Debugging**
- Use `logs status` to check current metrics
- Check log files in `agents/_store/logs/`
- Increase log level for more detail
- Use `logs summary` for session overview

## Integration

### 🔗 **With Existing Systems**
The logging system integrates with:
- **Memory Management**: Tracks all memory operations
- **Git Projects**: Logs all git project activities  
- **File Analysis**: Records analysis results and performance
- **CLI Interface**: Logs all user interactions
- **Error Handling**: Captures and logs all errors with context

### 📈 **Monitoring**
Use the metrics to monitor:
- **Agent Performance**: Operations per minute, success rates
- **Error Patterns**: Common failure points
- **Usage Patterns**: Most used features
- **System Health**: Memory usage, operation timing

## Best Practices

### ✅ **Recommended Usage**
1. **Start with INFO level** for normal operation
2. **Use DEBUG level** when troubleshooting
3. **Check logs regularly** for patterns and issues
4. **Use session summaries** for performance analysis
5. **Monitor error rates** to identify problems early

### 🎯 **Performance Tips**
- Higher log levels (TRACE/DEBUG) may impact performance
- Log files are rotated automatically to manage disk space
- Console logging can be disabled if needed for production

---

## Quick Start

1. **Start the agent**: `node agents/self-improvement/index.js`
2. **Check status**: `logs status`
3. **View logs**: Check `agents/_store/logs/` directory
4. **Adjust level**: `logs level DEBUG` for more detail
5. **Get summary**: `logs summary` when done

The logging system is now actively monitoring your AI agent! 🎉 
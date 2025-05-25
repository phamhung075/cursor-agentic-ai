/**
 * 🔍 AI Agent Logger
 * 
 * Comprehensive logging system for monitoring AI agent activities
 * Provides detailed insights into agent operations, decisions, and performance
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class AgentLogger {
  constructor(config = {}) {
    this.config = {
      logLevel: config.logLevel || 'INFO',
      logToFile: config.logToFile !== false,
      logToConsole: config.logToConsole !== false,
      logPath: config.logPath || './.cursor/rules/agents/_store/logs',
      maxLogFiles: config.maxLogFiles || 10,
      maxLogSize: config.maxLogSize || 10 * 1024 * 1024, // 10MB
      enableColors: config.enableColors !== false,
      enableTimestamps: config.enableTimestamps !== false,
      enableMetrics: config.enableMetrics !== false,
      ...config
    };
    
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    this.currentLogLevel = this.logLevels[this.config.logLevel] || this.logLevels.INFO;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.metrics = {
      operations: 0,
      errors: 0,
      warnings: 0,
      analysisCount: 0,
      memoryOperations: 0,
      gitOperations: 0,
      fileOperations: 0
    };
    
    this.initializeLogger();
  }

  /**
   * Initialize the logger
   */
  async initializeLogger() {
    try {
      if (this.config.logToFile) {
        await fs.mkdir(this.config.logPath, { recursive: true });
        this.logFile = path.join(this.config.logPath, `agent-${this.sessionId}.log`);
        await this.writeToFile(`\n${'='.repeat(80)}\n🤖 AI AGENT SESSION STARTED\n${'='.repeat(80)}\nSession ID: ${this.sessionId}\nStart Time: ${new Date().toISOString()}\nLog Level: ${this.config.logLevel}\n${'='.repeat(80)}\n`);
      }
      
      if (this.config.logToConsole) {
        console.log(chalk.cyan(`🔍 Logger initialized - Session: ${this.sessionId}`));
      }
    } catch (error) {
      console.error('❌ Failed to initialize logger:', error.message);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Log error messages
   */
  error(message, context = {}) {
    this.metrics.errors++;
    this.log('ERROR', message, context);
  }

  /**
   * Log warning messages
   */
  warn(message, context = {}) {
    this.metrics.warnings++;
    this.log('WARN', message, context);
  }

  /**
   * Log info messages
   */
  info(message, context = {}) {
    this.log('INFO', message, context);
  }

  /**
   * Log debug messages
   */
  debug(message, context = {}) {
    this.log('DEBUG', message, context);
  }

  /**
   * Log trace messages
   */
  trace(message, context = {}) {
    this.log('TRACE', message, context);
  }

  /**
   * Log agent operations
   */
  logOperation(operation, details = {}) {
    this.metrics.operations++;
    this.info(`🔧 Operation: ${operation}`, {
      operation,
      details,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  /**
   * Log file analysis
   */
  logAnalysis(filename, results = {}) {
    this.metrics.analysisCount++;
    this.info(`📊 Analysis: ${filename}`, {
      filename,
      issuesFound: results.issuesFound || 0,
      suggestions: results.suggestions || 0,
      duration: results.duration || 0,
      timestamp: Date.now()
    });
  }

  /**
   * Log memory operations
   */
  logMemory(operation, type, details = {}) {
    this.metrics.memoryOperations++;
    this.info(`🧠 Memory ${operation}: ${type}`, {
      operation,
      type,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Log git operations
   */
  logGit(operation, project, details = {}) {
    this.metrics.gitOperations++;
    this.info(`📁 Git ${operation}: ${project}`, {
      operation,
      project,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Log file operations
   */
  logFile(operation, filepath, details = {}) {
    this.metrics.fileOperations++;
    this.debug(`📄 File ${operation}: ${filepath}`, {
      operation,
      filepath,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Log user interactions
   */
  logUserInteraction(command, args = [], result = {}) {
    this.info(`👤 User Command: ${command}`, {
      command,
      args,
      result: result.success ? 'SUCCESS' : 'FAILED',
      message: result.message,
      timestamp: Date.now()
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, details = {}) {
    const level = duration > 5000 ? 'WARN' : 'DEBUG';
    this.log(level, `⚡ Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Log AI decision making
   */
  logDecision(decision, reasoning, confidence = null) {
    this.info(`🤔 AI Decision: ${decision}`, {
      decision,
      reasoning,
      confidence,
      timestamp: Date.now()
    });
  }

  /**
   * Core logging method
   */
  log(level, message, context = {}) {
    const levelNum = this.logLevels[level];
    if (levelNum > this.currentLogLevel) {
      return; // Skip if below current log level
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      sessionId: this.sessionId,
      context
    };

    // Console output
    if (this.config.logToConsole) {
      this.logToConsole(level, message, timestamp, context);
    }

    // File output
    if (this.config.logToFile) {
      this.logToFileAsync(logEntry);
    }
  }

  /**
   * Log to console with colors
   */
  logToConsole(level, message, timestamp, context) {
    const colors = {
      ERROR: chalk.red,
      WARN: chalk.yellow,
      INFO: chalk.blue,
      DEBUG: chalk.gray,
      TRACE: chalk.dim
    };

    const icons = {
      ERROR: '❌',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🔍',
      TRACE: '👁️'
    };

    const color = colors[level] || chalk.white;
    const icon = icons[level] || '📝';
    const timeStr = this.config.enableTimestamps ? `[${timestamp.slice(11, 19)}] ` : '';
    
    let output = `${timeStr}${icon} ${color(level)}: ${message}`;
    
    // Add context if available and not too verbose
    if (context && Object.keys(context).length > 0 && level !== 'TRACE') {
      const contextStr = this.formatContext(context);
      if (contextStr) {
        output += chalk.dim(` ${contextStr}`);
      }
    }

    console.log(output);
  }

  /**
   * Format context for display
   */
  formatContext(context) {
    const important = {};
    
    // Extract important context fields
    if (context.operation) important.op = context.operation;
    if (context.filename) important.file = path.basename(context.filename);
    if (context.duration) important.time = `${context.duration}ms`;
    if (context.issuesFound) important.issues = context.issuesFound;
    if (context.result) important.result = context.result;
    
    if (Object.keys(important).length === 0) return '';
    
    return `(${Object.entries(important).map(([k, v]) => `${k}:${v}`).join(', ')})`;
  }

  /**
   * Log to file asynchronously
   */
  async logToFileAsync(logEntry) {
    try {
      const logLine = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}`;
      const contextLine = Object.keys(logEntry.context).length > 0 
        ? `\n  Context: ${JSON.stringify(logEntry.context, null, 2)}`
        : '';
      
      await this.writeToFile(`${logLine}${contextLine}\n`);
      
      // Check file size and rotate if needed
      await this.rotateLogIfNeeded();
    } catch (error) {
      console.error('❌ Failed to write to log file:', error.message);
    }
  }

  /**
   * Write to log file
   */
  async writeToFile(content) {
    if (!this.logFile) return;
    await fs.appendFile(this.logFile, content);
  }

  /**
   * Rotate log file if it gets too large
   */
  async rotateLogIfNeeded() {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size > this.config.maxLogSize) {
        const rotatedFile = `${this.logFile}.${Date.now()}`;
        await fs.rename(this.logFile, rotatedFile);
        await this.writeToFile(`\n${'='.repeat(80)}\n🔄 LOG ROTATED - NEW SESSION\n${'='.repeat(80)}\n`);
        
        // Clean up old log files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }

  /**
   * Clean up old log files
   */
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.config.logPath);
      const logFiles = files
        .filter(f => f.startsWith('agent-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.config.logPath, f),
          time: fs.stat(path.join(this.config.logPath, f)).then(s => s.mtime)
        }));

      const sortedFiles = await Promise.all(
        logFiles.map(async f => ({ ...f, time: await f.time }))
      );
      
      sortedFiles.sort((a, b) => b.time - a.time);
      
      // Remove excess files
      for (let i = this.config.maxLogFiles; i < sortedFiles.length; i++) {
        await fs.unlink(sortedFiles[i].path);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get current session metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    return {
      ...this.metrics,
      sessionId: this.sessionId,
      uptime,
      uptimeFormatted: this.formatDuration(uptime),
      startTime: new Date(this.startTime).toISOString(),
      logLevel: this.config.logLevel
    };
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Generate session summary
   */
  async generateSessionSummary() {
    const metrics = this.getMetrics();
    const summary = `
${'='.repeat(80)}
📊 AI AGENT SESSION SUMMARY
${'='.repeat(80)}
Session ID: ${metrics.sessionId}
Duration: ${metrics.uptimeFormatted}
Start Time: ${metrics.startTime}
End Time: ${new Date().toISOString()}

📈 METRICS:
- Total Operations: ${metrics.operations}
- File Analyses: ${metrics.analysisCount}
- Memory Operations: ${metrics.memoryOperations}
- Git Operations: ${metrics.gitOperations}
- File Operations: ${metrics.fileOperations}
- Errors: ${metrics.errors}
- Warnings: ${metrics.warnings}

🎯 PERFORMANCE:
- Operations per minute: ${(metrics.operations / (metrics.uptime / 60000)).toFixed(2)}
- Error rate: ${((metrics.errors / Math.max(metrics.operations, 1)) * 100).toFixed(2)}%
- Success rate: ${(100 - (metrics.errors / Math.max(metrics.operations, 1)) * 100).toFixed(2)}%

${'='.repeat(80)}
`;

    if (this.config.logToFile) {
      await this.writeToFile(summary);
    }

    if (this.config.logToConsole) {
      console.log(chalk.cyan(summary));
    }

    return summary;
  }

  /**
   * Shutdown logger
   */
  async shutdown() {
    await this.generateSessionSummary();
    this.info('🛑 Logger shutdown complete');
  }
}

module.exports = AgentLogger; 
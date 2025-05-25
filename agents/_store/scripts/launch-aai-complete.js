#!/usr/bin/env node

/**
 * 🚀 Complete AAI Launcher & Orchestrator
 * 
 * Master script that launches all AAI functions, coordinates them,
 * and maintains continuous improvement workflow
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AAICompleteOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.processes = new Map();
    this.status = {
      cursorIntegration: false,
      aaiAgent: false,
      autoSync: false,
      monitoring: false,
      memorySync: false
    };
    this.config = {
      autoRestart: true,
      continuousImprovement: true,
      monitoringInterval: 30000, // 30 seconds
      improvementInterval: 300000, // 5 minutes
      healthCheckInterval: 60000 // 1 minute
    };
    this.startTime = new Date();
    this.improvementCycle = 0;
  }

  /**
   * Main orchestration function
   */
  async launch() {
    console.log('🚀 LAUNCHING COMPLETE AAI SYSTEM');
    console.log('━'.repeat(60));
    console.log(`⏰ Started at: ${this.startTime.toLocaleString()}`);
    console.log('');

    try {
      // 1. Setup and validate environment
      await this.setupEnvironment();

      // 2. Launch core components in sequence
      await this.launchCoreComponents();

      // 3. Start monitoring and improvement cycles
      this.startContinuousOperations();

      // 4. Setup process management
      this.setupProcessManagement();

      console.log('✅ AAI SYSTEM FULLY OPERATIONAL');
      console.log('━'.repeat(60));
      this.showSystemStatus();
      this.showAvailableCommands();

      // Keep process alive
      this.keepAlive();

    } catch (error) {
      console.error('❌ Launch failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Setup and validate environment
   */
  async setupEnvironment() {
    console.log('🔧 Setting up environment...');

    // Check dependencies
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found');
    }

    // Setup Cursor integration
    await this.runCommand('cursor:setup', 'Setting up Cursor integration');
    this.status.cursorIntegration = true;

    // Generate initial script awareness
    await this.runCommand('cursor:script-awareness', 'Generating script awareness');

    console.log('✅ Environment setup complete\n');
  }

  /**
   * Launch core components
   */
  async launchCoreComponents() {
    console.log('🚀 Launching core components...');

    // 1. Start AAI Agent (main intelligence)
    this.launchAAIAgent();

    // 2. Start Auto-Sync (keeps Cursor updated)
    this.launchAutoSync();

    // 3. Start Memory Sync (keeps memory synchronized)
    this.launchMemorySync();

    // 4. Start Core Monitoring (monitors framework health)
    this.launchCoreMonitoring();

    // Wait for components to initialize
    await this.waitForComponentsReady();

    console.log('✅ Core components launched\n');
  }

  /**
   * Launch AAI Agent
   */
  launchAAIAgent() {
    console.log('🤖 Starting AAI Agent...');
    
    const aaiProcess = spawn('npm', ['run', 'AAI:start'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    aaiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('🤖') || output.includes('Interactive Self-Improvement Agent')) {
        console.log('✅ AAI Agent ready');
        this.status.aaiAgent = true;
        this.emit('aai-ready');
      }
      // Log important AAI output
      if (output.includes('analysis') || output.includes('improvement') || output.includes('error')) {
        console.log(`🤖 AAI: ${output.trim()}`);
      }
    });

    aaiProcess.stderr.on('data', (data) => {
      console.warn(`⚠️ AAI Error: ${data.toString().trim()}`);
    });

    this.processes.set('aai-agent', aaiProcess);
  }

  /**
   * Launch Auto-Sync
   */
  launchAutoSync() {
    console.log('🔄 Starting Auto-Sync...');
    
    const syncProcess = spawn('npm', ['run', 'cursor:auto-sync'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    syncProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Auto-sync started successfully')) {
        console.log('✅ Auto-Sync ready');
        this.status.autoSync = true;
        this.emit('sync-ready');
      }
      // Log sync events
      if (output.includes('sync') || output.includes('Generated:')) {
        console.log(`🔄 Sync: ${output.trim()}`);
      }
    });

    this.processes.set('auto-sync', syncProcess);
  }

  /**
   * Launch Memory Sync
   */
  launchMemorySync() {
    console.log('🧠 Starting Memory Sync...');
    
    // Start memory sync in status mode first
    const memoryProcess = spawn('npm', ['run', 'AAI:sync-status'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    memoryProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Memory Sync ready');
        this.status.memorySync = true;
        this.emit('memory-ready');
        
        // Schedule periodic memory sync
        this.scheduleMemorySync();
      }
    });

    this.processes.set('memory-sync', memoryProcess);
  }

  /**
   * Launch Core Monitoring
   */
  launchCoreMonitoring() {
    console.log('📊 Starting Core Monitoring...');
    
    const monitorProcess = spawn('npm', ['run', 'AAI:core-monitor'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    monitorProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('monitoring') || output.includes('started')) {
        console.log('✅ Core Monitoring ready');
        this.status.monitoring = true;
        this.emit('monitor-ready');
      }
    });

    this.processes.set('core-monitor', monitorProcess);
  }

  /**
   * Start continuous operations
   */
  startContinuousOperations() {
    console.log('🔄 Starting continuous operations...');

    // Health check timer
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Continuous improvement timer
    this.improvementTimer = setInterval(() => {
      this.performImprovementCycle();
    }, this.config.improvementInterval);

    // System monitoring timer
    this.monitoringTimer = setInterval(() => {
      this.performSystemMonitoring();
    }, this.config.monitoringInterval);

    console.log('✅ Continuous operations started');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🏥 [${timestamp}] Health check...`);

    // Check process health
    for (const [name, process] of this.processes) {
      if (process.killed) {
        console.warn(`⚠️ Process ${name} is down, restarting...`);
        if (this.config.autoRestart) {
          await this.restartProcess(name);
        }
      }
    }

    // Check file system health
    const criticalFiles = [
      '.cursor/settings.json',
      'agents/_store/cursor-summaries/script-summary.json',
      'package.json'
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        console.warn(`⚠️ Critical file missing: ${file}`);
        await this.regenerateFile(file);
      }
    }
  }

  /**
   * Perform improvement cycle
   */
  async performImprovementCycle() {
    this.improvementCycle++;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔄 [${timestamp}] Improvement cycle #${this.improvementCycle}`);

    try {
      // 1. Analyze current state
      await this.runCommand('AAI:scripts-analyze', 'Analyzing scripts');

      // 2. Update script awareness
      await this.runCommand('cursor:script-awareness', 'Updating script awareness');

      // 3. Check for improvements
      await this.runCommand('AAI:core-health', 'Checking core health');

      // 4. Sync memory if needed
      if (this.improvementCycle % 3 === 0) { // Every 3rd cycle
        await this.runCommand('AAI:sync-both', 'Syncing memory');
      }

      // 5. Check preserved code sync status (every 5th cycle)
      if (this.improvementCycle % 5 === 0) {
        await this.runCommand('AAI:sync-preserved-status', 'Checking preserved code sync');
      }

      console.log(`✅ Improvement cycle #${this.improvementCycle} complete`);

    } catch (error) {
      console.error(`❌ Improvement cycle failed: ${error.message}`);
    }
  }

  /**
   * Perform system monitoring
   */
  performSystemMonitoring() {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeMinutes = Math.floor(uptime / 60000);
    
    console.log(`📊 System uptime: ${uptimeMinutes} minutes | Cycles: ${this.improvementCycle}`);
    
    // Log process status
    const activeProcesses = Array.from(this.processes.keys()).filter(
      name => !this.processes.get(name).killed
    );
    console.log(`🔧 Active processes: ${activeProcesses.join(', ')}`);
  }

  /**
   * Schedule periodic memory sync
   */
  scheduleMemorySync() {
    setInterval(async () => {
      console.log('🧠 Performing scheduled memory sync...');
      try {
        await this.runCommand('AAI:sync-both', 'Syncing memory');
        console.log('✅ Memory sync complete');
      } catch (error) {
        console.error('❌ Memory sync failed:', error.message);
      }
    }, 600000); // Every 10 minutes
  }

  /**
   * Wait for components to be ready
   */
  async waitForComponentsReady() {
    return new Promise((resolve) => {
      const checkReady = () => {
        const ready = Object.values(this.status).every(status => status);
        if (ready) {
          resolve();
        } else {
          setTimeout(checkReady, 1000);
        }
      };
      checkReady();
    });
  }

  /**
   * Run a command and wait for completion
   */
  async runCommand(command, description) {
    console.log(`⚡ ${description}...`);
    
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['run', command], {
        stdio: 'pipe'
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command ${command} failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Restart a process
   */
  async restartProcess(processName) {
    console.log(`🔄 Restarting ${processName}...`);
    
    const oldProcess = this.processes.get(processName);
    if (oldProcess && !oldProcess.killed) {
      oldProcess.kill();
    }

    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Restart based on process type
    switch (processName) {
      case 'aai-agent':
        this.launchAAIAgent();
        break;
      case 'auto-sync':
        this.launchAutoSync();
        break;
      case 'core-monitor':
        this.launchCoreMonitoring();
        break;
    }
  }

  /**
   * Regenerate missing file
   */
  async regenerateFile(filePath) {
    console.log(`🔧 Regenerating ${filePath}...`);
    
    if (filePath.includes('cursor')) {
      await this.runCommand('cursor:setup', 'Regenerating Cursor files');
    } else if (filePath.includes('script-summary')) {
      await this.runCommand('cursor:script-awareness', 'Regenerating script awareness');
    }
  }

  /**
   * Setup process management
   */
  setupProcessManagement() {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught exception:', error.message);
      this.gracefulShutdown();
    });
  }

  /**
   * Show system status
   */
  showSystemStatus() {
    console.log('📊 SYSTEM STATUS:');
    Object.entries(this.status).forEach(([component, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`   ${icon} ${component}`);
    });
    console.log('');
  }

  /**
   * Show available commands
   */
  showAvailableCommands() {
    console.log('🎯 AVAILABLE COMMANDS:');
    console.log('   • Press Ctrl+C to shutdown gracefully');
    console.log('   • Check logs above for real-time status');
    console.log('   • Open Cursor and press Ctrl/Cmd+P → type script names');
    console.log('   • All AAI functions are running automatically');
    console.log('');
    console.log('📋 WHAT\'S RUNNING:');
    console.log('   🤖 AAI Agent - Interactive AI assistance');
    console.log('   🔄 Auto-Sync - Keeps Cursor updated');
    console.log('   🧠 Memory Sync - Synchronizes AI memory');
    console.log('   📊 Core Monitor - Monitors system health');
    console.log('   🔄 Continuous Improvement - Auto-optimization');
    console.log('');
  }

  /**
   * Keep process alive
   */
  keepAlive() {
    // Keep the main process running
    setInterval(() => {
      // Just keep alive, monitoring happens in other timers
    }, 10000);
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    console.log('\n🛑 Shutting down AAI system...');

    // Clear timers
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.improvementTimer) clearInterval(this.improvementTimer);
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);

    // Kill all processes
    for (const [name, process] of this.processes) {
      console.log(`🔄 Stopping ${name}...`);
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }

    // Wait for processes to stop
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ AAI system stopped gracefully');
    process.exit(0);
  }

  /**
   * Cleanup on error
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');
    await this.gracefulShutdown();
  }
}

// CLI execution
if (require.main === module) {
  const orchestrator = new AAICompleteOrchestrator();
  
  console.log('🤖 AAI COMPLETE SYSTEM LAUNCHER');
  console.log('━'.repeat(60));
  console.log('This will start ALL AAI functions and keep them running:');
  console.log('• 🤖 Interactive AAI Agent');
  console.log('• 🔄 Cursor Auto-Sync');
  console.log('• 🧠 Memory Synchronization');
  console.log('• 📊 Core System Monitoring');
  console.log('• 🔄 Continuous Improvement');
  console.log('━'.repeat(60));
  console.log('');

  orchestrator.launch().catch(error => {
    console.error('💥 System launch failed:', error.message);
    process.exit(1);
  });
}

module.exports = AAICompleteOrchestrator; 
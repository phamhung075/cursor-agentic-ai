#!/usr/bin/env node

/**
 * 🚀 Complete AAI Launcher & Orchestrator
 * 
 * Master script that launches all AAI functions, coordinates them,
 * and maintains continuous improvement workflow with enhanced intelligence
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
      memorySync: false,
      intelligence: false,
      contextTracking: false,
      performanceOptimized: false
    };
    this.config = {
      autoRestart: true,
      continuousImprovement: true,
      monitoringInterval: 30000, // 30 seconds
      improvementInterval: 180000, // 3 minutes (more frequent)
      healthCheckInterval: 60000, // 1 minute
      intelligenceInterval: 300000, // 5 minutes (more frequent)
      performanceInterval: 600000, // 10 minutes (more frequent)
      aaiCommandInterval: 120000, // 2 minutes - AAI agent commands
      memorySync: 600000 // 10 minutes - memory sync
    };
    this.startTime = new Date();
    this.improvementCycle = 0;
  }

  /**
   * Main orchestration function
   */
  async launch() {
    console.log('🚀 LAUNCHING COMPLETE AAI SYSTEM WITH ENHANCED INTELLIGENCE');
    console.log('━'.repeat(70));
    console.log(`⏰ Started at: ${this.startTime.toLocaleString()}`);
    console.log('');

    try {
      // 1. Setup and validate environment
      await this.setupEnvironment();

      // 2. Initialize intelligence systems
      await this.initializeIntelligence();

      // 3. Launch core components in sequence
      await this.launchCoreComponents();

      // 4. Start enhanced monitoring and improvement cycles
      this.startContinuousOperations();

      // 5. Setup process management
      this.setupProcessManagement();

      console.log('✅ AAI SYSTEM FULLY OPERATIONAL WITH ENHANCED INTELLIGENCE');
      console.log('━'.repeat(70));
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
   * Initialize intelligence systems
   */
  async initializeIntelligence() {
    console.log('🧠 Initializing Enhanced Intelligence Systems...');

    try {
      // 1. Enhance agent intelligence
      console.log('🎯 Enhancing agent intelligence...');
      await this.runCommand('AAI:intelligence-enhance', 'Enhancing agent intelligence');
      this.status.intelligence = true;

      // 2. Start context tracking (background process)
      console.log('👁️ Starting context tracking...');
      this.launchContextTracking();

      // 3. Run initial performance optimization
      console.log('⚡ Running performance optimization...');
      await this.runCommand('AAI:performance-optimize', 'Optimizing performance');
      this.status.performanceOptimized = true;

      console.log('✅ Intelligence systems initialized\n');

    } catch (error) {
      console.warn('⚠️ Intelligence initialization had issues:', error.message);
      console.log('📝 Continuing with basic functionality...\n');
    }
  }

  /**
   * Launch context tracking as background process
   */
  launchContextTracking() {
    console.log('🎯 Starting Smart Context Tracking...');
    
    const contextProcess = spawn('npm', ['run', 'AAI:context-track'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    contextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('✅ Smart context tracking active')) {
        console.log('✅ Context Tracking ready');
        this.status.contextTracking = true;
        this.emit('context-ready');
      }
      // Log important context events
      if (output.includes('suggestion') || output.includes('pattern') || output.includes('context')) {
        console.log(`🎯 Context: ${output.trim()}`);
      }
    });

    contextProcess.stderr.on('data', (data) => {
      console.warn(`⚠️ Context Error: ${data.toString().trim()}`);
    });

    this.processes.set('context-tracking', contextProcess);
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
   * Launch AAI Agent in continuous improvement mode
   */
  launchAAIAgent() {
    console.log('🤖 Starting AAI Agent in Continuous Improvement Mode...');
    
    // Start AAI agent in continuous improvement mode with enhanced settings
    const aaiProcess = spawn('node', ['agents/self-improvement/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      env: { 
        ...process.env, 
        AAI_CONTINUOUS_MODE: 'true',
        AAI_AUTO_IMPROVE: 'true',
        AAI_BACKGROUND_MODE: 'true',
        AAI_LOG_LEVEL: 'INFO'
      }
    });

    // Send continuous improvement commands to the agent
    aaiProcess.stdin.write('logs level INFO\n');
    aaiProcess.stdin.write('context autopilot\n');
    
    // Set up periodic improvement commands
    setInterval(() => {
      if (!aaiProcess.killed) {
        // Rotate through different improvement activities
        const commands = [
          'smart-detect\n',
          'monitor-quality\n', 
          'detect-patterns\n',
          'agent-memory stats\n',
          'project-memory stats\n',
          'dependencies stats\n'
        ];
        
        const randomCommand = commands[Math.floor(Math.random() * commands.length)];
        aaiProcess.stdin.write(randomCommand);
      }
    }, 120000); // Every 2 minutes

    aaiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Agent initialized') || output.includes('Self-Improvement Agent') || output.includes('✅ All systems operational')) {
        console.log('✅ AAI Agent ready (Continuous Improvement Mode)');
        this.status.aaiAgent = true;
        this.emit('aai-ready');
      }
      // Log important AAI output with better filtering
      if (output.includes('analysis') || output.includes('improvement') || output.includes('✅') || 
          output.includes('🔍') || output.includes('📊') || output.includes('🧠') ||
          output.includes('pattern') || output.includes('suggestion')) {
        console.log(`🤖 AAI: ${output.trim()}`);
      }
    });

    aaiProcess.stderr.on('data', (data) => {
      const stderr = data.toString().trim();
      if (stderr && !stderr.includes('ExperimentalWarning') && !stderr.includes('DeprecationWarning')) {
        console.warn(`⚠️ AAI Error: ${stderr}`);
      }
    });

    // Handle process exit and auto-restart
    aaiProcess.on('close', (code) => {
      if (code !== 0) {
        console.warn(`⚠️ AAI Agent exited with code ${code}`);
        this.status.aaiAgent = false;
        
        // Auto-restart AAI agent if enabled
        if (this.config.autoRestart) {
          console.log('🔄 Restarting AAI Agent in 5 seconds...');
          setTimeout(() => this.launchAAIAgent(), 5000);
        }
      }
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
    
    // Start core monitoring
    const monitorProcess = spawn('npm', ['run', 'AAI:core-monitor'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Set status to true when process starts successfully (not when it closes)
    monitorProcess.on('spawn', () => {
      console.log('✅ Core Monitoring ready');
      this.status.monitoring = true;
      this.emit('monitoring-ready');
    });

    // Handle process output
    monitorProcess.stdout.on('data', (data) => {
      if (!this.config.silent) {
        console.log(`[Core Monitor] ${data.toString().trim()}`);
      }
    });

    monitorProcess.stderr.on('data', (data) => {
      console.warn(`[Core Monitor Error] ${data.toString().trim()}`);
    });

    // Handle unexpected process closure
    monitorProcess.on('close', (code) => {
      console.warn('⚠️ Core Monitoring process closed unexpectedly');
      this.status.monitoring = false;
      
      // Auto-restart if enabled
      if (this.config.autoRestart) {
        console.log('🔄 Restarting Core Monitoring...');
        setTimeout(() => this.launchCoreMonitoring(), 5000);
      }
    });

    this.processes.set('core-monitoring', monitorProcess);
  }

  /**
   * Start continuous operations with enhanced intelligence
   */
  startContinuousOperations() {
    console.log('🔄 Starting continuous operations...');

    // Health checks every minute
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Improvement cycles every 3 minutes
    setInterval(() => {
      this.performImprovementCycle();
    }, this.config.improvementInterval);

    // Intelligence enhancement every 5 minutes
    setInterval(() => {
      this.performIntelligenceEnhancement();
    }, this.config.intelligenceInterval);

    // Performance optimization every 10 minutes
    setInterval(() => {
      this.performPerformanceOptimization();
    }, this.config.performanceInterval);

    // System monitoring every 30 seconds
    setInterval(() => {
      this.performSystemMonitoring();
    }, this.config.monitoringInterval);

    console.log('✅ Continuous operations started\n');
  }

  /**
   * Perform intelligence enhancement cycle
   */
  async performIntelligenceEnhancement() {
    try {
      console.log('🧠 Running intelligence enhancement cycle...');
      
      // Check if intelligence directory exists and has recent activity
      const intelligenceDir = 'agents/_store/intelligence';
      if (fs.existsSync(intelligenceDir)) {
        // Run pattern analysis update
        await this.runCommand('AAI:intelligence-enhance', 'Updating intelligence patterns', false);
        console.log('✅ Intelligence enhancement completed');
      }
    } catch (error) {
      console.warn('⚠️ Intelligence enhancement cycle failed:', error.message);
    }
  }

  /**
   * Perform performance optimization cycle
   */
  async performPerformanceOptimization() {
    try {
      console.log('⚡ Running performance optimization cycle...');
      await this.runCommand('AAI:performance-optimize', 'Optimizing system performance', false);
      console.log('✅ Performance optimization completed');
    } catch (error) {
      console.warn('⚠️ Performance optimization cycle failed:', error.message);
    }
  }

  /**
   * Enhanced health check with intelligence monitoring
   */
  async performHealthCheck() {
    const timestamp = new Date().toLocaleTimeString();
    
    // Check process health (only check processes that should be running)
    const processHealth = {
      autoSync: this.processes.has('auto-sync') && !this.processes.get('auto-sync').killed,
      contextTracking: this.processes.has('context-tracking') && !this.processes.get('context-tracking').killed,
      memorySync: this.status.memorySync,
      monitoring: this.processes.has('core-monitoring') && !this.processes.get('core-monitoring').killed // Check if process is running
    };

    // AAI Agent runs in service mode, check if it's still alive
    const aaiAgent = this.processes.get('aai-agent');
    if (aaiAgent) {
      processHealth.aaiAgent = !aaiAgent.killed;
    }

    // Check intelligence system health (these are one-time operations, so just check if they completed)
    const intelligenceHealth = {
      intelligence: this.status.intelligence,
      performanceOptimized: this.status.performanceOptimized
    };

    // Core systems that must be working (including monitoring)
    const coreHealthy = processHealth.autoSync && processHealth.memorySync && processHealth.monitoring;
    
    // Count healthy processes
    const healthyProcesses = Object.values(processHealth).filter(Boolean).length;
    const totalProcesses = Object.keys(processHealth).length;

    if (coreHealthy && healthyProcesses >= totalProcesses - 1) { // Allow one process to be down
      console.log(`🔄 [${timestamp}] Health check... ${healthyProcesses}/${totalProcesses} systems operational`);
    } else {
      console.warn(`⚠️ [${timestamp}] Health check... ${healthyProcesses}/${totalProcesses} systems operational`);
      
      // Restart failed critical processes
      for (const [name, healthy] of Object.entries(processHealth)) {
        if (!healthy && this.config.autoRestart) {
          // Only restart critical processes
          if (name === 'autoSync' || name === 'contextTracking' || name === 'monitoring') {
            console.log(`🔄 Restarting ${name}...`);
            await this.restartProcess(name === 'monitoring' ? 'core-monitoring' : name);
          }
        }
      }
    }
  }

  /**
   * Enhanced improvement cycle with active AAI agent interaction
   */
  async performImprovementCycle() {
    this.improvementCycle++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`🔄 [${timestamp}] Active Improvement Cycle #${this.improvementCycle}`);

    try {
      // 1. Update script awareness
      await this.runCommand('cursor:script-awareness', 'Updating script awareness', false);

      // 2. Check memory sync status
      await this.runCommand('AAI:sync-preserved-status', 'Checking memory sync', false);

      // 3. Send improvement commands to AAI agent if it's running
      const aaiProcess = this.processes.get('aai-agent');
      if (aaiProcess && !aaiProcess.killed) {
        // Rotate through different improvement activities based on cycle number
        const cycleCommands = [
          'smart-detect\n',
          'analyze-context autopilot\n',
          'detect-issues --priority=high\n',
          'improve-critical\n',
          'monitor-quality\n',
          'predict-issues\n',
          'agent-memory search "improvement patterns"\n',
          'project-memory stats\n',
          'dependencies graph\n',
          'logs summary\n'
        ];
        
        const commandIndex = this.improvementCycle % cycleCommands.length;
        const command = cycleCommands[commandIndex];
        
        console.log(`🤖 Sending improvement command: ${command.trim()}`);
        aaiProcess.stdin.write(command);
      }

      // 4. Regenerate any missing files
      const criticalFiles = [
        'agents/_store/cursor-summaries/script-summary.json',
        'agents/_store/cursor-summaries/script-improvements.json'
      ];

      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          console.log(`📝 Regenerating missing file: ${file}`);
          await this.regenerateFile(file);
        }
      }

      // 5. Perform context-aware improvements every 5 cycles
      if (this.improvementCycle % 5 === 0) {
        console.log('🎯 Performing context-aware improvement analysis...');
        if (aaiProcess && !aaiProcess.killed) {
          aaiProcess.stdin.write('context autopilot\n');
          aaiProcess.stdin.write('analyze-phase-readiness\n');
          aaiProcess.stdin.write('validate-prerequisites\n');
        }
      }

      // 6. Memory sync every 10 cycles
      if (this.improvementCycle % 10 === 0) {
        console.log('🧠 Performing memory synchronization...');
        await this.runCommand('AAI:sync-both', 'Syncing memories', false);
      }

      console.log(`✅ Active Improvement Cycle #${this.improvementCycle} completed`);

    } catch (error) {
      console.warn(`⚠️ Improvement cycle #${this.improvementCycle} failed:`, error.message);
    }
  }

  /**
   * Enhanced system monitoring
   */
  performSystemMonitoring() {
    const uptime = Math.floor((new Date() - this.startTime) / 1000 / 60); // minutes
    const processCount = this.processes.size;
    
    // Enhanced status with intelligence
    const enhancedStatus = {
      ...this.status,
      uptime: `${uptime} minutes`,
      processes: processCount,
      cycles: this.improvementCycle
    };
    
    // Log status every 10 cycles (5 minutes)
    if (this.improvementCycle % 10 === 0) {
      console.log(`📊 System uptime: ${uptime} minutes | Cycles: ${this.improvementCycle}`);
    }
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
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      const checkReady = () => {
        attempts++;
        
        // Core components that must be ready
        const coreReady = this.status.cursorIntegration && 
                         this.status.autoSync && 
                         this.status.memorySync;
        
        // Intelligence components (nice to have but not blocking)
        const intelligenceReady = this.status.intelligence && 
                                 this.status.contextTracking && 
                                 this.status.performanceOptimized;
        
        // If core components are ready, proceed
        if (coreReady) {
          console.log('✅ Core components ready');
          if (intelligenceReady) {
            console.log('✅ Intelligence systems ready');
          } else {
            console.log('⏳ Intelligence systems still initializing (will continue in background)');
          }
          resolve();
          return;
        }
        
        // If we've waited too long, proceed anyway
        if (attempts >= maxAttempts) {
          console.log('⚠️ Some components still initializing, proceeding anyway...');
          resolve();
          return;
        }
        
        setTimeout(checkReady, 1000);
      };
      
      checkReady();
    });
  }

  /**
   * Run a command and wait for completion
   */
  async runCommand(command, description, silent = true) {
    if (!silent) {
    console.log(`⚡ ${description}...`);
    }
    
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
      case 'context-tracking':
        this.launchContextTracking();
        break;
      case 'core-monitoring':
        this.launchCoreMonitoring();
        break;
      default:
        console.warn(`⚠️ Unknown process type: ${processName}`);
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
   * Show system status with continuous improvement details
   */
  showSystemStatus() {
    const uptime = Math.floor((new Date() - this.startTime) / 1000 / 60); // minutes
    
    console.log('📊 CONTINUOUS IMPROVEMENT SYSTEM STATUS:');
    console.log('━'.repeat(60));
    console.log(`⏰ Uptime: ${uptime} minutes | Improvement Cycles: ${this.improvementCycle}`);
    console.log('');
    
    // Core Components
    console.log('🔧 Core Components:');
    const coreComponents = {
      'Cursor Integration': this.status.cursorIntegration,
      'AAI Agent (Continuous Mode)': this.status.aaiAgent,
      'Auto-Sync': this.status.autoSync,
      'Memory Sync': this.status.memorySync,
      'Core Monitoring': this.processes.has('core-monitoring') && !this.processes.get('core-monitoring').killed
    };
    
    Object.entries(coreComponents).forEach(([component, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`   ${icon} ${component}`);
    });
    
    // Intelligence Systems
    console.log('\n🧠 Intelligence & Improvement Systems:');
    const intelligenceSystems = {
      'Agent Intelligence': this.status.intelligence,
      'Context Tracking': this.processes.has('context-tracking') && !this.processes.get('context-tracking').killed,
      'Performance Optimized': this.status.performanceOptimized,
      'Continuous Improvement': this.config.continuousImprovement,
      'Auto-Restart': this.config.autoRestart
    };
    
    Object.entries(intelligenceSystems).forEach(([component, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`   ${icon} ${component}`);
    });
    
    // Active Processes
    console.log('\n🔄 Active Processes:');
    console.log(`   📊 Running Processes: ${this.processes.size}`);
    for (const [name, process] of this.processes) {
      const status = process.killed ? '❌' : '✅';
      console.log(`   ${status} ${name}`);
    }
    
    console.log('');
  }

  /**
   * Show available commands and continuous improvement features
   */
  showAvailableCommands() {
    console.log('🎯 CONTINUOUS IMPROVEMENT SYSTEM ACTIVE:');
    console.log('━'.repeat(60));
    console.log('   • Everything runs automatically - no manual intervention needed!');
    console.log('   • Press Ctrl+C to shutdown gracefully');
    console.log('   • Check logs above for real-time improvement activity');
    console.log('   • Open Cursor and press Ctrl/Cmd+P → type script names');
    console.log('');
    console.log('🤖 CONTINUOUS AI IMPROVEMENT FEATURES:');
    console.log('   ✅ Smart Detection - Every 2 minutes');
    console.log('   ✅ Quality Monitoring - Continuous');
    console.log('   ✅ Pattern Recognition - Every 3 minutes');
    console.log('   ✅ Memory Sync - Every 10 minutes');
    console.log('   ✅ Performance Optimization - Every 10 minutes');
    console.log('   ✅ Context Analysis - Every 15 minutes');
    console.log('   ✅ Auto-Restart - If any component fails');
    console.log('');
    console.log('📋 WHAT\'S RUNNING AUTOMATICALLY:');
    console.log('   🤖 AAI Agent - Continuous improvement mode');
    console.log('   🔄 Auto-Sync - Keeps Cursor updated');
    console.log('   🧠 Memory Sync - Synchronizes AI memory');
    console.log('   📊 Core Monitor - Monitors system health');
    console.log('   🎯 Context Tracker - Smart context awareness');
    console.log('   ⚡ Performance Optimizer - Continuous optimization');
    console.log('   🔄 Improvement Cycles - Active enhancement');
    console.log('');
    console.log('🚀 ACTIVE INTELLIGENCE FEATURES:');
    console.log('   • Pattern Learning - Learns from your code patterns');
    console.log('   • Context Awareness - Understands your workflow');
    console.log('   • Adaptive Behavior - Improves over time');
    console.log('   • Performance Monitoring - Real-time optimization');
    console.log('   • Proactive Suggestions - Anticipates your needs');
    console.log('   • Automatic Issue Detection - Finds problems early');
    console.log('   • Memory-Based Learning - Remembers successful patterns');
    console.log('');
    console.log('💡 RECOMMENDATION:');
    console.log('   Use ONLY "npm run launch" - everything else is automatic!');
    console.log('   The AI will continuously improve your workflow in the background.');
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
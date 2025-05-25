#!/usr/bin/env node

/**
 * 🛡️ Enhanced Cursor Settings Protection
 * 
 * Protects the enhanced .cursor/settings.json from being overwritten
 * by simple setup scripts and ensures persistence of detailed configuration
 */

const fs = require('fs');
const path = require('path');

class CursorSettingsProtector {
  constructor() {
    this.settingsPath = '.cursor/settings.json';
    this.backupPath = '.cursor/settings.enhanced.backup.json';
    this.protectionMarker = '.cursor/.enhanced-protection';
    this.minEnhancedLines = 100; // Enhanced version should have 100+ lines
  }

  /**
   * Check if current settings are enhanced version
   */
  isEnhancedVersion() {
    if (!fs.existsSync(this.settingsPath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(this.settingsPath, 'utf8');
      const lines = content.split('\n').length;
      const settings = JSON.parse(content);
      
      // Check for enhanced features
      const hasAAIFeatures = settings['aai.memoryTracking.enabled'] !== undefined || 
                            settings['aai.intelligenceMode'] !== undefined ||
                            settings['aai.autoSync.enabled'] !== undefined;
      const hasFileAssociations = Object.keys(settings['files.associations'] || {}).length > 10;
      const hasSearchPaths = Object.keys(settings['search.include'] || {}).length > 5;
      const hasJSONSchemas = (settings['json.schemas'] || []).length > 0;
      const hasCursorChatExclusions = (settings['cursor.chat.excludeFiles'] || []).length > 0;
      const hasCursorAIExclusions = (settings['cursor.ai.excludeFromContext'] || []).length > 0;
      
      return lines > this.minEnhancedLines && hasAAIFeatures && hasFileAssociations && 
             hasSearchPaths && hasJSONSchemas && (hasCursorChatExclusions || hasCursorAIExclusions);
    } catch (error) {
      console.warn('⚠️ Error checking settings version:', error.message);
      return false;
    }
  }

  /**
   * Create backup of enhanced settings
   */
  createEnhancedBackup() {
    if (fs.existsSync(this.settingsPath) && this.isEnhancedVersion()) {
      fs.copyFileSync(this.settingsPath, this.backupPath);
      console.log('💾 Created enhanced settings backup');
      return true;
    }
    return false;
  }

  /**
   * Restore enhanced settings from backup
   */
  restoreEnhancedSettings() {
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.settingsPath);
      console.log('🔄 Restored enhanced settings from backup');
      return true;
    }
    return false;
  }

  /**
   * Enable protection mode
   */
  enableProtection() {
    // Create backup first
    this.createEnhancedBackup();
    
    // Create protection marker
    const protectionInfo = {
      enabled: true,
      timestamp: new Date().toISOString(),
      version: 'enhanced',
      description: 'Protection enabled for enhanced Cursor settings'
    };
    
    fs.writeFileSync(this.protectionMarker, JSON.stringify(protectionInfo, null, 2));
    console.log('🛡️ Enhanced settings protection enabled');
  }

  /**
   * Check if protection is enabled
   */
  isProtectionEnabled() {
    return fs.existsSync(this.protectionMarker);
  }

  /**
   * Monitor and auto-restore if needed
   */
  monitorAndProtect() {
    if (!this.isProtectionEnabled()) {
      console.log('ℹ️ Protection not enabled. Run with --enable to activate.');
      return;
    }

    if (!this.isEnhancedVersion()) {
      console.log('⚠️ Simple settings detected! Restoring enhanced version...');
      
      if (this.restoreEnhancedSettings()) {
        console.log('✅ Enhanced settings restored successfully');
      } else {
        console.log('❌ Could not restore enhanced settings. Running enhanced setup...');
        this.runEnhancedSetup();
      }
    } else {
      console.log('✅ Enhanced settings are active and protected');
    }
  }

  /**
   * Run enhanced setup
   */
  runEnhancedSetup() {
    const { spawn } = require('child_process');
    
    console.log('🚀 Running enhanced cursor setup...');
    const setup = spawn('node', ['.cursor/rules/agents/_store/scripts/enhanced-cursor-setup.js'], {
      stdio: 'inherit'
    });
    
    setup.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Enhanced setup completed successfully');
        this.createEnhancedBackup();
      } else {
        console.log('❌ Enhanced setup failed with code:', code);
      }
    });
  }

  /**
   * Show current status
   */
  showStatus() {
    console.log('🛡️ CURSOR SETTINGS PROTECTION STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const isEnhanced = this.isEnhancedVersion();
    const isProtected = this.isProtectionEnabled();
    const hasBackup = fs.existsSync(this.backupPath);
    
    console.log(`📄 Settings Version: ${isEnhanced ? '✅ Enhanced' : '❌ Simple'}`);
    console.log(`🛡️ Protection: ${isProtected ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`💾 Backup Available: ${hasBackup ? '✅ Yes' : '❌ No'}`);
    
    if (fs.existsSync(this.settingsPath)) {
      const content = fs.readFileSync(this.settingsPath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`📊 Settings Lines: ${lines}`);
    }
    
    console.log('\n🔧 Commands:');
    console.log('   npm run cursor:protect --enable    # Enable protection');
    console.log('   npm run cursor:protect --monitor   # Check and restore if needed');
    console.log('   npm run cursor:protect --status    # Show this status');
    console.log('   npm run cursor:protect --restore   # Force restore from backup');
  }

  /**
   * Force restore enhanced settings
   */
  forceRestore() {
    console.log('🔄 Force restoring enhanced settings...');
    
    if (this.restoreEnhancedSettings()) {
      console.log('✅ Enhanced settings restored from backup');
    } else {
      console.log('⚠️ No backup found. Running enhanced setup...');
      this.runEnhancedSetup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const protector = new CursorSettingsProtector();
  const args = process.argv.slice(2);
  
  if (args.includes('--enable')) {
    protector.enableProtection();
  } else if (args.includes('--monitor')) {
    protector.monitorAndProtect();
  } else if (args.includes('--status')) {
    protector.showStatus();
  } else if (args.includes('--restore')) {
    protector.forceRestore();
  } else {
    protector.showStatus();
  }
}

module.exports = CursorSettingsProtector; 
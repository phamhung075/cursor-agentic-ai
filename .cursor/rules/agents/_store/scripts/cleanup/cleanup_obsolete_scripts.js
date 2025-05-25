#!/usr/bin/env node

/**
 * 🗑️ Cleanup Obsolete Scripts
 * 
 * Safely removes obsolete scripts and prepares updateable ones for modification
 */

const fs = require('fs').promises;
const path = require('path');

class ScriptsCleaner {
  constructor() {
    this.scriptsDir = 'scripts';
    this.backupDir = `backups/scripts-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    // Based on analysis, but corrected
    this.obsoleteScripts = [
      'complete_link_processing.sh', // Shell wrapper for obsolete scripts
      'fix_broken_links.sh', // Shell wrapper for obsolete scripts  
      'fix_cursor_rules_links.py', // Old .cursor link fixer
      'fix_cursor_rules_links_improved.py', // Old .cursor link fixer
      'rename-md-to-mdc.sh', // One-time conversion, no longer needed
      'fix_broken_links.py' // Large complex fixer, superseded by core_path_* tools
    ];
    
    this.updateableScripts = [
      'backup_main_branch_cursor_rules.sh', // Backup functionality, needs path updates
      'update_cursor_rules_files.py', // File list generator, needs _core paths
      'update_cursor_rules_files.sh' // Shell wrapper, needs _core paths
    ];
    
    this.results = {
      deleted: [],
      backedUp: [],
      errors: []
    };
  }

  /**
   * Clean up obsolete scripts
   */
  async cleanup() {
    console.log('🗑️ SCRIPTS CLEANUP');
    console.log('━'.repeat(60));
    console.log(`📁 Cleaning scripts in: ${this.scriptsDir}`);
    console.log('');

    try {
      // Create backup directory
      await this.createBackup();
      
      // Delete obsolete scripts
      await this.deleteObsoleteScripts();
      
      // Generate report
      await this.generateReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Backup all scripts before cleanup
    const scriptFiles = await fs.readdir(this.scriptsDir);
    for (const file of scriptFiles) {
      if (file.endsWith('.py') || file.endsWith('.js') || file.endsWith('.sh')) {
        const src = path.join(this.scriptsDir, file);
        const dest = path.join(this.backupDir, file);
        
        try {
          await fs.copyFile(src, dest);
          this.results.backedUp.push(file);
        } catch (error) {
          console.warn(`⚠️ Could not backup ${file}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Backup created: ${this.backupDir}`);
    console.log(`📦 Backed up ${this.results.backedUp.length} scripts`);
    console.log('');
  }

  /**
   * Delete obsolete scripts
   */
  async deleteObsoleteScripts() {
    console.log('🗑️ Deleting obsolete scripts...');
    
    for (const script of this.obsoleteScripts) {
      const scriptPath = path.join(this.scriptsDir, script);
      
      try {
        await fs.access(scriptPath);
        await fs.unlink(scriptPath);
        this.results.deleted.push(script);
        console.log(`  ✅ Deleted: ${script}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`  ⚪ Not found: ${script} (already deleted)`);
        } else {
          console.error(`  ❌ Error deleting ${script}: ${error.message}`);
          this.results.errors.push({ script, error: error.message });
        }
      }
    }
    
    console.log('');
  }

  /**
   * Generate cleanup report
   */
  async generateReport() {
    console.log('📊 CLEANUP RESULTS');
    console.log('━'.repeat(60));
    console.log(`🗑️ Scripts Deleted: ${this.results.deleted.length}`);
    console.log(`📦 Scripts Backed Up: ${this.results.backedUp.length}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log('');

    if (this.results.deleted.length > 0) {
      console.log('🗑️ DELETED SCRIPTS:');
      this.results.deleted.forEach(script => {
        console.log(`  ✅ ${script}`);
      });
      console.log('');
    }

    if (this.updateableScripts.length > 0) {
      console.log('🔧 UPDATEABLE SCRIPTS (NOT DELETED):');
      this.updateableScripts.forEach(script => {
        console.log(`  🔧 ${script} - Ready for updating to _core structure`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.script}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = '.cursor/rules/agents/_store/logs/scripts_cleanup_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results,
      updateableScripts: this.updateableScripts
    }, null, 2));
    console.log(`📝 Cleanup report saved: ${reportPath}`);
    console.log(`💾 Backup location: ${this.backupDir}`);
    console.log('');
    console.log('🎯 Scripts cleanup completed!');
  }
}

// Export for use as module
module.exports = ScriptsCleaner;

// CLI execution
if (require.main === module) {
  const cleaner = new ScriptsCleaner();
  cleaner.cleanup().then(results => {
    console.log('\n🎯 Cleanup complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   🗑️ ${results.deleted.length} obsolete scripts deleted`);
    console.log(`   📦 ${results.backedUp.length} scripts backed up`);
    
    if (results.deleted.length > 0) {
      console.log('\n🚀 Next Steps:');
      console.log('   1. Update the remaining scripts for _core structure');
      console.log('   2. Test the updated scripts');
      console.log('   3. Scripts are safely backed up if rollback needed');
    }
  }).catch(error => {
    console.error('💥 Cleanup error:', error.message);
    process.exit(1);
  });
} 
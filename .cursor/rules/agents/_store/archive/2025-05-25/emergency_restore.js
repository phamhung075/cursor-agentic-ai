#!/usr/bin/env node

/**
 * 🚨 Emergency Restore Script
 * 
 * Restores all corrupted .cursor/rules files from clean backups
 * Fixes the numbering corruption and broken links issue
 */

const fs = require('fs').promises;
const path = require('path');

class EmergencyRestore {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.backupDir = path.join(__dirname, '../project-memory/backups');
    this.restored = 0;
    this.errors = [];
  }

  /**
   * Main restore function
   */
  async restoreAllFiles() {
    console.log('🚨 EMERGENCY RESTORE OPERATION');
    console.log('━'.repeat(50));
    console.log('');

    try {
      // Create corrupted files backup before restore
      await this.createCorruptedBackup();

      // Get all backup files from the latest clean backup series
      const backupFiles = await this.getCleanBackupFiles();
      console.log(`📦 Found ${backupFiles.length} clean backup files to restore`);
      console.log('');

      // Restore each file
      for (const backupFile of backupFiles) {
        await this.restoreFile(backupFile);
      }

      console.log('');
      console.log('✅ EMERGENCY RESTORE COMPLETE');
      console.log(`📄 Files Restored: ${this.restored}`);
      console.log(`❌ Errors: ${this.errors.length}`);

      if (this.errors.length > 0) {
        console.log('');
        console.log('❌ Restore Errors:');
        this.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('💥 Emergency restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Get clean backup files (latest series before corruption)
   */
  async getCleanBackupFiles() {
    const backupFiles = await fs.readdir(this.backupDir);
    
    // Filter for the clean backup series (2025-05-24T09-03-25)
    const cleanBackups = backupFiles
      .filter(file => file.includes('2025-05-24T09-03-25') && file.endsWith('.mdc'))
      .map(file => ({
        backupPath: path.join(this.backupDir, file),
        originalName: this.extractOriginalFileName(file),
        targetPath: this.getTargetPath(file)
      }))
      .filter(item => item.targetPath); // Only files we can map to targets

    return cleanBackups;
  }

  /**
   * Extract original file name from backup file name
   */
  extractOriginalFileName(backupFileName) {
    // Remove timestamp and extension
    return backupFileName.replace(/_2025-05-24T09-03-25-\d+Z\.mdc$/, '.mdc');
  }

  /**
   * Map backup file to target path in .cursor/rules
   */
  getTargetPath(backupFileName) {
    const mapping = {
      // Main workflow files
      '00_Getting_Started': '01__AI-RUN/00_Getting_Started.mdc',
      '01_AutoPilot': '01__AI-RUN/01_AutoPilot.mdc',
      '01_Idea': '01__AI-RUN/01_Idea.mdc',
      '02_Market_Research': '01__AI-RUN/02_Market_Research.mdc',
      '03_Core_Concept': '01__AI-RUN/03_Core_Concept.mdc',
      '04_PRD_Generation': '01__AI-RUN/04_PRD_Generation.mdc',
      '05_Specs_Docs': '01__AI-RUN/05_Specs_Docs.mdc',
      '06_Task_Manager': '01__AI-RUN/06_Task_Manager.mdc',
      '07_Start_Building': '01__AI-RUN/07_Start_Building.mdc',
      '08_Testing': '01__AI-RUN/08_Testing.mdc',
      '09_Deployment': '01__AI-RUN/09_Deployment.mdc',

      // Template files
      'PRD_template': '01__AI-RUN/Template/PRD_template.mdc',
      'MCP-Context': '01__AI-RUN/Template/MCP-Context.mdc',

      // Quick reference
      'Quick_Self_Improvement_Reference': '01__AI-RUN/Quick_Self_Improvement_Reference.mdc',

      // Documentation files
      'AI_Coding_Agent_Optimization': '02__AI-DOCS/Documentation/AI_Coding_Agent_Optimization.mdc',
      'coding_conventions_template': '02__AI-DOCS/Conventions/coding_conventions_template.mdc',
      'design_conventions_template': '02__AI-DOCS/Conventions/design_conventions_template.mdc',
      'context_prime_template': '02__AI-DOCS/AI-Coder/ContextPrime/context_prime_template.mdc',

      // Task management
      'Roo_Task_Workflow': '02__AI-DOCS/TaskManagement/Roo_Task_Workflow.mdc',
      'Tasks_JSON_Structure': '02__AI-DOCS/TaskManagement/Tasks_JSON_Structure.mdc',

      // Specifications
      'feature_spec_template': '03__SPECS/features/feature_spec_template.mdc',

      // Root files
      'README': 'README.mdc',
      'logic': 'logic.mdc',
      'workflow': 'workflow.mdc',
      'Inspiration': 'Inspiration.mdc',

      // Tools
      'cursor_files_list': '00__TOOLS/cursor_files_list.mdc',
      'cursor_path_fix': '00__TOOLS/cursor_path_fix.mdc',
      'file_update_and_link_processing_guide': '00__TOOLS/file_update_and_link_processing_guide.mdc',

      // AI-Coder
      'SelfImprovement_Agent_Core': '02__AI-DOCS/AI-Coder/SelfImprovement_Agent_Core.mdc'
    };

    // Extract base name from backup file
    for (const [key, targetPath] of Object.entries(mapping)) {
      if (backupFileName.startsWith(key + '_')) {
        return path.join(this.baseDir, targetPath);
      }
    }

    return null;
  }

  /**
   * Restore a single file
   */
  async restoreFile(fileInfo) {
    try {
      console.log(`📄 Restoring: ${path.basename(fileInfo.targetPath)}`);

      // Read clean backup
      const cleanContent = await fs.readFile(fileInfo.backupPath, 'utf8');

      // Ensure target directory exists
      await fs.mkdir(path.dirname(fileInfo.targetPath), { recursive: true });

      // Write clean content to target
      await fs.writeFile(fileInfo.targetPath, cleanContent);

      console.log(`  ✅ Restored from backup: ${path.basename(fileInfo.backupPath)}`);
      this.restored++;

    } catch (error) {
      const errorMsg = `Failed to restore ${fileInfo.targetPath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Create backup of corrupted files before restore
   */
  async createCorruptedBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const corruptedBackupDir = path.join(__dirname, '../project-memory/corrupted-backup-' + timestamp);
    
    try {
      await fs.mkdir(corruptedBackupDir, { recursive: true });
      
      // Copy entire .cursor/rules directory
      await this.copyDirectory(this.baseDir, corruptedBackupDir);
      
      console.log(`💾 Corrupted files backed up to: ${corruptedBackupDir}`);
      console.log('');
    } catch (error) {
      console.warn(`⚠️  Could not backup corrupted files: ${error.message}`);
    }
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const restorer = new EmergencyRestore();
  restorer.restoreAllFiles().catch(error => {
    console.error('💥 Emergency restore error:', error.message);
    process.exit(1);
  });
}

module.exports = EmergencyRestore; 
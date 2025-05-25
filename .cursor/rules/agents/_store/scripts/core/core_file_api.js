#!/usr/bin/env node

/**
 * 🌐 Core File API
 * 
 * Simple API wrapper for easy integration with other scripts
 * Provides monitored file access and metadata operations
 */

const CoreFileManager = require('./core_file_manager.js');

class CoreFileAPI {
  constructor() {
    this.manager = new CoreFileManager();
    this.initialized = false;
  }

  /**
   * Initialize the API (call once)
   */
  async init() {
    if (!this.initialized) {
      await this.manager.loadDatabase();
      this.initialized = true;
    }
  }

  /**
   * Safely read a core file with monitoring and path fixing
   */
  async readFile(relativePath) {
    await this.init();
    
    const fullPath = require('path').join(this.manager.coreDir, relativePath);
    
    try {
      const content = await this.manager.monitoredRead(fullPath);
      
      // Update database
      await this.manager.processFile(fullPath, relativePath);
      await this.manager.saveDatabase();
      
      return content;
    } catch (error) {
      console.warn(`⚠️ Failed to read ${relativePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(relativePath) {
    await this.init();
    return this.manager.getFileInfo(relativePath);
  }

  /**
   * Search files
   */
  async searchFiles(query) {
    await this.init();
    return this.manager.searchFiles(query);
  }

  /**
   * Get all files with their status
   */
  async getAllFiles() {
    await this.init();
    return Object.values(this.manager.database.files);
  }

  /**
   * Get files by status
   */
  async getFilesByStatus(status = 'valid') {
    await this.init();
    return Object.values(this.manager.database.files).filter(
      file => file.status === status
    );
  }

  /**
   * Check if file exists and is valid
   */
  async isFileValid(relativePath) {
    await this.init();
    const fileInfo = this.manager.getFileInfo(relativePath);
    return fileInfo && fileInfo.status === 'valid';
  }

  /**
   * Get broken links
   */
  async getBrokenLinks() {
    await this.init();
    await this.manager.validateLinks();
    
    const brokenLinks = [];
    for (const [fileId, links] of Object.entries(this.manager.database.links)) {
      for (const link of links) {
        if (link.status === 'broken') {
          brokenLinks.push({
            source_file: this.manager.database.files[fileId]?.path,
            link: link
          });
        }
      }
    }
    return brokenLinks;
  }

  /**
   * Get recent file access
   */
  async getRecentAccess(limit = 10) {
    await this.init();
    return this.manager.database.access_log.slice(-limit);
  }

  /**
   * Get files that need attention
   */
  async getFilesNeedingAttention() {
    await this.init();
    
    return {
      corrupt: await this.getFilesByStatus('corrupt'),
      deleted: await this.getFilesByStatus('deleted'),
      broken_links: await this.getBrokenLinks()
    };
  }

  /**
   * Trigger a fresh scan
   */
  async triggerScan() {
    await this.init();
    await this.manager.fullScan();
    await this.manager.saveDatabase();
  }

  /**
   * Generate a quick status report
   */
  async getQuickStatus() {
    await this.init();
    
    const allFiles = await this.getAllFiles();
    const validFiles = allFiles.filter(f => f.status === 'valid');
    const corruptFiles = allFiles.filter(f => f.status === 'corrupt');
    const brokenLinks = await this.getBrokenLinks();
    
    return {
      total_files: allFiles.length,
      valid_files: validFiles.length,
      corrupt_files: corruptFiles.length,
      broken_links: brokenLinks.length,
      last_updated: this.manager.database.last_updated,
      health_score: Math.round((validFiles.length / allFiles.length) * 100)
    };
  }
}

// Singleton instance for easy use
const coreAPI = new CoreFileAPI();

// Export both class and singleton
module.exports = {
  CoreFileAPI,
  coreAPI
};

// Convenience functions for direct use
module.exports.readCoreFile = async (relativePath) => {
  return await coreAPI.readFile(relativePath);
};

module.exports.getCoreFileInfo = async (relativePath) => {
  return await coreAPI.getFileInfo(relativePath);
};

module.exports.searchCoreFiles = async (query) => {
  return await coreAPI.searchFiles(query);
};

module.exports.getCoreStatus = async () => {
  return await coreAPI.getQuickStatus();
};

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'read':
      if (!arg) {
        console.log('Usage: node core_file_api.js read <relative_path>');
        process.exit(1);
      }
      module.exports.readCoreFile(arg).then(content => {
        console.log('📄 File content:');
        console.log(content);
      }).catch(error => {
        console.error('❌ Error:', error.message);
      });
      break;
      
    case 'info':
      if (!arg) {
        console.log('Usage: node core_file_api.js info <relative_path>');
        process.exit(1);
      }
      module.exports.getCoreFileInfo(arg).then(info => {
        console.log('📊 File info:');
        console.log(JSON.stringify(info, null, 2));
      }).catch(error => {
        console.error('❌ Error:', error.message);
      });
      break;
      
    case 'search':
      if (!arg) {
        console.log('Usage: node core_file_api.js search <query>');
        process.exit(1);
      }
      module.exports.searchCoreFiles(arg).then(results => {
        console.log(`🔍 Search results for "${arg}":`);
        results.forEach(file => {
          console.log(`  📄 ${file.title} (${file.path})`);
        });
      }).catch(error => {
        console.error('❌ Error:', error.message);
      });
      break;
      
    case 'status':
      module.exports.getCoreStatus().then(status => {
        console.log('📊 Core Status:');
        console.log(JSON.stringify(status, null, 2));
      }).catch(error => {
        console.error('❌ Error:', error.message);
      });
      break;
      
    default:
      console.log('📋 Core File API Commands:');
      console.log('  read <path>    - Read a core file with monitoring');
      console.log('  info <path>    - Get file metadata');
      console.log('  search <query> - Search files');
      console.log('  status         - Get system status');
  }
} 
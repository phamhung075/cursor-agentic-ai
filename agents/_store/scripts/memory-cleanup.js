#!/usr/bin/env node

/**
 * 🧠 AAI Memory Cleanup Script
 * 
 * Analyzes and cleans outdated memory entries while preserving current useful data.
 * Removes old dependency tracking, analysis data, and obsolete embeddings.
 */

const fs = require('fs');
const path = require('path');

class MemoryCleanup {
  constructor() {
    this.memoryDir = 'agents/_store/memory';
    this.backupDir = 'agents/_store/archive/memory-cleanup-' + new Date().toISOString().split('T')[0];
    this.stats = {
      totalFiles: 0,
      totalSize: 0,
      removedFiles: 0,
      removedSize: 0,
      keptFiles: 0,
      keptSize: 0
    };
  }

  /**
   * Main cleanup process
   */
  async cleanup() {
    console.log('🧠 AAI Memory Cleanup Starting...\n');

    try {
      // 1. Analyze current memory
      await this.analyzeMemory();

      // 2. Create backup
      await this.createBackup();

      // 3. Clean outdated entries
      await this.cleanOutdatedMemory();

      // 4. Update memory index
      await this.updateMemoryIndex();

      // 5. Show results
      this.showResults();

    } catch (error) {
      console.error('❌ Memory cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze current memory usage
   */
  async analyzeMemory() {
    console.log('📊 Analyzing current memory usage...');

    const memoryContents = this.getDirectoryContents(this.memoryDir);
    
    console.log('\n📁 Current Memory Structure:');
    for (const item of memoryContents) {
      const itemPath = path.join(this.memoryDir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const dirContents = fs.readdirSync(itemPath);
        const dirSize = this.getDirectorySize(itemPath);
        console.log(`   📂 ${item}/ - ${dirContents.length} files (${this.formatSize(dirSize)})`);
      } else {
        console.log(`   📄 ${item} - ${this.formatSize(stats.size)}`);
      }
    }

    this.stats.totalFiles = this.countFiles(this.memoryDir);
    this.stats.totalSize = this.getDirectorySize(this.memoryDir);
    
    console.log(`\n📊 Total: ${this.stats.totalFiles} files, ${this.formatSize(this.stats.totalSize)}`);
  }

  /**
   * Create backup of current memory
   */
  async createBackup() {
    console.log('\n💾 Creating backup...');
    
    // Create backup directory
    fs.mkdirSync(this.backupDir, { recursive: true });
    
    // Copy current memory to backup
    this.copyDirectory(this.memoryDir, this.backupDir);
    
    console.log(`✅ Backup created: ${this.backupDir}`);
  }

  /**
   * Clean outdated memory entries
   */
  async cleanOutdatedMemory() {
    console.log('\n🧹 Cleaning outdated memory entries...');

    // Define what to keep vs remove
    const keepFiles = [
      'index.json',
      'pinecone-sync-status.json', 
      'core_file_database.json'
    ];

    const keepPatterns = [
      /\.content$/,           // Preserved code content
      /\.memory\.json$/       // Preserved code metadata
    ];

    const removeDirectories = [
      'dependencies',
      'file_dependencies', 
      'dependency_graph',
      'file_invalidation',
      'file_reanalysis',
      'technical_note',
      'user_preference',
      'project_context',
      'success_pattern',
      'learning',
      'embeddings',
      'contexts',
      'analysis'
    ];

    // Remove outdated directories
    for (const dirName of removeDirectories) {
      const dirPath = path.join(this.memoryDir, dirName);
      if (fs.existsSync(dirPath)) {
        const dirSize = this.getDirectorySize(dirPath);
        const fileCount = this.countFiles(dirPath);
        
        console.log(`🗑️ Removing ${dirName}/ - ${fileCount} files (${this.formatSize(dirSize)})`);
        
        fs.rmSync(dirPath, { recursive: true, force: true });
        
        this.stats.removedFiles += fileCount;
        this.stats.removedSize += dirSize;
      }
    }

    // Check root level files
    const rootFiles = fs.readdirSync(this.memoryDir);
    for (const fileName of rootFiles) {
      const filePath = path.join(this.memoryDir, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const shouldKeep = keepFiles.includes(fileName) || 
                          keepPatterns.some(pattern => pattern.test(fileName));
        
        if (shouldKeep) {
          console.log(`✅ Keeping ${fileName} - ${this.formatSize(stats.size)}`);
          this.stats.keptFiles++;
          this.stats.keptSize += stats.size;
        } else {
          console.log(`🗑️ Removing ${fileName} - ${this.formatSize(stats.size)}`);
          fs.unlinkSync(filePath);
          this.stats.removedFiles++;
          this.stats.removedSize += stats.size;
        }
      }
    }
  }

  /**
   * Update memory index after cleanup
   */
  async updateMemoryIndex() {
    console.log('\n📝 Updating memory index...');

    const indexPath = path.join(this.memoryDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      
      // Update cleanup timestamp
      index.lastCleanup = new Date().toISOString();
      index.cleanupStats = {
        filesRemoved: this.stats.removedFiles,
        sizeFreed: this.stats.removedSize,
        filesKept: this.stats.keptFiles
      };
      
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
      console.log('✅ Memory index updated');
    }
  }

  /**
   * Show cleanup results
   */
  showResults() {
    console.log('\n🎉 Memory Cleanup Complete!\n');
    
    console.log('📊 CLEANUP RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🗑️ Files Removed: ${this.stats.removedFiles}`);
    console.log(`💾 Space Freed: ${this.formatSize(this.stats.removedSize)}`);
    console.log(`✅ Files Kept: ${this.stats.keptFiles}`);
    console.log(`📁 Current Size: ${this.formatSize(this.stats.keptSize)}`);
    
    const reductionPercent = ((this.stats.removedSize / this.stats.totalSize) * 100).toFixed(1);
    console.log(`📉 Size Reduction: ${reductionPercent}%`);
    
    console.log('\n✅ PRESERVED:');
    console.log('   • Preserved code memory (9 files)');
    console.log('   • Core file database');
    console.log('   • Pinecone sync status');
    console.log('   • Memory index');
    
    console.log('\n🗑️ REMOVED:');
    console.log('   • Old dependency tracking');
    console.log('   • Outdated analysis data');
    console.log('   • Legacy embeddings');
    console.log('   • Obsolete learning data');
    
    console.log(`\n💾 Backup available at: ${this.backupDir}`);
    console.log('\n🚀 Memory system is now clean and optimized!');
  }

  /**
   * Helper methods
   */
  getDirectoryContents(dirPath) {
    return fs.readdirSync(dirPath);
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  countFiles(dirPath) {
    let fileCount = 0;
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        fileCount += this.countFiles(itemPath);
      } else {
        fileCount++;
      }
    }
    
    return fileCount;
  }

  copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Main execution
async function main() {
  const cleanup = new MemoryCleanup();
  
  try {
    await cleanup.cleanup();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MemoryCleanup; 
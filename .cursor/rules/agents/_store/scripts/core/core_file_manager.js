#!/usr/bin/env node

/**
 * 🗃️ Core File Manager
 * 
 * Comprehensive system for managing .cursor/rules/agents/_store/projects/_core folder
 * Features:
 * - Metadata tracking (title, path, description, status, links)
 * - Continuous memory updates
 * - Automatic path fixing
 * - Link validation and correction
 * - File access monitoring
 */

const fs = require('fs').promises;
const path = require('path');

class CoreFileManager {
  constructor() {
    this.coreDir = '.cursor/rules/agents/_store/projects/_core';
    this.databasePath = '.cursor/rules/agents/_store/memory/core_file_database.json';
    this.accessLogPath = '.cursor/rules/agents/_store/logs/core_file_access.log';
    
    this.database = {
      files: {},
      links: {},
      access_log: [],
      last_updated: null,
      scan_history: [],
      fix_history: []
    };
    
    this.stats = {
      total_files: 0,
      corrupt_files: 0,
      fixed_paths: 0,
      broken_links: 0,
      valid_links: 0
    };
  }

  /**
   * Initialize the core file manager
   */
  async initialize() {
    console.log('🗃️ CORE FILE MANAGER INITIALIZATION');
    console.log('━'.repeat(60));
    
    try {
      // Create necessary directories
      await this.createDirectories();
      
      // Load existing database
      await this.loadDatabase();
      
      // Perform initial scan
      await this.fullScan();
      
      // Save updated database
      await this.saveDatabase();
      
      console.log('\n✅ Core File Manager initialized successfully!');
      return this.database;
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    const dirs = [
      path.dirname(this.databasePath),
      path.dirname(this.accessLogPath)
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load existing database
   */
  async loadDatabase() {
    try {
      const data = await fs.readFile(this.databasePath, 'utf8');
      this.database = { ...this.database, ...JSON.parse(data) };
      console.log(`📖 Loaded existing database with ${Object.keys(this.database.files).length} files`);
    } catch (error) {
      console.log('📝 Creating new database (no existing database found)');
    }
  }

  /**
   * Save database to disk
   */
  async saveDatabase() {
    this.database.last_updated = new Date().toISOString();
    await fs.writeFile(this.databasePath, JSON.stringify(this.database, null, 2));
  }

  /**
   * Perform full scan of core directory
   */
  async fullScan() {
    console.log('\n🔍 SCANNING CORE DIRECTORY');
    console.log('━'.repeat(50));
    
    const scanId = `scan_${Date.now()}`;
    const scanStart = new Date().toISOString();
    
    await this.scanDirectory(this.coreDir, '');
    
    // Record scan in history
    this.database.scan_history.push({
      id: scanId,
      timestamp: scanStart,
      completed: new Date().toISOString(),
      files_found: this.stats.total_files,
      corrupt_files: this.stats.corrupt_files,
      fixes_applied: this.stats.fixed_paths
    });
    
    // Keep only last 10 scans
    if (this.database.scan_history.length > 10) {
      this.database.scan_history = this.database.scan_history.slice(-10);
    }
    
    console.log(`\n📊 Scan completed: ${this.stats.total_files} files processed`);
  }

  /**
   * Recursively scan directory
   */
  async scanDirectory(dirPath, relativePath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, relPath);
        } else if (entry.isFile() && this.isRelevantFile(entry.name)) {
          await this.processFile(fullPath, relPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Check if file is relevant for tracking
   */
  isRelevantFile(filename) {
    const extensions = ['.mdc', '.md', '.json', '.txt'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Process individual file
   */
  async processFile(fullPath, relativePath) {
    this.stats.total_files++;
    const fileId = this.generateFileId(relativePath);
    
    console.log(`📄 Processing: ${relativePath}`);
    
    try {
      // Try to read file with path fixing
      const content = await this.readFileWithFix(fullPath);
      
      // Extract metadata
      const metadata = await this.extractMetadata(fullPath, content);
      
      // Extract links
      const links = this.extractLinks(content, relativePath);
      
      // Update database
      this.database.files[fileId] = {
        id: fileId,
        title: metadata.title,
        path: relativePath,
        full_path: fullPath,
        description: metadata.description,
        status: 'valid',
        size: content.length,
        last_modified: await this.getLastModified(fullPath),
        last_accessed: new Date().toISOString(),
        links_out: links.outgoing,
        links_in: [], // Will be populated in post-processing
        fix_history: metadata.fixes || [],
        content_hash: this.generateHash(content)
      };
      
      // Store links for validation
      this.database.links[fileId] = links.outgoing;
      
    } catch (error) {
      console.warn(`  ⚠️ Error processing ${relativePath}: ${error.message}`);
      this.stats.corrupt_files++;
      
      // Record corrupt file
      this.database.files[fileId] = {
        id: fileId,
        title: path.basename(relativePath, path.extname(relativePath)),
        path: relativePath,
        full_path: fullPath,
        description: 'Could not read file - may be corrupt',
        status: 'corrupt',
        error: error.message,
        last_accessed: new Date().toISOString(),
        fix_needed: true
      };
    }
  }

  /**
   * Read file with automatic path fixing
   */
  async readFileWithFix(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Try to find file with similar name
        const fixedPath = await this.attemptPathFix(filePath);
        if (fixedPath) {
          console.log(`  🔧 Fixed path: ${filePath} → ${fixedPath}`);
          this.stats.fixed_paths++;
          
          // Record fix
          this.database.fix_history.push({
            timestamp: new Date().toISOString(),
            original_path: filePath,
            fixed_path: fixedPath,
            type: 'path_correction'
          });
          
          return await fs.readFile(fixedPath, 'utf8');
        }
      }
      throw error;
    }
  }

  /**
   * Attempt to fix corrupted file path
   */
  async attemptPathFix(originalPath) {
    const dir = path.dirname(originalPath);
    const filename = path.basename(originalPath);
    
    try {
      const files = await fs.readdir(dir);
      
      // Try exact match (case insensitive)
      for (const file of files) {
        if (file.toLowerCase() === filename.toLowerCase()) {
          return path.join(dir, file);
        }
      }
      
      // Try fuzzy match
      for (const file of files) {
        if (this.fuzzyMatch(filename, file)) {
          return path.join(dir, file);
        }
      }
      
    } catch (error) {
      // Directory doesn't exist, try parent directories
    }
    
    return null;
  }

  /**
   * Fuzzy match for similar filenames
   */
  fuzzyMatch(target, candidate) {
    const targetBase = path.basename(target, path.extname(target));
    const candidateBase = path.basename(candidate, path.extname(candidate));
    
    // Simple similarity check
    const similarity = this.calculateSimilarity(targetBase, candidateBase);
    return similarity > 0.8;
  }

  /**
   * Calculate string similarity
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Extract metadata from file
   */
  async extractMetadata(filePath, content) {
    const metadata = {
      title: path.basename(filePath, path.extname(filePath)),
      description: 'No description available',
      fixes: []
    };
    
    const lines = content.split('\n').slice(0, 20);
    
    // Extract title from first heading or filename
    for (const line of lines) {
      if (line.startsWith('# ')) {
        metadata.title = line.substring(2).trim();
        break;
      }
    }
    
    // Extract description from content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('**') && line.length > 20) {
        metadata.description = line.substring(0, 200);
        break;
      }
    }
    
    return metadata;
  }

  /**
   * Extract links from content
   */
  extractLinks(content, sourceFile) {
    const links = { outgoing: [] };
    
    // Markdown links: [text](path)
    const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    
    for (const link of markdownLinks) {
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const linkText = match[1];
        const linkPath = match[2];
        
        if (!linkPath.startsWith('http')) {
          links.outgoing.push({
            text: linkText,
            path: linkPath,
            type: 'markdown',
            source_file: sourceFile,
            status: 'unchecked'
          });
        }
      }
    }
    
    // File references: common patterns
    const fileRefs = content.match(/[a-zA-Z0-9_-]+\.(mdc|md|json)/g) || [];
    
    for (const ref of fileRefs) {
      if (!links.outgoing.some(link => link.path.includes(ref))) {
        links.outgoing.push({
          text: ref,
          path: ref,
          type: 'file_reference',
          source_file: sourceFile,
          status: 'unchecked'
        });
      }
    }
    
    return links;
  }

  /**
   * Validate all links in database
   */
  async validateLinks() {
    console.log('\n🔗 VALIDATING LINKS');
    console.log('━'.repeat(50));
    
    let validLinks = 0;
    let brokenLinks = 0;
    
    for (const [fileId, links] of Object.entries(this.database.links)) {
      for (const link of links) {
        const isValid = await this.validateLink(link, fileId);
        if (isValid) {
          validLinks++;
          link.status = 'valid';
        } else {
          brokenLinks++;
          link.status = 'broken';
        }
      }
    }
    
    this.stats.valid_links = validLinks;
    this.stats.broken_links = brokenLinks;
    
    console.log(`✅ Valid links: ${validLinks}`);
    console.log(`❌ Broken links: ${brokenLinks}`);
  }

  /**
   * Validate individual link
   */
  async validateLink(link, sourceFileId) {
    try {
      const sourceFile = this.database.files[sourceFileId];
      if (!sourceFile) return false;
      
      const sourceDir = path.dirname(sourceFile.full_path);
      const targetPath = path.resolve(sourceDir, link.path);
      
      await fs.access(targetPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file last modified time
   */
  async getLastModified(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * Generate file ID from path
   */
  generateFileId(relativePath) {
    return relativePath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Generate content hash
   */
  generateHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Log file access
   */
  async logAccess(filePath, operation = 'read') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      file: filePath,
      operation: operation,
      success: true
    };
    
    this.database.access_log.push(logEntry);
    
    // Keep only last 1000 access entries
    if (this.database.access_log.length > 1000) {
      this.database.access_log = this.database.access_log.slice(-1000);
    }
    
    // Also write to log file
    const logLine = `[${logEntry.timestamp}] ${operation.toUpperCase()}: ${filePath}\n`;
    await fs.appendFile(this.accessLogPath, logLine);
  }

  /**
   * Get file information by path
   */
  getFileInfo(relativePath) {
    const fileId = this.generateFileId(relativePath);
    return this.database.files[fileId];
  }

  /**
   * Search files by title or description
   */
  searchFiles(query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const file of Object.values(this.database.files)) {
      if (
        file.title.toLowerCase().includes(searchTerm) ||
        file.description.toLowerCase().includes(searchTerm) ||
        file.path.toLowerCase().includes(searchTerm)
      ) {
        results.push(file);
      }
    }
    
    return results.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    await this.validateLinks();
    
    console.log('\n📊 CORE FILE MANAGER REPORT');
    console.log('━'.repeat(60));
    console.log(`📁 Total files tracked: ${Object.keys(this.database.files).length}`);
    console.log(`✅ Valid files: ${Object.keys(this.database.files).length - this.stats.corrupt_files}`);
    console.log(`❌ Corrupt files: ${this.stats.corrupt_files}`);
    console.log(`🔧 Paths fixed: ${this.stats.fixed_paths}`);
    console.log(`🔗 Valid links: ${this.stats.valid_links}`);
    console.log(`💔 Broken links: ${this.stats.broken_links}`);
    console.log(`📊 Access entries: ${this.database.access_log.length}`);
    
    const reportPath = '.cursor/rules/agents/_store/logs/core_file_manager_report.json';
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.stats,
      database_summary: {
        total_files: Object.keys(this.database.files).length,
        total_links: Object.keys(this.database.links).length,
        access_log_entries: this.database.access_log.length,
        last_scan: this.database.scan_history.slice(-1)[0]
      },
      files_by_status: this.getFilesByStatus(),
      recent_access: this.database.access_log.slice(-10)
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 Report saved: ${reportPath}`);
    
    return report;
  }

  /**
   * Get files grouped by status
   */
  getFilesByStatus() {
    const byStatus = {};
    
    for (const file of Object.values(this.database.files)) {
      if (!byStatus[file.status]) {
        byStatus[file.status] = [];
      }
      byStatus[file.status].push(file.path);
    }
    
    return byStatus;
  }

  /**
   * Monitor file access (wrapper for reading files)
   */
  async monitoredRead(filePath) {
    await this.logAccess(filePath, 'read');
    return await this.readFileWithFix(filePath);
  }

  /**
   * Safe file reader with continuous monitoring
   */
  static async safeRead(filePath) {
    const manager = new CoreFileManager();
    await manager.loadDatabase();
    return await manager.monitoredRead(filePath);
  }
}

// Export for use as module
module.exports = CoreFileManager;

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'scan';
  const manager = new CoreFileManager();
  
  switch (command) {
    case 'scan':
      manager.initialize().then(() => {
        console.log('\n🎯 Core file scan completed!');
      });
      break;
      
    case 'report':
      manager.loadDatabase().then(() => {
        return manager.generateReport();
      }).then(() => {
        console.log('\n🎯 Report generated!');
      });
      break;
      
    case 'search':
      const query = process.argv[3];
      if (!query) {
        console.log('Usage: node core_file_manager.js search <query>');
        process.exit(1);
      }
      manager.loadDatabase().then(() => {
        const results = manager.searchFiles(query);
        console.log(`\n🔍 Search results for "${query}":`);
        results.forEach(file => {
          console.log(`  📄 ${file.title} (${file.path})`);
          console.log(`     ${file.description}`);
        });
      });
      break;
      
    default:
      console.log('Usage: node core_file_manager.js [scan|report|search <query>]');
  }
} 
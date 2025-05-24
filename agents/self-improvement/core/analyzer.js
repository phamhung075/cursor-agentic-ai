/**
 * 🔍 File Analyzer - Core analysis functionality
 * 
 * Handles file reading, content analysis, and issue detection
 */

const fs = require('fs').promises;
const path = require('path');

class FileAnalyzer {
  constructor(detector) {
    this.detector = detector;
    this.rulesPath = '.cursor/rules';
  }

  /**
   * Analyze a specific file for improvements
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const improvements = [];
      
      // Critical issue detection
      const criticalIssues = this.detector.detectCriticalIssues(content, filePath);
      improvements.push(...criticalIssues);
      
      // Obsolete pattern detection
      const obsoleteIssues = this.detector.detectObsoleteContent(content, filePath);
      improvements.push(...obsoleteIssues.slice(0, 3)); // Limit to top 3
      
      return improvements;
      
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Find a specific file in the rules directory
   */
  async findFile(filename) {
    const searchName = filename.endsWith('.mdc') ? filename : `${filename}.mdc`;
    const allFiles = await this.getAllMdcFiles();
    
    // Find exact match
    const exactMatch = allFiles.find(file => 
      path.basename(file).toLowerCase() === searchName.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const partialMatch = allFiles.find(file => 
      path.basename(file).toLowerCase().includes(filename.toLowerCase())
    );
    
    return partialMatch;
  }

  /**
   * Get all MDC files in the rules directory
   */
  async getAllMdcFiles() {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.mdc')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that don't exist
      }
    }
    
    await scanDirectory(this.rulesPath);
    return files;
  }

  /**
   * Find files relevant to current context
   */
  async findRelevantFiles(context) {
    const allFiles = await this.getAllMdcFiles();
    const relevantFiles = [];
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const filename = path.basename(file).toLowerCase();
        
        // Check if file is relevant to context
        if (content.toLowerCase().includes(context.toLowerCase()) ||
            filename.includes(context.toLowerCase())) {
          relevantFiles.push(file);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return relevantFiles;
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;
      const characters = content.length;
      const codeBlocks = (content.match(/```/g) || []).length / 2;
      
      return {
        lines,
        characters,
        codeBlocks,
        lastModified: (await fs.stat(filePath)).mtime
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = FileAnalyzer; 
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
    this.rulesPath = 'agents/_store/projects/_core/rules'; // Updated to use new path
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

  /**
   * Find files in a directory with extension
   */
  findFiles(directory, extension) {
    const files = [];
    
    try {
      const items = require('fs').readdirSync(directory, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(directory, item.name);
        
        if (item.isDirectory()) {
          files.push(...this.findFiles(fullPath, extension));
        } else if (item.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that don't exist
    }
    
    return files;
  }

  /**
   * Analyze core framework files
   */
  async analyzeCoreFramework() {
    const coreFrameworkPath = 'agents/_store/projects/_core';
    const workflowFiles = this.findFiles(path.join(coreFrameworkPath, 'rules/01__AI-RUN'), '.mdc');
    
    const analysis = {
      workflowStages: workflowFiles.length,
      templates: this.findFiles(path.join(coreFrameworkPath, 'rules/02__AI-DOCS'), '.mdc').length,
      specifications: this.findFiles(path.join(coreFrameworkPath, 'rules/03__SPECS'), '.mdc').length,
      totalFiles: this.findFiles(coreFrameworkPath, '.mdc').length
    };
    
    return analysis;
  }

  /**
   * Get core framework suggestions
   */
  async getCoreFrameworkSuggestions(context) {
    const coreAnalysis = await this.analyzeCoreFramework();
    
    return {
      framework: 'Agentic Coding Framework',
      version: '2.0',
      location: 'agents/_store/projects/_core',
      analysis: coreAnalysis,
      recommendations: [
        'Use core workflow templates for new projects',
        'Reference established patterns from core framework',
        'Leverage proven specifications and documentation templates'
      ]
    };
  }

}

module.exports = FileAnalyzer;
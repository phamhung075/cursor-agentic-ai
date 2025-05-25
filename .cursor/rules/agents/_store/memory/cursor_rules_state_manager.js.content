#!/usr/bin/env node

/**
 * 🗂️ Cursor Rules State Manager
 * 
 * Comprehensive state management system for .cursor/rules files
 * Handles content updates, path fixes, and synchronization with agent capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CursorRulesStateManager {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.stateFile = path.join(__dirname, '../project-memory/cursor_rules_state.json');
    this.projectMemoryDir = path.join(__dirname, '../project-memory');
    this.projectsDir = path.join(__dirname, '../projects');
    
    this.state = {
      lastUpdated: null,
      files: {},
      directories: {},
      metadata: {
        totalFiles: 0,
        totalDirectories: 0,
        lastScan: null,
        version: '1.0.0'
      }
    };
  }

  /**
   * Initialize the state manager
   */
  async initialize() {
    console.log('🗂️ Initializing Cursor Rules State Manager...');
    
    // Ensure directories exist
    await fs.mkdir(this.projectMemoryDir, { recursive: true });
    await fs.mkdir(this.projectsDir, { recursive: true });
    
    // Load existing state if available
    await this.loadState();
    
    // Scan current files
    await this.scanAllFiles();
    
    console.log('✅ State Manager initialized');
    console.log(`📊 Tracking ${this.state.metadata.totalFiles} files in ${this.state.metadata.totalDirectories} directories`);
  }

  /**
   * Load existing state from file
   */
  async loadState() {
    try {
      const stateData = await fs.readFile(this.stateFile, 'utf8');
      const loadedState = JSON.parse(stateData);
      this.state = { ...this.state, ...loadedState };
      console.log('💾 Loaded existing state');
    } catch (error) {
      console.log('🆕 Creating new state file');
    }
  }

  /**
   * Save current state to file
   */
  async saveState() {
    this.state.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    console.log('💾 State saved');
  }

  /**
   * Scan all files in .cursor/rules directory
   */
  async scanAllFiles() {
    console.log('🔍 Scanning .cursor/rules directory...');
    
    this.state.metadata.lastScan = new Date().toISOString();
    await this.scanDirectory(this.baseDir, '');
    
    this.state.metadata.totalFiles = Object.keys(this.state.files).length;
    this.state.metadata.totalDirectories = Object.keys(this.state.directories).length;
    
    await this.saveState();
  }

  /**
   * Recursively scan a directory
   */
  async scanDirectory(fullPath, relativePath) {
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      // Track directory
      if (relativePath) {
        this.state.directories[relativePath] = {
          path: relativePath,
          fullPath: fullPath,
          lastScanned: new Date().toISOString(),
          itemCount: entries.length
        };
      }
      
      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const relativeEntryPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
        
        if (entry.isDirectory()) {
          await this.scanDirectory(entryPath, relativeEntryPath);
        } else if (entry.isFile()) {
          await this.analyzeFile(entryPath, relativeEntryPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error scanning directory ${fullPath}:`, error.message);
    }
  }

  /**
   * Analyze a single file and create state entry
   */
  async analyzeFile(fullPath, relativePath) {
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      
      // Determine file type and category
      const fileInfo = this.analyzeFileContent(content, relativePath);
      
      this.state.files[relativePath] = {
        // Basic file info
        path: relativePath,
        fullPath: fullPath,
        filename: path.basename(relativePath),
        extension: path.extname(relativePath),
        directory: path.dirname(relativePath),
        
        // Content tracking
        contentHash: contentHash,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        lastAnalyzed: new Date().toISOString(),
        
        // Content analysis
        category: fileInfo.category,
        type: fileInfo.type,
        purpose: fileInfo.purpose,
        dependencies: fileInfo.dependencies,
        references: fileInfo.references,
        
        // Status tracking
        status: 'analyzed',
        needsUpdate: false,
        issues: [],
        
        // Agent integration
        agentCompatible: fileInfo.agentCompatible,
        modernizationNeeded: fileInfo.modernizationNeeded,
        
        // Metadata
        lineCount: content.split('\n').length,
        wordCount: content.split(/\s+/).length,
        hasCodeBlocks: content.includes('```'),
        hasTables: content.includes('|'),
        hasLinks: content.includes('[') && content.includes(']')
      };
      
      // Check for issues
      await this.detectIssues(relativePath, content);
      
    } catch (error) {
      console.warn(`⚠️ Error analyzing file ${fullPath}:`, error.message);
    }
  }

  /**
   * Analyze file content to determine type and characteristics
   */
  analyzeFileContent(content, relativePath) {
    const filename = path.basename(relativePath);
    const directory = path.dirname(relativePath);
    
    let category = 'unknown';
    let type = 'documentation';
    let purpose = 'general';
    let agentCompatible = true;
    let modernizationNeeded = false;
    
    // Determine category by directory
    if (directory.includes('01__AI-RUN')) {
      category = 'workflow';
      type = 'agent-workflow';
    } else if (directory.includes('02__AI-DOCS')) {
      category = 'documentation';
      type = 'agent-docs';
    } else if (directory.includes('03__SPECS')) {
      category = 'specifications';
      type = 'technical-specs';
    } else if (directory.includes('00__TOOLS')) {
      category = 'tools';
      type = 'utilities';
    } else if (directory.includes('projet')) {
      category = 'project';
      type = 'project-data';
    } else if (directory.includes('tasks')) {
      category = 'tasks';
      type = 'task-management';
    }
    
    // Determine purpose by filename
    if (filename.includes('Getting_Started')) {
      purpose = 'onboarding';
    } else if (filename.includes('AutoPilot')) {
      purpose = 'automation';
    } else if (filename.includes('PRD')) {
      purpose = 'requirements';
    } else if (filename.includes('Market_Research')) {
      purpose = 'research';
    } else if (filename.includes('Testing')) {
      purpose = 'testing';
    } else if (filename.includes('Deployment')) {
      purpose = 'deployment';
    }
    
    // Extract dependencies and references
    const dependencies = this.extractDependencies(content);
    const references = this.extractReferences(content);
    
    // Check for modernization needs
    modernizationNeeded = this.needsModernization(content);
    
    return {
      category,
      type,
      purpose,
      dependencies,
      references,
      agentCompatible,
      modernizationNeeded
    };
  }

  /**
   * Extract file dependencies from content
   */
  extractDependencies(content) {
    const dependencies = [];
    
    // Extract .mdc file references
    const mdcRefs = content.match(/\[([^\]]+\.mdc)\]/g);
    if (mdcRefs) {
      dependencies.push(...mdcRefs.map(ref => ref.slice(1, -1)));
    }
    
    // Extract path references
    const pathRefs = content.match(/.cursor/rules/agents\/_store\/projects\/_core\/rules\/[^)\s]+/g);
    if (pathRefs) {
      dependencies.push(...pathRefs);
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Extract external references from content
   */
  extractReferences(content) {
    const references = [];
    
    // Extract URLs
    const urls = content.match(/https?:\/\/[^\s)]+/g);
    if (urls) {
      references.push(...urls);
    }
    
    // Extract tool/service references
    const tools = content.match(/\b(Next\.js|Supabase|Tailwind|OpenAI|Pinecone|MCP|Cursor|Cline|Windsurf)\b/g);
    if (tools) {
      references.push(...tools);
    }
    
    return [...new Set(references)];
  }

  /**
   * Check if content needs modernization
   */
  needsModernization(content) {
    const outdatedPatterns = [
      /Node\.js 14/i,
      /React 16/i,
      /Next\.js 12/i,
      /npm 6/i,
      /Python 3\.7/i,
      /\bTypescript 3\./i,
      /\bES2015\b/i,
      /\bES6\b/i
    ];
    
    return outdatedPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect issues in file content
   */
  async detectIssues(relativePath, content) {
    const fileState = this.state.files[relativePath];
    const issues = [];
    
    // Check for broken links
    const dependencies = fileState.dependencies;
    for (const dep of dependencies) {
      if (dep.endsWith('.mdc')) {
        const depPath = path.resolve(this.baseDir, dep);
        try {
          await fs.access(depPath);
        } catch {
          issues.push({
            type: 'broken_link',
            severity: 'high',
            message: `Broken reference to ${dep}`,
            line: this.findLineNumber(content, dep)
          });
        }
      }
    }
    
    // Check for outdated content
    if (fileState.modernizationNeeded) {
      issues.push({
        type: 'outdated_content',
        severity: 'medium',
        message: 'Content contains outdated technology references',
        suggestion: 'Update to current versions'
      });
    }
    
    // Check for missing sections (for workflow files)
    if (fileState.category === 'workflow') {
      const requiredSections = ['## Purpose', '## Steps', '## Output'];
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          issues.push({
            type: 'missing_section',
            severity: 'medium',
            message: `Missing required section: ${section}`
          });
        }
      }
    }
    
    fileState.issues = issues;
    fileState.needsUpdate = issues.length > 0;
  }

  /**
   * Find line number of a pattern in content
   */
  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return null;
  }

  /**
   * Get files that need updates
   */
  getFilesNeedingUpdate() {
    return Object.values(this.state.files).filter(file => file.needsUpdate);
  }

  /**
   * Get files by category
   */
  getFilesByCategory(category) {
    return Object.values(this.state.files).filter(file => file.category === category);
  }

  /**
   * Get comprehensive status report
   */
  getStatusReport() {
    const files = Object.values(this.state.files);
    const filesNeedingUpdate = files.filter(f => f.needsUpdate);
    const categories = [...new Set(files.map(f => f.category))];
    
    const report = {
      summary: {
        totalFiles: files.length,
        filesNeedingUpdate: filesNeedingUpdate.length,
        categories: categories.length,
        lastScan: this.state.metadata.lastScan
      },
      categories: {},
      issues: {
        high: 0,
        medium: 0,
        low: 0
      },
      modernization: {
        needed: files.filter(f => f.modernizationNeeded).length,
        total: files.length
      }
    };
    
    // Group by category
    for (const category of categories) {
      const categoryFiles = files.filter(f => f.category === category);
      report.categories[category] = {
        count: categoryFiles.length,
        needsUpdate: categoryFiles.filter(f => f.needsUpdate).length,
        files: categoryFiles.map(f => ({
          path: f.path,
          status: f.status,
          issues: f.issues.length
        }))
      };
    }
    
    // Count issues by severity
    for (const file of files) {
      for (const issue of file.issues) {
        report.issues[issue.severity]++;
      }
    }
    
    return report;
  }

  /**
   * Generate update plan for all files
   */
  async generateUpdatePlan() {
    const filesNeedingUpdate = this.getFilesNeedingUpdate();
    const plan = {
      timestamp: new Date().toISOString(),
      totalFiles: filesNeedingUpdate.length,
      phases: [],
      estimatedTime: 0
    };
    
    // Phase 1: Critical fixes (broken links, missing files)
    const criticalFiles = filesNeedingUpdate.filter(f => 
      f.issues.some(issue => issue.severity === 'high')
    );
    
    if (criticalFiles.length > 0) {
      plan.phases.push({
        name: 'Critical Fixes',
        priority: 1,
        files: criticalFiles.map(f => f.path),
        estimatedTime: criticalFiles.length * 15, // 15 minutes per file
        tasks: criticalFiles.map(f => ({
          file: f.path,
          issues: f.issues.filter(i => i.severity === 'high'),
          actions: ['Fix broken links', 'Verify references', 'Update paths']
        }))
      });
    }
    
    // Phase 2: Content modernization
    const modernizationFiles = filesNeedingUpdate.filter(f => f.modernizationNeeded);
    
    if (modernizationFiles.length > 0) {
      plan.phases.push({
        name: 'Content Modernization',
        priority: 2,
        files: modernizationFiles.map(f => f.path),
        estimatedTime: modernizationFiles.length * 30, // 30 minutes per file
        tasks: modernizationFiles.map(f => ({
          file: f.path,
          actions: ['Update technology versions', 'Modernize syntax', 'Verify compatibility']
        }))
      });
    }
    
    // Phase 3: Structure improvements
    const structureFiles = filesNeedingUpdate.filter(f => 
      f.issues.some(issue => issue.type === 'missing_section')
    );
    
    if (structureFiles.length > 0) {
      plan.phases.push({
        name: 'Structure Improvements',
        priority: 3,
        files: structureFiles.map(f => f.path),
        estimatedTime: structureFiles.length * 20, // 20 minutes per file
        tasks: structureFiles.map(f => ({
          file: f.path,
          issues: f.issues.filter(i => i.type === 'missing_section'),
          actions: ['Add missing sections', 'Improve structure', 'Enhance readability']
        }))
      });
    }
    
    plan.estimatedTime = plan.phases.reduce((total, phase) => total + phase.estimatedTime, 0);
    
    // Save plan to project memory
    const planPath = path.join(this.projectMemoryDir, 'update_plan.json');
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    
    return plan;
  }

  /**
   * Export state for external tools
   */
  async exportState() {
    const exportData = {
      metadata: this.state.metadata,
      summary: this.getStatusReport(),
      files: this.state.files,
      directories: this.state.directories,
      exportedAt: new Date().toISOString()
    };
    
    const exportPath = path.join(this.projectsDir, 'cursor_rules_export.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`📤 State exported to: ${exportPath}`);
    return exportPath;
  }
}

module.exports = CursorRulesStateManager; 
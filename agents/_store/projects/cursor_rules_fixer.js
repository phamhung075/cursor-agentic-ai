#!/usr/bin/env node

/**
 * 🔧 Cursor Rules File Fixer
 * 
 * Utility to actually implement fixes for .cursor/rules files
 * Handles broken links, path updates, content modernization, and structure improvements
 */

const fs = require('fs').promises;
const path = require('path');

class CursorRulesFileFixer {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.backupDir = path.join(__dirname, '../project-memory/backups');
    this.fixLog = [];
  }

  /**
   * Initialize the fixer
   */
  async initialize() {
    await fs.mkdir(this.backupDir, { recursive: true });
    console.log('🔧 File Fixer initialized');
  }

  /**
   * Fix broken file references
   */
  async fixBrokenLinks(filePath, issues) {
    console.log(`🔗 Fixing broken links in: ${filePath}`);
    
    // Create backup first
    await this.createBackup(filePath);
    
    const fullPath = path.resolve(this.baseDir, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let hasChanges = false;
    
    for (const issue of issues) {
      if (issue.type === 'broken_link') {
        const brokenRef = this.extractBrokenReference(issue.message);
        const fixedRef = await this.findCorrectReference(brokenRef);
        
        if (fixedRef) {
          content = content.replace(brokenRef, fixedRef);
          hasChanges = true;
          
          this.logFix({
            file: filePath,
            type: 'broken_link',
            original: brokenRef,
            fixed: fixedRef,
            line: issue.line
          });
          
          console.log(`  ✅ Fixed: ${brokenRef} → ${fixedRef}`);
        } else {
          console.log(`  ❌ Could not find replacement for: ${brokenRef}`);
        }
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(fullPath, content);
      console.log(`  💾 Updated file: ${filePath}`);
    }
    
    return hasChanges;
  }

  /**
   * Update file paths to match current structure
   */
  async fixFilePaths(filePath, issues) {
    console.log(`📁 Fixing file paths in: ${filePath}`);
    
    await this.createBackup(filePath);
    
    const fullPath = path.resolve(this.baseDir, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let hasChanges = false;
    
    // Common path fixes
    const pathMappings = {
      // Old path patterns → New path patterns
      'rules/01__AI-RUN/': '.cursor/rules/01__AI-RUN/',
      'rules/02__AI-DOCS/': '.cursor/rules/02__AI-DOCS/',
      'rules/03__SPECS/': '.cursor/rules/03__SPECS/',
      'project/': '.cursor/rules/projet/',
      'tasks.json': '.cursor/rules/tasks/tasks.json',
      
      // Agent system updates
      'agents/self-improvement/': 'agents/self-improvement/',
      'agents/_store/': 'agents/_store/',
      
      // Fix relative imports
      './': './',
      '../': '../'
    };
    
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      if (content.includes(oldPath) && oldPath !== newPath) {
        const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newPath);
        hasChanges = true;
        
        this.logFix({
          file: filePath,
          type: 'path_update',
          original: oldPath,
          fixed: newPath
        });
        
        console.log(`  ✅ Updated path: ${oldPath} → ${newPath}`);
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(fullPath, content);
      console.log(`  💾 Updated file: ${filePath}`);
    }
    
    return hasChanges;
  }

  /**
   * Modernize outdated content
   */
  async modernizeContent(filePath) {
    console.log(`🔄 Modernizing content in: ${filePath}`);
    
    await this.createBackup(filePath);
    
    const fullPath = path.resolve(this.baseDir, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let hasChanges = false;
    
    // Technology version updates
    const modernizations = {
      // Node.js versions
      'Node.js 14': 'Node.js 20',
      'Node.js 16': 'Node.js 20',
      'Node.js 18': 'Node.js 20',
      
      // React versions
      'React 16': 'React 18',
      'React 17': 'React 18',
      
      // Next.js versions
      'Next.js 12': 'Next.js 14',
      'Next.js 13': 'Next.js 14',
      
      // TypeScript versions
      'TypeScript 3.': 'TypeScript 5.',
      'TypeScript 4.': 'TypeScript 5.',
      
      // Package manager versions
      'npm 6': 'npm 10',
      'npm 8': 'npm 10',
      'yarn 1.': 'yarn 4.',
      
      // Syntax modernization
      'ES2015': 'ES2023',
      'ES6': 'ES2023',
      'ES2020': 'ES2023',
      
      // Framework updates
      'Tailwind CSS 2': 'Tailwind CSS 3',
      'Supabase v1': 'Supabase v2',
      
      // Tool updates
      'Webpack 4': 'Webpack 5',
      'Babel 6': 'Babel 7',
      'ESLint 6': 'ESLint 8'
    };
    
    for (const [oldTech, newTech] of Object.entries(modernizations)) {
      if (content.includes(oldTech)) {
        content = content.replace(new RegExp(oldTech, 'g'), newTech);
        hasChanges = true;
        
        this.logFix({
          file: filePath,
          type: 'modernization',
          original: oldTech,
          fixed: newTech
        });
        
        console.log(`  ✅ Modernized: ${oldTech} → ${newTech}`);
      }
    }
    
    // Update API patterns
    hasChanges = await this.modernizeAPIPatterns(content, filePath) || hasChanges;
    
    if (hasChanges) {
      await fs.writeFile(fullPath, content);
      console.log(`  💾 Updated file: ${filePath}`);
    }
    
    return hasChanges;
  }

  /**
   * Fix missing sections in workflow files
   */
  async fixMissingSections(filePath, issues) {
    console.log(`📋 Fixing missing sections in: ${filePath}`);
    
    await this.createBackup(filePath);
    
    const fullPath = path.resolve(this.baseDir, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let hasChanges = false;
    
    for (const issue of issues) {
      if (issue.type === 'missing_section') {
        const section = this.extractMissingSection(issue.message);
        const sectionContent = this.generateSectionContent(section, filePath);
        
        if (sectionContent) {
          // Add section at the end of the file
          content += '\n\n' + sectionContent;
          hasChanges = true;
          
          this.logFix({
            file: filePath,
            type: 'missing_section',
            added: section
          });
          
          console.log(`  ✅ Added section: ${section}`);
        }
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(fullPath, content);
      console.log(`  💾 Updated file: ${filePath}`);
    }
    
    return hasChanges;
  }

  /**
   * Sync file with current agent capabilities
   */
  async syncWithAgentCapabilities(filePath) {
    console.log(`🤖 Syncing with agent capabilities: ${filePath}`);
    
    await this.createBackup(filePath);
    
    const fullPath = path.resolve(this.baseDir, filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    let hasChanges = false;
    
    // Add current agent system references
    const agentUpdates = {
      // Add self-improvement agent references
      'AI agent': 'AI agent (with self-improvement capabilities)',
      'Cursor agent': 'Cursor agent (enhanced with self-improvement system)',
      'Cline agent': 'Cline agent (enhanced with self-improvement system)',
      'Windsurf agent': 'Windsurf agent (enhanced with self-improvement system)',
      
      // Update memory system references
      'AI memory': 'AI memory (with persistent learning and context)',
      'context awareness': 'context awareness (enhanced with memory persistence)',
      
      // Add current tool integrations
      'MCP servers': 'MCP servers (Context7, Supabase, Playwright, etc.)',
      'external tools': 'external tools (via MCP: Context7, Supabase, Playwright, Puppeteer, Shadcn)',
      
      // Update file organization references
      'project files': 'project files (organized in agents/_store structure)',
      'test files': 'test files (located in agents/_store/tests)',
      'documentation': 'documentation (organized in agents/_store/docs)'
    };
    
    for (const [oldRef, newRef] of Object.entries(agentUpdates)) {
      if (content.includes(oldRef) && !content.includes(newRef)) {
        content = content.replace(new RegExp(oldRef, 'g'), newRef);
        hasChanges = true;
        
        this.logFix({
          file: filePath,
          type: 'agent_sync',
          original: oldRef,
          fixed: newRef
        });
        
        console.log(`  ✅ Synced: ${oldRef} → ${newRef}`);
      }
    }
    
    if (hasChanges) {
      await fs.writeFile(fullPath, content);
      console.log(`  💾 Updated file: ${filePath}`);
    }
    
    return hasChanges;
  }

  /**
   * Create backup of file before modification
   */
  async createBackup(filePath) {
    const fullPath = path.resolve(this.baseDir, filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${path.basename(filePath, path.extname(filePath))}_${timestamp}${path.extname(filePath)}`;
    const backupPath = path.join(this.backupDir, backupFileName);
    
    try {
      await fs.copyFile(fullPath, backupPath);
      console.log(`  💾 Backup created: ${backupFileName}`);
    } catch (error) {
      console.warn(`  ⚠️ Could not create backup: ${error.message}`);
    }
  }

  /**
   * Extract broken reference from error message
   */
  extractBrokenReference(message) {
    const match = message.match(/Broken reference to (.+)/);
    return match ? match[1] : null;
  }

  /**
   * Find correct reference for broken link
   */
  async findCorrectReference(brokenRef) {
    // Try to find the file in the current structure
    const possiblePaths = [
      path.join(this.baseDir, brokenRef),
      path.join(this.baseDir, '01__AI-RUN', brokenRef),
      path.join(this.baseDir, '02__AI-DOCS', brokenRef),
      path.join(this.baseDir, '03__SPECS', brokenRef),
      path.join(this.baseDir, 'projet', brokenRef)
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        return path.relative(this.baseDir, possiblePath);
      } catch {
        // File doesn't exist at this path
      }
    }
    
    // Try partial matching
    return await this.findSimilarFile(brokenRef);
  }

  /**
   * Find similar file name in case of typos or moves
   */
  async findSimilarFile(brokenRef) {
    const fileName = path.basename(brokenRef);
    const allFiles = await this.getAllMdcFiles();
    
    // Find exact match first
    const exactMatch = allFiles.find(file => path.basename(file) === fileName);
    if (exactMatch) return exactMatch;
    
    // Find partial match
    const partialMatch = allFiles.find(file => 
      path.basename(file).toLowerCase().includes(fileName.toLowerCase()) ||
      fileName.toLowerCase().includes(path.basename(file).toLowerCase())
    );
    
    return partialMatch || null;
  }

  /**
   * Get all .mdc files in the rules directory
   */
  async getAllMdcFiles(dir = this.baseDir, relativeTo = this.baseDir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllMdcFiles(fullPath, relativeTo);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
          files.push(path.relative(relativeTo, fullPath));
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  /**
   * Extract missing section from error message
   */
  extractMissingSection(message) {
    const match = message.match(/Missing required section: (.+)/);
    return match ? match[1] : null;
  }

  /**
   * Generate content for missing section
   */
  generateSectionContent(section, filePath) {
    const templates = {
      '## Purpose': `## Purpose

This section defines the purpose and objectives of this workflow step.

### Key Goals:
- Define clear objectives
- Establish success criteria
- Align with overall framework goals`,

      '## Steps': `## Steps

This section outlines the step-by-step process for this workflow.

### Process:
1. **Preparation**: Set up necessary resources and context
2. **Execution**: Follow the defined workflow process
3. **Validation**: Verify outputs and quality
4. **Documentation**: Record results and learnings`,

      '## Output': `## Output

This section describes the expected outputs and deliverables.

### Expected Deliverables:
- Primary output files
- Documentation updates
- Status reports
- Next steps recommendations`
    };
    
    return templates[section] || `${section}

This section needs to be defined based on the specific requirements of this workflow step.`;
  }

  /**
   * Modernize API patterns
   */
  async modernizeAPIPatterns(content, filePath) {
    let hasChanges = false;
    
    // Update API call patterns
    const apiUpdates = {
      // Fetch API modernization
      'fetch()': 'fetch() with proper error handling',
      'axios.get': 'fetch API or modern HTTP client',
      
      // Async/await patterns
      'Promise.then': 'async/await syntax',
      '.catch()': 'try/catch with async/await',
      
      // Modern JavaScript patterns
      'var ': 'const ',
      'function()': 'arrow functions or modern function syntax'
    };
    
    for (const [oldPattern, newPattern] of Object.entries(apiUpdates)) {
      if (content.includes(oldPattern)) {
        // Don't auto-replace these, just log recommendations
        this.logFix({
          file: filePath,
          type: 'api_modernization_suggestion',
          suggestion: `Consider updating ${oldPattern} to ${newPattern}`
        });
      }
    }
    
    return hasChanges;
  }

  /**
   * Log a fix for tracking
   */
  logFix(fix) {
    this.fixLog.push({
      ...fix,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get fix log
   */
  getFixLog() {
    return this.fixLog;
  }

  /**
   * Save fix log to file
   */
  async saveFixLog() {
    const logPath = path.join(this.backupDir, `fix_log_${Date.now()}.json`);
    await fs.writeFile(logPath, JSON.stringify(this.fixLog, null, 2));
    console.log(`📝 Fix log saved: ${logPath}`);
    return logPath;
  }

  /**
   * Generate fix report
   */
  generateFixReport() {
    const fixTypes = {};
    
    for (const fix of this.fixLog) {
      if (!fixTypes[fix.type]) {
        fixTypes[fix.type] = 0;
      }
      fixTypes[fix.type]++;
    }
    
    return {
      totalFixes: this.fixLog.length,
      fixTypes,
      files: [...new Set(this.fixLog.map(f => f.file))].length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CursorRulesFileFixer; 
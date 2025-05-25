#!/usr/bin/env node

/**
 * 🔧 Automated Cursor Rules Fixer
 * 
 * Comprehensive automated fix system for .cursor/rules files
 * Fixes broken links, updates paths, and modernizes content in batch
 */

const fs = require('fs').promises;
const path = require('path');
const CursorRulesStateManager = require('./cursor_rules_state_manager.js');
const CursorRulesFileFixer = require('./cursor_rules_fixer.js');

class AutomatedCursorRulesFixer {
  constructor() {
    this.baseDir = path.join(process.cwd(), '.cursor/rules');
    this.manager = new CursorRulesStateManager();
    this.fixer = new CursorRulesFileFixer();
    this.results = {
      filesProcessed: 0,
      linksFixed: 0,
      pathsUpdated: 0,
      sectionsAdded: 0,
      errors: []
    };
  }

  /**
   * Initialize and run automated fixes
   */
  async runAutomatedFixes() {
    console.log('🚀 Starting Automated Cursor Rules Fixes...');
    console.log('━'.repeat(70));
    console.log('');

    try {
      // Initialize systems
      await this.manager.initialize();
      await this.fixer.initialize();

      // Get files needing updates
      const filesNeedingUpdate = this.manager.getFilesNeedingUpdate();
      console.log(`📊 Found ${filesNeedingUpdate.length} files needing updates`);

      // Phase 1: Fix Critical Issues (Broken Links)
      console.log('');
      console.log('🔴 Phase 1: Fixing Broken Links');
      console.log('━'.repeat(50));
      await this.fixBrokenLinksPhase(filesNeedingUpdate);

      // Phase 2: Update File Paths
      console.log('');
      console.log('🟡 Phase 2: Updating File Paths');
      console.log('━'.repeat(50));
      await this.updateFilePathsPhase(filesNeedingUpdate);

      // Phase 3: Add Missing Sections
      console.log('');
      console.log('🟢 Phase 3: Adding Missing Sections');
      console.log('━'.repeat(50));
      await this.addMissingSectionsPhase(filesNeedingUpdate);

      // Phase 4: Modernize Content
      console.log('');
      console.log('🔄 Phase 4: Modernizing Content');
      console.log('━'.repeat(50));
      await this.modernizeContentPhase(filesNeedingUpdate);

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Automated fix failed:', error.message);
      throw error;
    }
  }

  /**
   * Phase 1: Fix broken file references
   */
  async fixBrokenLinksPhase(files) {
    const filesWithBrokenLinks = files.filter(f => 
      f.issues.some(issue => issue.type === 'broken_link')
    );

    console.log(`🔗 Processing ${filesWithBrokenLinks.length} files with broken links...`);

    for (const file of filesWithBrokenLinks) {
      try {
        console.log(`📄 Fixing links in: ${file.path}`);
        
        const fullPath = path.resolve(this.baseDir, file.path);
        let content = await fs.readFile(fullPath, 'utf8');
        let hasChanges = false;

        // Create backup
        await this.createBackup(file.path);

        // Apply comprehensive link fixes
        const linkFixes = await this.generateLinkFixes();
        
        for (const [brokenRef, fixedRef] of Object.entries(linkFixes)) {
          if (content.includes(brokenRef)) {
            // Use regex to handle different link formats
            const patterns = [
              new RegExp(`\\[([^\\]]+)\\]\\(${this.escapeRegex(brokenRef)}\\)`, 'g'),
              new RegExp(`\\[${this.escapeRegex(brokenRef)}\\]`, 'g'),
              new RegExp(`${this.escapeRegex(brokenRef)}(?!\\))`, 'g')
            ];

            for (const pattern of patterns) {
              if (pattern.test(content)) {
                content = content.replace(pattern, (match, linkText) => {
                  if (linkText) {
                    return `[${linkText}](${fixedRef})`;
                  } else if (match.startsWith('[') && match.endsWith(']')) {
                    return `[${fixedRef}]`;
                  } else {
                    return fixedRef;
                  }
                });
                hasChanges = true;
                this.results.linksFixed++;
              }
            }
          }
        }

        if (hasChanges) {
          await fs.writeFile(fullPath, content);
          console.log(`  ✅ Updated ${file.path}`);
          this.results.filesProcessed++;
        } else {
          console.log(`  ⚪ No changes needed for ${file.path}`);
        }

      } catch (error) {
        console.error(`  ❌ Error fixing ${file.path}:`, error.message);
        this.results.errors.push({ file: file.path, error: error.message });
      }
    }
  }

  /**
   * Generate comprehensive link fixes mapping
   */
  async generateLinkFixes() {
    const linkFixes = {};

    // Map broken references to correct paths
    const correctPaths = {
      // Workflow files
      '00_Getting_Started.mdc': '.cursor/rules/01__AI-RUN/00_Getting_Started.mdc',
      '01_AutoPilot.mdc': '.cursor/rules/01__AI-RUN/01_AutoPilot.mdc',
      '01_Idea.mdc': '.cursor/rules/01__AI-RUN/01_Idea.mdc',
      '02_Market_Research.mdc': '.cursor/rules/01__AI-RUN/02_Market_Research.mdc',
      '03_Core_Concept.mdc': '.cursor/rules/01__AI-RUN/03_Core_Concept.mdc',
      'core_concept.mdc': '.cursor/rules/01__AI-RUN/03_Core_Concept.mdc',
      '04_PRD_Generation.mdc': '.cursor/rules/01__AI-RUN/04_PRD_Generation.mdc',
      '05_Specs_Docs.mdc': '.cursor/rules/01__AI-RUN/05_Specs_Docs.mdc',
      '06_Task_Manager.mdc': '.cursor/rules/01__AI-RUN/06_Task_Manager.mdc',
      '07_Start_Building.mdc': '.cursor/rules/01__AI-RUN/07_Start_Building.mdc',
      '08_Testing.mdc': '.cursor/rules/01__AI-RUN/08_Testing.mdc',
      '09_Deployment.mdc': '.cursor/rules/01__AI-RUN/09_Deployment.mdc',

      // Template files
      'MCP-Context.mdc': '.cursor/rules/01__AI-RUN/Template/MCP-Context.mdc',
      'PRD_template.mdc': '.cursor/rules/01__AI-RUN/Template/PRD_template.mdc',

      // Documentation files
      'AI_Coding_Agent_Optimization.mdc': '.cursor/rules/02__AI-DOCS/Documentation/AI_Coding_Agent_Optimization.mdc',
      'AI_Design_Agent_Optimization.mdc': '.cursor/rules/02__AI-DOCS/Documentation/AI_Design_Agent_Optimization.mdc',
      'AI_Task_Management_Optimization.mdc': '.cursor/rules/02__AI-DOCS/Documentation/AI_Task_Management_Optimization.mdc',

      // AI-Coder templates
      'api_endpoint_template.mdc': '.cursor/rules/02__AI-DOCS/AI-Coder/CommonTasks/api_endpoint_template.mdc',
      'context_prime_template.mdc': '.cursor/rules/02__AI-DOCS/AI-Coder/ContextPrime/context_prime_template.mdc',
      'refactoring_template.mdc': '.cursor/rules/02__AI-DOCS/AI-Coder/Refactoring/refactoring_template.mdc',
      'test_generator_template.mdc': '.cursor/rules/02__AI-DOCS/AI-Coder/TestGenerators/test_generator_template.mdc',

      // Architecture and structure
      'architecture_template.mdc': '.cursor/rules/02__AI-DOCS/Architecture/architecture_template.mdc',
      'business_logic_template.mdc': '.cursor/rules/02__AI-DOCS/BusinessLogic/business_logic_template.mdc',
      'coding_conventions_template.mdc': '.cursor/rules/02__AI-DOCS/Conventions/coding_conventions_template.mdc',
      'design_conventions_template.mdc': '.cursor/rules/02__AI-DOCS/Conventions/design_conventions_template.mdc',
      'deployment_guide_template.mdc': '.cursor/rules/02__AI-DOCS/Deployment/deployment_guide_template.mdc',
      'api_integration_template.mdc': '.cursor/rules/02__AI-DOCS/Integrations/api_integration_template.mdc',

      // Task management
      'Roo_Task_Workflow.mdc': '.cursor/rules/02__AI-DOCS/TaskManagement/Roo_Task_Workflow.mdc',
      'Tasks_JSON_Structure.mdc': '.cursor/rules/02__AI-DOCS/TaskManagement/Tasks_JSON_Structure.mdc',

      // Specs
      'feature_spec_template.mdc': '.cursor/rules/03__SPECS/features/feature_spec_template.mdc',
      'bugfix_spec_template.mdc': '.cursor/rules/03__SPECS/bugfixes/bugfix_spec_template.mdc',

      // Project files
      'idea_document.mdc': '.cursor/rules/projet/01_Idea/idea_document.mdc',
      'market_research.mdc': '.cursor/rules/projet/02_Market_Research/market_research.mdc',
      'project_prd.mdc': '.cursor/rules/projet/PRD_template/project_prd.mdc',

      // Root files
      'logic.mdc': '.cursor/rules/logic.mdc',
      'workflow.mdc': '.cursor/rules/workflow.mdc',
      'README.mdc': '.cursor/rules/README.mdc',
      'Inspiration.mdc': '.cursor/rules/Inspiration.mdc',

      // Tools
      'cursor_files_list.mdc': '.cursor/rules/00__TOOLS/cursor_files_list.mdc',
      'cursor_path_fix.mdc': '.cursor/rules/00__TOOLS/cursor_path_fix.mdc',
      'file_update_and_link_processing_guide.mdc': '.cursor/rules/00__TOOLS/file_update_and_link_processing_guide.mdc'
    };

    // Add the mappings to linkFixes
    for (const [broken, fixed] of Object.entries(correctPaths)) {
      linkFixes[broken] = fixed;
    }

    // Handle files that reference themselves or have redundant paths
    const redundantPaths = [
      'filename.mdc',
      't.mdc'
    ];

    for (const redundant of redundantPaths) {
      linkFixes[redundant] = ''; // Remove these references
    }

    return linkFixes;
  }

  /**
   * Phase 2: Update file paths
   */
  async updateFilePathsPhase(files) {
    console.log('📁 Updating file paths...');

    for (const file of files) {
      try {
        const pathIssues = file.issues.filter(i => 
          i.type === 'invalid_path' || i.type === 'missing_file'
        );

        if (pathIssues.length > 0) {
          await this.fixer.fixFilePaths(file.path, pathIssues);
          this.results.pathsUpdated++;
        }

      } catch (error) {
        console.error(`  ❌ Error updating paths in ${file.path}:`, error.message);
        this.results.errors.push({ file: file.path, error: error.message });
      }
    }
  }

  /**
   * Phase 3: Add missing sections
   */
  async addMissingSectionsPhase(files) {
    console.log('📋 Adding missing sections...');

    for (const file of files) {
      try {
        const structureIssues = file.issues.filter(i => i.type === 'missing_section');

        if (structureIssues.length > 0) {
          await this.fixer.fixMissingSections(file.path, structureIssues);
          this.results.sectionsAdded += structureIssues.length;
        }

      } catch (error) {
        console.error(`  ❌ Error adding sections to ${file.path}:`, error.message);
        this.results.errors.push({ file: file.path, error: error.message });
      }
    }
  }

  /**
   * Phase 4: Modernize content
   */
  async modernizeContentPhase(files) {
    console.log('🔄 Modernizing content...');

    const modernizationFiles = files.filter(f => f.modernizationNeeded);

    for (const file of modernizationFiles) {
      try {
        await this.fixer.modernizeContent(file.path);
        console.log(`  ✅ Modernized: ${file.path}`);

      } catch (error) {
        console.error(`  ❌ Error modernizing ${file.path}:`, error.message);
        this.results.errors.push({ file: file.path, error: error.message });
      }
    }
  }

  /**
   * Create backup of file before modification
   */
  async createBackup(filePath) {
    const fullPath = path.resolve(this.baseDir, filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../project-memory/backups');
    
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupFileName = `${path.basename(filePath, path.extname(filePath))}_${timestamp}${path.extname(filePath)}`;
    const backupPath = path.join(backupDir, backupFileName);
    
    try {
      await fs.copyFile(fullPath, backupPath);
    } catch (error) {
      console.warn(`  ⚠️ Could not create backup for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Escape string for regex
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('');
    console.log('📊 Automated Fix Results');
    console.log('━'.repeat(70));
    console.log(`📄 Files Processed: ${this.results.filesProcessed}`);
    console.log(`🔗 Links Fixed: ${this.results.linksFixed}`);
    console.log(`📁 Paths Updated: ${this.results.pathsUpdated}`);
    console.log(`📋 Sections Added: ${this.results.sectionsAdded}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('');
      console.log('❌ Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.file}: ${error.error}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '../project-memory/automated_fix_report.json');
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        success: this.results.errors.length === 0,
        completionRate: this.results.filesProcessed / (this.results.filesProcessed + this.results.errors.length) * 100
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log('');
    console.log(`📝 Detailed report saved: ${reportPath}`);

    // Rescan to show improvement
    console.log('');
    console.log('🔄 Rescanning to verify improvements...');
    await this.manager.scanAllFiles();
    const newReport = this.manager.getStatusReport();
    
    console.log('');
    console.log('📈 Improvement Summary:');
    console.log(`📁 Total Files: ${newReport.summary.totalFiles}`);
    console.log(`⚠️  Files Still Needing Update: ${newReport.summary.filesNeedingUpdate}`);
    console.log(`🔴 High Priority Issues: ${newReport.issues.high}`);
    
    const healthScore = Math.round(((newReport.summary.totalFiles - newReport.summary.filesNeedingUpdate) / newReport.summary.totalFiles) * 100);
    console.log(`🎯 New Health Score: ${healthScore}%`);
    
    console.log('');
    console.log('✅ Automated fixes completed!');
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new AutomatedCursorRulesFixer();
  fixer.runAutomatedFixes().catch(error => {
    console.error('💥 Automated fix error:', error.message);
    process.exit(1);
  });
}

module.exports = AutomatedCursorRulesFixer; 
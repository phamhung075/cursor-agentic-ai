#!/usr/bin/env node

/**
 * 🚚 Script Migration Tool
 * 
 * Migrates all scripts from ./scripts to agents/_store/scripts
 * Creates proper organization and management system for agent-created utilities
 */

const fs = require('fs').promises;
const path = require('path');

class ScriptMigrationManager {
  constructor() {
    this.sourceDir = 'scripts';
    this.targetDir = 'agents/_store/scripts';
    this.backupDir = `backups/scripts-migration-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    this.results = {
      migrated: [],
      skipped: [],
      errors: [],
      categories: {
        core: [], // Core framework management
        backup: [], // Backup and recovery
        analysis: [], // Analysis and reporting
        cleanup: [], // Cleanup and maintenance
        utility: [], // General utilities
        migration: [] // Migration tools
      }
    };
  }

  /**
   * Perform complete migration
   */
  async migrate() {
    console.log('🚚 SCRIPT MIGRATION TO STORE');
    console.log('━'.repeat(60));
    console.log(`📁 Source: ${this.sourceDir}`);
    console.log(`📁 Target: ${this.targetDir}`);
    console.log('');

    try {
      // Create backup
      await this.createBackup();
      
      // Get all scripts to migrate
      const scripts = await this.getScriptsToMigrate();
      
      // Migrate each script
      for (const script of scripts) {
        await this.migrateScript(script);
      }
      
      // Update package.json
      await this.updatePackageJson();
      
      // Create management documentation
      await this.createManagementDocs();
      
      // Generate final report
      await this.generateMigrationReport();
      
      return this.results;

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Create backup of current scripts
   */
  async createBackup() {
    console.log('📦 Creating backup...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Backup entire scripts directory
    await this.copyDirectory(this.sourceDir, path.join(this.backupDir, 'original-scripts'));
    
    // Also backup existing _store/scripts
    await this.copyDirectory(this.targetDir, path.join(this.backupDir, 'existing-store-scripts'));
    
    console.log(`✅ Backup created: ${this.backupDir}`);
    console.log('');
  }

  /**
   * Get all scripts that need migration
   */
  async getScriptsToMigrate() {
    const files = await fs.readdir(this.sourceDir);
    const scripts = [];
    
    for (const file of files) {
      const filePath = path.join(this.sourceDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && (
        file.endsWith('.js') || 
        file.endsWith('.py') || 
        file.endsWith('.sh') ||
        file.endsWith('.md')
      )) {
        scripts.push(file);
      }
    }
    
    return scripts.sort();
  }

  /**
   * Migrate a single script
   */
  async migrateScript(filename) {
    const sourcePath = path.join(this.sourceDir, filename);
    const targetPath = path.join(this.targetDir, filename);
    
    console.log(`🔄 Migrating: ${filename}`);
    
    try {
      // Check if target already exists
      try {
        await fs.access(targetPath);
        console.log(`  ⚠️ File already exists in target: ${filename}`);
        
        // Compare content to decide what to do
        const sourceContent = await fs.readFile(sourcePath, 'utf8');
        const targetContent = await fs.readFile(targetPath, 'utf8');
        
        if (sourceContent === targetContent) {
          console.log(`  ✅ Files identical, skipping: ${filename}`);
          this.results.skipped.push(filename);
          return;
        } else {
          // Create backup of existing file
          const backupName = `${filename}.existing-backup`;
          await fs.copyFile(targetPath, path.join(this.targetDir, backupName));
          console.log(`  📦 Backed up existing file as: ${backupName}`);
        }
      } catch (error) {
        // File doesn't exist in target, continue with migration
      }
      
      // Copy the file
      await fs.copyFile(sourcePath, targetPath);
      
      // Categorize the script
      const category = this.categorizeScript(filename);
      this.results.categories[category].push(filename);
      
      this.results.migrated.push(filename);
      console.log(`  ✅ Migrated to: ${targetPath}`);
      console.log(`  📂 Category: ${category}`);
      
    } catch (error) {
      console.error(`  ❌ Error migrating ${filename}: ${error.message}`);
      this.results.errors.push({ filename, error: error.message });
    }
  }

  /**
   * Categorize script based on filename and purpose
   */
  categorizeScript(filename) {
    const lower = filename.toLowerCase();
    
    if (lower.includes('core') || lower.includes('_core')) {
      return 'core';
    } else if (lower.includes('backup')) {
      return 'backup';
    } else if (lower.includes('analyze') || lower.includes('analysis')) {
      return 'analysis';
    } else if (lower.includes('clean') || lower.includes('cleanup')) {
      return 'cleanup';
    } else if (lower.includes('migrate') || lower.includes('migration')) {
      return 'migration';
    } else {
      return 'utility';
    }
  }

  /**
   * Update package.json to point to new script locations
   */
  async updatePackageJson() {
    console.log('📄 Updating package.json...');
    
    try {
      const packagePath = 'package.json';
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Update script paths that reference ./scripts
      const updatedScripts = {};
      for (const [key, value] of Object.entries(packageJson.scripts)) {
        if (typeof value === 'string' && value.includes('scripts/')) {
          // Replace scripts/ with agents/_store/scripts/
          updatedScripts[key] = value.replace(/scripts\//g, 'agents/_store/scripts/');
          console.log(`  🔄 Updated: ${key}`);
        } else {
          updatedScripts[key] = value;
        }
      }
      
      // Add new script management commands
      updatedScripts['AAI:scripts-migrate'] = 'node agents/_store/scripts/migrate_scripts_to_store.js';
      updatedScripts['AAI:scripts-list'] = 'node agents/_store/scripts/script_manager.js list';
      updatedScripts['AAI:scripts-help'] = 'node agents/_store/scripts/script_manager.js help';
      updatedScripts['AAI:scripts-organize'] = 'node agents/_store/scripts/script_manager.js organize';
      
      packageJson.scripts = updatedScripts;
      
      // Write updated package.json
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Package.json updated with new script paths`);
      
    } catch (error) {
      console.error(`❌ Error updating package.json: ${error.message}`);
    }
  }

  /**
   * Create management documentation
   */
  async createManagementDocs() {
    console.log('📚 Creating management documentation...');
    
    // Create script organization rules
    const rulesPath = 'agents/_store/projects/_core/rules/00__TOOLS/SCRIPT_ORGANIZATION_RULES.mdc';
    const rulesContent = this.generateOrganizationRules();
    
    await fs.mkdir(path.dirname(rulesPath), { recursive: true });
    await fs.writeFile(rulesPath, rulesContent);
    console.log(`✅ Created: ${rulesPath}`);
    
    // Create script index
    const indexPath = 'agents/_store/scripts/SCRIPTS_INDEX.md';
    const indexContent = this.generateScriptIndex();
    
    await fs.writeFile(indexPath, indexContent);
    console.log(`✅ Created: ${indexPath}`);
  }

  /**
   * Generate organization rules content
   */
  generateOrganizationRules() {
    return `# 🗂️ Script & Test Organization Rules

## 📋 IMPORTANT RULES FOR AI AGENTS

### 🎯 **MANDATORY STORAGE LOCATIONS**

All scripts and tests created by AI agents for improvement or management MUST be stored in:

\`\`\`
agents/_store/scripts/     - All utility scripts
agents/_store/tests/       - All test files
\`\`\`

### 📂 **CATEGORIZATION SYSTEM**

#### **agents/_store/scripts/** Categories:
- \`core/\` - Core framework management
- \`backup/\` - Backup and recovery utilities  
- \`analysis/\` - Analysis and reporting tools
- \`cleanup/\` - Cleanup and maintenance
- \`migration/\` - Migration and conversion tools
- \`utility/\` - General purpose utilities

#### **agents/_store/tests/** Categories:
- \`integration/\` - Integration tests
- \`unit/\` - Unit tests
- \`system/\` - System tests
- \`performance/\` - Performance tests

### 🛡️ **MANDATORY REQUIREMENTS**

#### **For All Scripts:**
1. ✅ **Header Documentation** - Purpose, usage, author
2. ✅ **Error Handling** - Proper try/catch and error reporting
3. ✅ **Backup Creation** - Before any destructive operations
4. ✅ **Progress Reporting** - Clear status updates during execution
5. ✅ **NPM Integration** - Register in package.json with AAI: prefix

#### **For All Tests:**
1. ✅ **Clear Test Names** - Descriptive and specific
2. ✅ **Setup/Teardown** - Proper test environment management
3. ✅ **Assertions** - Clear pass/fail criteria
4. ✅ **Documentation** - What is being tested and why

### 🚀 **NAMING CONVENTIONS**

#### **Scripts:**
- \`action_target_description.js\` - Example: \`analyze_core_paths.js\`
- \`backup_component_timestamp.sh\` - Example: \`backup_core_structure.sh\`
- \`fix_issue_type.py\` - Example: \`fix_broken_links.py\`

#### **Tests:**
- \`test_component_functionality.js\` - Example: \`test_agent_memory.js\`
- \`integration_test_scenario.js\` - Example: \`integration_test_autopilot.js\`

### 🔧 **INTEGRATION REQUIREMENTS**

All new scripts MUST be registered in \`package.json\`:

\`\`\`json
{
  "scripts": {
    "AAI:your-script": "node agents/_store/scripts/your_script.js"
  }
}
\`\`\`

### 📊 **TRACKING & MANAGEMENT**

Use the script manager for organization:

\`\`\`bash
npm run AAI:scripts-list        # List all scripts by category
npm run AAI:scripts-organize    # Organize scripts into categories  
npm run AAI:scripts-help        # Show available scripts and usage
\`\`\`

### 🛠️ **AGENT RESPONSIBILITIES**

When creating new utilities, AI agents MUST:

1. 🔍 **Check existing scripts** - Avoid duplication
2. 📂 **Use proper location** - \`agents/_store/scripts/\` or \`agents/_store/tests/\`
3. 🏷️ **Apply categorization** - Place in appropriate subdirectory
4. 📝 **Document thoroughly** - Purpose, usage, examples
5. 🔗 **Register in package.json** - For easy access
6. 🧪 **Create tests** - If applicable, add corresponding test files

---

**Status:** ✅ **ACTIVE RULES - ALL AGENTS MUST FOLLOW**  
**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;
  }

  /**
   * Generate script index content
   */
  generateScriptIndex() {
    const categories = this.results.categories;
    
    let content = `# 📚 Scripts Index

**Location:** \`agents/_store/scripts/\`  
**Generated:** ${new Date().toISOString()}

## 📂 Scripts by Category

`;

    for (const [category, scripts] of Object.entries(categories)) {
      if (scripts.length > 0) {
        content += `### 🏷️ ${category.toUpperCase()}\n\n`;
        scripts.forEach(script => {
          content += `- **${script}** - *[Add description]*\n`;
        });
        content += '\n';
      }
    }

    content += `## 🚀 Usage

### Run Scripts via NPM:
\`\`\`bash
npm run AAI:scripts-list     # List all available scripts
npm run AAI:scripts-help     # Show script commands and usage
\`\`\`

### Direct Execution:
\`\`\`bash
node agents/_store/scripts/[script-name]
\`\`\`

## 📋 Management Commands

| Command | Purpose |
|---------|---------|
| \`npm run AAI:scripts-list\` | List all scripts by category |
| \`npm run AAI:scripts-organize\` | Organize scripts into subdirectories |
| \`npm run AAI:scripts-help\` | Show available commands |

---

**Note:** This index is auto-generated. Update descriptions as needed.
`;

    return content;
  }

  /**
   * Generate migration report
   */
  async generateMigrationReport() {
    console.log('');
    console.log('📊 MIGRATION RESULTS');
    console.log('━'.repeat(60));
    console.log(`✅ Scripts Migrated: ${this.results.migrated.length}`);
    console.log(`⚪ Scripts Skipped: ${this.results.skipped.length}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    console.log('');

    if (this.results.migrated.length > 0) {
      console.log('✅ MIGRATED SCRIPTS:');
      this.results.migrated.forEach(script => {
        const category = Object.keys(this.results.categories).find(cat => 
          this.results.categories[cat].includes(script)
        );
        console.log(`  ✅ ${script} → ${category}`);
      });
      console.log('');
    }

    if (this.results.skipped.length > 0) {
      console.log('⚪ SKIPPED SCRIPTS:');
      this.results.skipped.forEach(script => {
        console.log(`  ⚪ ${script} (already exists)`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`  ❌ ${error.filename}: ${error.error}`);
      });
      console.log('');
    }

    // Save detailed report
    const reportPath = 'agents/_store/logs/script_migration_report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      backupLocation: this.backupDir,
      results: this.results
    }, null, 2));
    
    console.log(`📝 Migration report saved: ${reportPath}`);
    console.log(`💾 Backup location: ${this.backupDir}`);
    console.log('');
    console.log('🎯 Script migration completed!');
    
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Review migrated scripts in agents/_store/scripts/');
    console.log('2. Test updated npm scripts');
    console.log('3. Remove original ./scripts directory if satisfied');
    console.log('4. Use: npm run AAI:scripts-list to see all available scripts');
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

// Export for use as module
module.exports = ScriptMigrationManager;

// CLI execution
if (require.main === module) {
  const migrator = new ScriptMigrationManager();
  migrator.migrate().then(results => {
    console.log('\n🎉 Migration complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ ${results.migrated.length} scripts migrated`);
    console.log(`   ⚪ ${results.skipped.length} scripts skipped`);
    console.log(`   ❌ ${results.errors.length} errors`);
  }).catch(error => {
    console.error('💥 Migration error:', error.message);
    process.exit(1);
  });
} 
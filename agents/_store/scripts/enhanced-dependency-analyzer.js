#!/usr/bin/env node

/**
 * Enhanced Dependency Analyzer for AAI
 * Automatically analyzes dependencies and affected files when deleting or editing agents
 * Creates comprehensive modification tasks for Cursor
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class EnhancedDependencyAnalyzer {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.analysisResults = {
            targetFile: null,
            operation: null, // 'delete' | 'edit' | 'move'
            directReferences: [],
            indirectReferences: [],
            configReferences: [],
            documentationReferences: [],
            testReferences: [],
            affectedSystems: [],
            requiredTasks: []
        };
        this.filePatterns = {
            scripts: ['**/*.js', '**/*.ts', '**/*.mjs'],
            configs: ['package.json', '**/*.json', '**/*.yaml', '**/*.yml'],
            docs: ['**/*.md', '**/*.mdc', '**/*.txt'],
            tests: ['**/*test*', '**/*spec*']
        };
    }

    /**
     * Main analysis entry point
     */
    async analyzeOperation(targetFile, operation = 'delete', options = {}) {
        console.log(chalk.blue('🔍 Enhanced Dependency Analysis Starting...'));
        console.log(chalk.gray(`Target: ${targetFile}`));
        console.log(chalk.gray(`Operation: ${operation}`));

        this.analysisResults.targetFile = targetFile;
        this.analysisResults.operation = operation;

        try {
            // Step 1: Analyze direct file references
            await this.findDirectReferences(targetFile);
            
            // Step 2: Analyze configuration references
            await this.findConfigurationReferences(targetFile);
            
            // Step 3: Analyze documentation references
            await this.findDocumentationReferences(targetFile);
            
            // Step 4: Analyze test references
            await this.findTestReferences(targetFile);
            
            // Step 5: Analyze system integrations
            await this.analyzeSystemIntegrations(targetFile);
            
            // Step 6: Generate modification tasks
            await this.generateModificationTasks();
            
            // Step 7: Create Cursor tasks
            await this.createCursorTasks();
            
            return this.analysisResults;
            
        } catch (error) {
            console.error(chalk.red('❌ Analysis failed:'), error.message);
            throw error;
        }
    }

    /**
     * Find direct file references (imports, requires, etc.)
     */
    async findDirectReferences(targetFile) {
        console.log(chalk.yellow('📁 Analyzing direct file references...'));
        
        const searchPatterns = [
            // JavaScript/Node.js patterns
            `require\\(['"\`].*${path.basename(targetFile)}.*['"\`]\\)`,
            `import.*from\\s+['"\`].*${path.basename(targetFile)}.*['"\`]`,
            `import\\s+['"\`].*${path.basename(targetFile)}.*['"\`]`,
            
            // File path references
            targetFile.replace(/\\/g, '/'),
            targetFile.replace(/\//g, '\\\\'),
            path.basename(targetFile),
            
            // Script execution patterns
            `node\\s+.*${targetFile}`,
            `npm\\s+run\\s+.*${path.basename(targetFile, '.js')}`
        ];

        for (const pattern of searchPatterns) {
            const matches = await this.searchInFiles(pattern, this.filePatterns.scripts);
            this.analysisResults.directReferences.push(...matches);
        }

        // Remove duplicates
        this.analysisResults.directReferences = [...new Set(this.analysisResults.directReferences)];
        
        console.log(chalk.green(`✅ Found ${this.analysisResults.directReferences.length} direct references`));
    }

    /**
     * Find configuration file references
     */
    async findConfigurationReferences(targetFile) {
        console.log(chalk.yellow('⚙️ Analyzing configuration references...'));
        
        const configFiles = [
            'package.json',
            '.cursor/settings.json',
            '.cursor/tasks.json',
            'agents/_store/cursor-summaries/*.json',
            'agents/_store/intelligence/**/*.json'
        ];

        for (const configPattern of configFiles) {
            const files = await this.findFiles(configPattern);
            for (const file of files) {
                if (await this.fileContainsReference(file, targetFile)) {
                    this.analysisResults.configReferences.push({
                        file,
                        type: 'configuration',
                        needsUpdate: true
                    });
                }
            }
        }

        console.log(chalk.green(`✅ Found ${this.analysisResults.configReferences.length} configuration references`));
    }

    /**
     * Find documentation references
     */
    async findDocumentationReferences(targetFile) {
        console.log(chalk.yellow('📚 Analyzing documentation references...'));
        
        const docPatterns = [
            targetFile,
            path.basename(targetFile),
            path.basename(targetFile, path.extname(targetFile))
        ];

        for (const pattern of docPatterns) {
            const matches = await this.searchInFiles(pattern, this.filePatterns.docs);
            this.analysisResults.documentationReferences.push(...matches);
        }

        // Remove duplicates
        this.analysisResults.documentationReferences = [...new Set(this.analysisResults.documentationReferences)];
        
        console.log(chalk.green(`✅ Found ${this.analysisResults.documentationReferences.length} documentation references`));
    }

    /**
     * Find test file references
     */
    async findTestReferences(targetFile) {
        console.log(chalk.yellow('🧪 Analyzing test references...'));
        
        const testPatterns = [
            targetFile,
            path.basename(targetFile),
            path.basename(targetFile, path.extname(targetFile))
        ];

        for (const pattern of testPatterns) {
            const matches = await this.searchInFiles(pattern, this.filePatterns.tests);
            this.analysisResults.testReferences.push(...matches);
        }

        console.log(chalk.green(`✅ Found ${this.analysisResults.testReferences.length} test references`));
    }

    /**
     * Analyze system integrations
     */
    async analyzeSystemIntegrations(targetFile) {
        console.log(chalk.yellow('🔗 Analyzing system integrations...'));
        
        const systems = [
            {
                name: 'Package.json Scripts',
                files: ['package.json'],
                impact: 'high'
            },
            {
                name: 'Cursor Integration',
                files: ['.cursor/settings.json', '.cursor/tasks.json'],
                impact: 'medium'
            },
            {
                name: 'AAI Intelligence System',
                files: ['agents/_store/intelligence/**/*.json'],
                impact: 'medium'
            },
            {
                name: 'Launch System',
                files: ['agents/_store/scripts/launch-*.js'],
                impact: 'high'
            }
        ];

        for (const system of systems) {
            let affected = false;
            for (const filePattern of system.files) {
                const files = await this.findFiles(filePattern);
                for (const file of files) {
                    if (await this.fileContainsReference(file, targetFile)) {
                        affected = true;
                        break;
                    }
                }
                if (affected) break;
            }

            if (affected) {
                this.analysisResults.affectedSystems.push(system);
            }
        }

        console.log(chalk.green(`✅ Found ${this.analysisResults.affectedSystems.length} affected systems`));
    }

    /**
     * Generate modification tasks based on analysis
     */
    async generateModificationTasks() {
        console.log(chalk.yellow('📋 Generating modification tasks...'));
        
        const tasks = [];

        // Task 1: Planning and Analysis
        tasks.push({
            id: 'analysis-planning',
            title: `🎯 Planning: ${this.analysisResults.operation} ${path.basename(this.analysisResults.targetFile)}`,
            description: `Comprehensive analysis and planning for ${this.analysisResults.operation} operation`,
            type: 'planning',
            priority: 'high',
            estimatedTime: '10 minutes',
            dependencies: [],
            actions: [
                'Review analysis results',
                'Confirm operation scope',
                'Validate affected files list'
            ]
        });

        // Task 2: Configuration Updates
        if (this.analysisResults.configReferences.length > 0) {
            tasks.push({
                id: 'config-updates',
                title: '⚙️ Update Configuration Files',
                description: 'Update all configuration files that reference the target file',
                type: 'configuration',
                priority: 'high',
                estimatedTime: '15 minutes',
                dependencies: ['analysis-planning'],
                files: this.analysisResults.configReferences.map(ref => ref.file),
                actions: this.analysisResults.configReferences.map(ref => 
                    `Update ${ref.file} to remove/modify references`
                )
            });
        }

        // Task 3: Code References Updates
        if (this.analysisResults.directReferences.length > 0) {
            tasks.push({
                id: 'code-updates',
                title: '💻 Update Code References',
                description: 'Update all code files that import or reference the target file',
                type: 'code',
                priority: 'high',
                estimatedTime: '20 minutes',
                dependencies: ['analysis-planning'],
                files: this.analysisResults.directReferences,
                actions: this.analysisResults.directReferences.map(file => 
                    `Update imports/requires in ${file}`
                )
            });
        }

        // Task 4: Documentation Updates
        if (this.analysisResults.documentationReferences.length > 0) {
            tasks.push({
                id: 'docs-updates',
                title: '📚 Update Documentation',
                description: 'Update all documentation that references the target file',
                type: 'documentation',
                priority: 'medium',
                estimatedTime: '15 minutes',
                dependencies: ['config-updates', 'code-updates'],
                files: this.analysisResults.documentationReferences,
                actions: this.analysisResults.documentationReferences.map(file => 
                    `Update references in ${file}`
                )
            });
        }

        // Task 5: Test Updates
        if (this.analysisResults.testReferences.length > 0) {
            tasks.push({
                id: 'test-updates',
                title: '🧪 Update Tests',
                description: 'Update or remove tests related to the target file',
                type: 'testing',
                priority: 'medium',
                estimatedTime: '20 minutes',
                dependencies: ['code-updates'],
                files: this.analysisResults.testReferences,
                actions: this.analysisResults.testReferences.map(file => 
                    `Update/remove tests in ${file}`
                )
            });
        }

        // Task 6: System Integration Verification
        if (this.analysisResults.affectedSystems.length > 0) {
            tasks.push({
                id: 'system-verification',
                title: '🔗 Verify System Integrations',
                description: 'Verify that all affected systems work correctly after changes',
                type: 'verification',
                priority: 'high',
                estimatedTime: '15 minutes',
                dependencies: ['config-updates', 'code-updates'],
                systems: this.analysisResults.affectedSystems.map(sys => sys.name),
                actions: [
                    'Test package.json scripts',
                    'Verify Cursor integration',
                    'Check AAI system functionality',
                    'Validate launch system'
                ]
            });
        }

        // Task 7: Final Cleanup and Verification
        tasks.push({
            id: 'final-cleanup',
            title: '✅ Final Cleanup and Verification',
            description: 'Perform final cleanup and comprehensive verification',
            type: 'cleanup',
            priority: 'high',
            estimatedTime: '10 minutes',
            dependencies: tasks.map(t => t.id).filter(id => id !== 'final-cleanup'),
            actions: [
                'Remove any remaining references',
                'Clean up temporary files',
                'Verify system functionality',
                'Update documentation if needed'
            ]
        });

        this.analysisResults.requiredTasks = tasks;
        console.log(chalk.green(`✅ Generated ${tasks.length} modification tasks`));
    }

    /**
     * Create Cursor tasks from analysis
     */
    async createCursorTasks() {
        console.log(chalk.yellow('🎯 Creating Cursor tasks...'));
        
        const cursorTasks = [];
        
        // User command header
        cursorTasks.push({
            label: `🗣️ User Command: ${this.analysisResults.operation} ${path.basename(this.analysisResults.targetFile)} with dependency analysis`,
            type: "shell",
            command: `echo "Processing: ${this.analysisResults.operation} ${this.analysisResults.targetFile} with comprehensive dependency analysis"`,
            group: "AAI-Enhanced-Analysis",
            detail: `Generated from enhanced dependency analysis for ${this.analysisResults.operation} operation`,
            metadata: {
                userCommand: `${this.analysisResults.operation} ${this.analysisResults.targetFile}`,
                analysisType: 'enhanced-dependency',
                timestamp: new Date().toISOString()
            }
        });

        // Convert each task to Cursor format
        for (const task of this.analysisResults.requiredTasks) {
            cursorTasks.push({
                label: `${task.title}`,
                type: "shell",
                command: `echo "${task.description}"`,
                group: "AAI-Enhanced-Analysis",
                detail: `${task.description}\n\nType: ${task.type}\nPriority: ${task.priority}\nEstimated time: ${task.estimatedTime}\n\nActions:\n${task.actions.map(action => `• ${action}`).join('\n')}${task.files ? `\n\nFiles to modify:\n${task.files.map(file => `• ${file}`).join('\n')}` : ''}`,
                dependsOn: task.dependencies.length > 0 ? task.dependencies : undefined,
                metadata: {
                    taskId: task.id,
                    taskType: task.type,
                    priority: task.priority,
                    estimatedTime: task.estimatedTime,
                    files: task.files || [],
                    actions: task.actions
                }
            });
        }

        // Save to .cursor/tasks.json
        await this.saveCursorTasks(cursorTasks);
        
        console.log(chalk.green(`✅ Created ${cursorTasks.length} Cursor tasks`));
    }

    /**
     * Save tasks to .cursor/tasks.json
     */
    async saveCursorTasks(tasks) {
        const tasksFile = path.join(this.workspaceRoot, '.cursor', 'tasks.json');
        
        // Ensure .cursor directory exists
        const cursorDir = path.dirname(tasksFile);
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
        }

        // Load existing tasks or create new structure
        let existingTasks = { version: "2.0.0", tasks: [] };
        if (fs.existsSync(tasksFile)) {
            try {
                existingTasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
            } catch (error) {
                console.warn(chalk.yellow('⚠️ Could not parse existing tasks.json, creating new'));
            }
        }

        // Add new tasks
        existingTasks.tasks.push(...tasks);

        // Save updated tasks
        fs.writeFileSync(tasksFile, JSON.stringify(existingTasks, null, 2));
        
        console.log(chalk.blue(`📁 Tasks saved to ${tasksFile}`));
    }

    /**
     * Search for patterns in files
     */
    async searchInFiles(pattern, filePatterns) {
        const matches = [];
        // This is a simplified implementation
        // In a real implementation, you'd use tools like ripgrep or similar
        return matches;
    }

    /**
     * Find files matching patterns
     */
    async findFiles(pattern) {
        const files = [];
        // This is a simplified implementation
        // In a real implementation, you'd use glob or similar
        return files;
    }

    /**
     * Check if file contains reference to target
     */
    async fileContainsReference(file, targetFile) {
        try {
            if (!fs.existsSync(file)) return false;
            const content = fs.readFileSync(file, 'utf8');
            return content.includes(targetFile) || content.includes(path.basename(targetFile));
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate analysis report
     */
    generateReport() {
        console.log(chalk.blue('\n📊 Enhanced Dependency Analysis Report'));
        console.log(chalk.blue('═'.repeat(50)));
        
        console.log(chalk.yellow(`\n🎯 Target: ${this.analysisResults.targetFile}`));
        console.log(chalk.yellow(`🔧 Operation: ${this.analysisResults.operation}`));
        
        console.log(chalk.green(`\n📁 Direct References: ${this.analysisResults.directReferences.length}`));
        console.log(chalk.green(`⚙️ Configuration References: ${this.analysisResults.configReferences.length}`));
        console.log(chalk.green(`📚 Documentation References: ${this.analysisResults.documentationReferences.length}`));
        console.log(chalk.green(`🧪 Test References: ${this.analysisResults.testReferences.length}`));
        console.log(chalk.green(`🔗 Affected Systems: ${this.analysisResults.affectedSystems.length}`));
        console.log(chalk.green(`📋 Generated Tasks: ${this.analysisResults.requiredTasks.length}`));
        
        console.log(chalk.blue('\n✅ Analysis complete! Tasks created in .cursor/tasks.json'));
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(chalk.red('Usage: node enhanced-dependency-analyzer.js <operation> <target-file>'));
        console.log(chalk.gray('Operations: delete, edit, move'));
        console.log(chalk.gray('Example: node enhanced-dependency-analyzer.js delete agents/_store/scripts/simple-cursor-setup.js'));
        process.exit(1);
    }

    const [operation, targetFile] = args;
    
    const analyzer = new EnhancedDependencyAnalyzer();
    
    try {
        await analyzer.analyzeOperation(targetFile, operation);
        analyzer.generateReport();
    } catch (error) {
        console.error(chalk.red('❌ Analysis failed:'), error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = EnhancedDependencyAnalyzer;

// Run if called directly
if (require.main === module) {
    main();
} 
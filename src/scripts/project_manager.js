#!/usr/bin/env node
/**
 * Project Manager for src/ sub-git projects
 * Manages multiple git repositories within the src/projects directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectManager {
    constructor() {
        this.srcDir = path.join(__dirname, '..');
        this.projectsDir = path.join(this.srcDir, 'projects');
        this.docsDir = path.join(this.srcDir, 'docs');
        this.configDir = path.join(this.srcDir, 'config');
    }

    // List all projects
    listProjects() {
        console.log('📁 Sub-Git Projects:');
        console.log('===================');
        
        if (!fs.existsSync(this.projectsDir)) {
            console.log('No projects directory found.');
            return;
        }

        const projects = fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        if (projects.length === 0) {
            console.log('No projects found.');
            return;
        }

        projects.forEach(project => {
            const projectPath = path.join(this.projectsDir, project);
            const isGitRepo = fs.existsSync(path.join(projectPath, '.git'));
            const hasReadme = fs.existsSync(path.join(projectPath, 'README.md'));
            
            console.log(`\n📂 ${project}`);
            console.log(`   Git Repository: ${isGitRepo ? '✅' : '❌'}`);
            console.log(`   Documentation: ${hasReadme ? '✅' : '❌'}`);
            
            if (isGitRepo) {
                try {
                    const status = execSync('git status --porcelain', { 
                        cwd: projectPath, 
                        encoding: 'utf8' 
                    });
                    console.log(`   Status: ${status.trim() ? '🔄 Modified' : '✅ Clean'}`);
                } catch (error) {
                    console.log(`   Status: ❌ Error`);
                }
            }
        });
    }

    // Add a new project
    addProject(repoUrl, projectName) {
        if (!repoUrl || !projectName) {
            console.log('❌ Usage: npm run src:add-project <repo-url> <project-name>');
            return;
        }

        console.log(`📥 Adding project: ${projectName}`);
        
        try {
            // Ensure projects directory exists
            if (!fs.existsSync(this.projectsDir)) {
                fs.mkdirSync(this.projectsDir, { recursive: true });
            }

            const projectPath = path.join(this.projectsDir, projectName);
            
            if (fs.existsSync(projectPath)) {
                console.log(`❌ Project ${projectName} already exists!`);
                return;
            }

            // Clone the repository
            execSync(`git clone ${repoUrl} ${projectName}`, { 
                cwd: this.projectsDir,
                stdio: 'inherit'
            });

            console.log(`✅ Project ${projectName} added successfully!`);
            
            // Update documentation
            this.updateProjectDocs();
            
        } catch (error) {
            console.log(`❌ Error adding project: ${error.message}`);
        }
    }

    // Update all projects
    updateProjects() {
        console.log('🔄 Updating all projects...');
        
        const projects = fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        projects.forEach(project => {
            const projectPath = path.join(this.projectsDir, project);
            
            if (fs.existsSync(path.join(projectPath, '.git'))) {
                console.log(`\n🔄 Updating ${project}...`);
                try {
                    execSync('git pull', { 
                        cwd: projectPath,
                        stdio: 'inherit'
                    });
                    console.log(`✅ ${project} updated successfully`);
                } catch (error) {
                    console.log(`❌ Error updating ${project}: ${error.message}`);
                }
            }
        });
    }

    // Generate project documentation
    updateProjectDocs() {
        const projects = fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const docsContent = [
            '# Sub-Git Projects Documentation',
            '',
            'This document lists all sub-git projects in the src/projects directory.',
            '',
            '## Projects',
            ''
        ];

        projects.forEach(project => {
            const projectPath = path.join(this.projectsDir, project);
            const readmePath = path.join(projectPath, 'README.md');
            
            docsContent.push(`### ${project}`);
            docsContent.push(`- **Location**: \`src/projects/${project}\``);
            docsContent.push(`- **Git Repository**: ${fs.existsSync(path.join(projectPath, '.git')) ? 'Yes' : 'No'}`);
            docsContent.push(`- **Documentation**: ${fs.existsSync(readmePath) ? 'Yes' : 'No'}`);
            
            if (fs.existsSync(readmePath)) {
                try {
                    const readme = fs.readFileSync(readmePath, 'utf8');
                    const firstLine = readme.split('\n')[0].replace(/^#\s*/, '');
                    if (firstLine) {
                        docsContent.push(`- **Description**: ${firstLine}`);
                    }
                } catch (error) {
                    // Ignore errors reading README
                }
            }
            
            docsContent.push('');
        });

        docsContent.push('---');
        docsContent.push(`*Last updated: ${new Date().toISOString()}*`);

        // Ensure docs directory exists
        if (!fs.existsSync(this.docsDir)) {
            fs.mkdirSync(this.docsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(this.docsDir, 'projects_overview.md'),
            docsContent.join('\n')
        );

        console.log('📝 Project documentation updated');
    }

    // Build all projects
    buildProjects() {
        console.log('🔨 Building all projects...');
        
        const projects = fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        projects.forEach(project => {
            const projectPath = path.join(this.projectsDir, project);
            const packageJsonPath = path.join(projectPath, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
                console.log(`\n🔨 Building ${project}...`);
                try {
                    // Install dependencies
                    execSync('npm install', { 
                        cwd: projectPath,
                        stdio: 'inherit'
                    });
                    
                    // Run build if script exists
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    if (packageJson.scripts && packageJson.scripts.build) {
                        execSync('npm run build', { 
                            cwd: projectPath,
                            stdio: 'inherit'
                        });
                    }
                    
                    console.log(`✅ ${project} built successfully`);
                } catch (error) {
                    console.log(`❌ Error building ${project}: ${error.message}`);
                }
            }
        });
    }

    // Show help
    showHelp() {
        console.log(`
📖 Project Manager Help
=======================

Available commands:
  list        - List all sub-git projects
  add         - Add a new project: add <repo-url> <project-name>
  update      - Update all projects (git pull)
  build       - Build all projects (npm install + npm run build)
  docs        - Update project documentation
  help        - Show this help

Usage:
  node src/scripts/project_manager.js <command> [args]
  
Or via npm:
  npm run src:list
  npm run src:add-project <repo-url> <project-name>
  npm run src:update
  npm run src:build
  npm run src:docs
        `);
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new ProjectManager();
    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch (command) {
        case 'list':
            manager.listProjects();
            break;
        case 'add':
            manager.addProject(args[0], args[1]);
            break;
        case 'update':
            manager.updateProjects();
            break;
        case 'build':
            manager.buildProjects();
            break;
        case 'docs':
            manager.updateProjectDocs();
            break;
        case 'help':
        default:
            manager.showHelp();
            break;
    }
}

module.exports = ProjectManager; 
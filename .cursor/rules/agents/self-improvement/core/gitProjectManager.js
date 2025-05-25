/**
 * 🔗 Git Project Manager - Handles sub-git projects
 * 
 * Manages multiple sub-git projects for isolated development contexts
 * Each project has its own memory, synced with individual git repositories
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

const execAsync = promisify(exec);

class GitProjectManager {
  constructor(config, memoryManager) {
    this.config = config;
    this.memoryManager = memoryManager;
    this.projectsConfigFile = path.join(__dirname, '../../_store/projects.json');
    this.projectsDir = path.join(__dirname, '../../_store/projects');
    this.currentProject = null;
    this.projects = new Map();
  }

  /**
   * Initialize the Git Project Manager
   */
  async initialize() {
    console.log('🔗 Initializing Git Project Manager...');
    
    // Ensure projects directory exists
    await fs.mkdir(this.projectsDir, { recursive: true });
    
    // Load existing projects
    await this.loadProjects();
    
    console.log(`📁 Loaded ${this.projects.size} sub-git projects`);
  }

  /**
   * Load projects from configuration file
   */
  async loadProjects() {
    try {
      const configData = await fs.readFile(this.projectsConfigFile, 'utf8');
      const projectsConfig = JSON.parse(configData);
      
      for (const project of projectsConfig.projects) {
        this.projects.set(project.name, {
          ...project,
          status: 'loaded'
        });
      }
    } catch (error) {
      // Configuration file doesn't exist yet, start with empty projects
      console.log('📝 Creating new projects configuration');
      await this.saveProjects();
    }
  }

  /**
   * Save projects to configuration file
   */
  async saveProjects() {
    const projectsConfig = {
      version: '1.0.0',
      lastModified: Date.now(),
      projects: Array.from(this.projects.values())
    };
    
    await fs.writeFile(this.projectsConfigFile, JSON.stringify(projectsConfig, null, 2));
  }

  /**
   * Add a new sub-git project
   */
  async addProject(name, gitUrl, options = {}) {
    console.log(chalk.blue(`📦 Adding sub-git project: ${name}`));
    
    if (this.projects.has(name)) {
      throw new Error(`Project '${name}' already exists`);
    }

    const projectDir = path.join(this.projectsDir, name);
    
    try {
      // Clone the repository
      console.log(chalk.gray(`🔄 Cloning from: ${gitUrl}`));
      
      if (options.branch) {
        await execAsync(`git clone -b ${options.branch} ${gitUrl} ${projectDir}`);
      } else {
        await execAsync(`git clone ${gitUrl} ${projectDir}`);
      }
      
      // Verify it's a git repository
      const gitDir = path.join(projectDir, '.git');
      await fs.access(gitDir);
      
      // Get repository information
      const repoInfo = await this.getRepositoryInfo(projectDir);
      
      // Create project configuration
      const project = {
        name,
        gitUrl,
        localPath: projectDir,
        branch: options.branch || 'main',
        description: options.description || `Sub-git project: ${name}`,
        addedDate: Date.now(),
        lastSync: null,
        status: 'active',
        repoInfo
      };
      
      // Add to projects map
      this.projects.set(name, project);
      
      // Save configuration
      await this.saveProjects();
      
      // Initialize project memory
      await this.memoryManager.ensureProjectDirectories(name);
      
      console.log(chalk.green(`✅ Added project: ${name}`));
      console.log(chalk.gray(`📁 Local path: ${projectDir}`));
      
      return project;
      
    } catch (error) {
      // Clean up on failure
      try {
        await fs.rm(projectDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Failed to add project '${name}': ${error.message}`);
    }
  }

  /**
   * Remove a sub-git project
   */
  async removeProject(name, options = {}) {
    console.log(chalk.yellow(`🗑️ Removing sub-git project: ${name}`));
    
    if (!this.projects.has(name)) {
      throw new Error(`Project '${name}' not found`);
    }

    const project = this.projects.get(name);
    
    try {
      // Check for uncommitted changes unless forced
      if (!options.force) {
        const hasChanges = await this.hasUncommittedChanges(project.localPath);
        if (hasChanges) {
          throw new Error(`Project '${name}' has uncommitted changes. Use --force to override.`);
        }
      }
      
      // Remove local repository
      if (options.removeFiles !== false) {
        console.log(chalk.gray(`📁 Removing local files: ${project.localPath}`));
        await fs.rm(project.localPath, { recursive: true, force: true });
      }
      
      // Clean project memory if requested
      if (options.cleanMemory) {
        console.log(chalk.gray(`🧹 Cleaning project memory`));
        await this.memoryManager.cleanProjectMemory(name);
      }
      
      // Remove from projects map
      this.projects.delete(name);
      
      // Save configuration
      await this.saveProjects();
      
      // If this was the current project, clear it
      if (this.currentProject === name) {
        this.currentProject = null;
        this.memoryManager.setCurrentProject(null);
      }
      
      console.log(chalk.green(`✅ Removed project: ${name}`));
      
      return { success: true, name };
      
    } catch (error) {
      throw new Error(`Failed to remove project '${name}': ${error.message}`);
    }
  }

  /**
   * Switch to working with a different project
   */
  async switchProject(name) {
    console.log(chalk.blue(`🔄 Switching to project: ${name}`));
    
    if (!this.projects.has(name)) {
      throw new Error(`Project '${name}' not found`);
    }

    const project = this.projects.get(name);
    
    // Verify project directory still exists
    try {
      await fs.access(project.localPath);
    } catch (error) {
      throw new Error(`Project directory not found: ${project.localPath}. Project may have been moved or deleted.`);
    }

    // Set as current project
    this.currentProject = name;
    this.memoryManager.setCurrentProject(name);
    
    // Update project status
    project.lastAccess = Date.now();
    await this.saveProjects();
    
    console.log(chalk.green(`✅ Switched to project: ${name}`));
    console.log(chalk.gray(`📁 Working directory: ${project.localPath}`));
    
    return project;
  }

  /**
   * List all sub-git projects
   */
  listProjects() {
    const projectList = Array.from(this.projects.values()).map(project => ({
      ...project,
      isCurrent: project.name === this.currentProject
    }));
    
    return projectList.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get current project information
   */
  getCurrentProject() {
    if (!this.currentProject) {
      return null;
    }
    
    return this.projects.get(this.currentProject);
  }

  /**
   * Sync project memory with its git repository
   */
  async syncProjectMemory(projectName = null) {
    const targetProject = projectName || this.currentProject;
    
    if (!targetProject) {
      throw new Error('No project specified for memory sync');
    }

    if (!this.projects.has(targetProject)) {
      throw new Error(`Project '${targetProject}' not found`);
    }

    const project = this.projects.get(targetProject);
    
    console.log(chalk.blue(`🔄 Syncing memory for project: ${targetProject}`));
    
    try {
      // Get memory statistics
      const memoryStats = await this.memoryManager.getProjectMemoryStats(targetProject);
      
      if (memoryStats.localMemories === 0) {
        console.log(chalk.yellow('⚠️ No project memory to sync'));
        return { success: true, message: 'No memory to sync', memoryCount: 0 };
      }
      
      // Create memory summary file for git tracking
      const memorySummary = {
        projectName: targetProject,
        memoryCount: memoryStats.localMemories,
        memoryTypes: memoryStats.types,
        lastSync: Date.now(),
        syncNote: 'Project memory synchronized with git repository'
      };
      
      const summaryPath = path.join(project.localPath, '.agent-memory-sync.json');
      await fs.writeFile(summaryPath, JSON.stringify(memorySummary, null, 2));
      
      // Update project sync status
      project.lastSync = Date.now();
      await this.saveProjects();
      
      console.log(chalk.green(`✅ Project memory synced: ${memoryStats.localMemories} entries`));
      console.log(chalk.gray(`📄 Memory summary: ${summaryPath}`));
      
      return {
        success: true,
        memoryCount: memoryStats.localMemories,
        summaryFile: summaryPath,
        project: project.name
      };
      
    } catch (error) {
      throw new Error(`Failed to sync project memory: ${error.message}`);
    }
  }

  /**
   * Clean project memory (for switching to another project)
   */
  async cleanProjectForSwitch(projectName) {
    console.log(chalk.yellow(`🧹 Cleaning project memory for switch: ${projectName}`));
    
    if (!this.projects.has(projectName)) {
      throw new Error(`Project '${projectName}' not found`);
    }

    try {
      // Sync memory before cleaning
      await this.syncProjectMemory(projectName);
      
      // Clean project-specific memory
      const cleanResult = await this.memoryManager.cleanProjectMemory(projectName);
      
      if (cleanResult) {
        console.log(chalk.green(`✅ Cleaned project memory: ${projectName}`));
        return { success: true, project: projectName };
      } else {
        console.log(chalk.yellow(`⚠️ Project memory was already clean: ${projectName}`));
        return { success: true, project: projectName, alreadyClean: true };
      }
      
    } catch (error) {
      throw new Error(`Failed to clean project memory: ${error.message}`);
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(projectDir) {
    try {
      const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: projectDir });
      const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: projectDir });
      const { stdout: lastCommit } = await execAsync('git log -1 --format="%H %s"', { cwd: projectDir });
      
      return {
        remoteUrl: remoteUrl.trim(),
        currentBranch: currentBranch.trim(),
        lastCommit: lastCommit.trim()
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Check if project has uncommitted changes
   */
  async hasUncommittedChanges(projectDir) {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: projectDir });
      return stdout.trim().length > 0;
    } catch (error) {
      return false; // Assume no changes if git command fails
    }
  }

  /**
   * Get project status information
   */
  async getProjectStatus(projectName = null) {
    const targetProject = projectName || this.currentProject;
    
    if (!targetProject) {
      throw new Error('No project specified');
    }

    if (!this.projects.has(targetProject)) {
      throw new Error(`Project '${targetProject}' not found`);
    }

    const project = this.projects.get(targetProject);
    
    try {
      const repoInfo = await this.getRepositoryInfo(project.localPath);
      const hasChanges = await this.hasUncommittedChanges(project.localPath);
      const memoryStats = await this.memoryManager.getProjectMemoryStats(targetProject);
      
      return {
        ...project,
        repoInfo,
        hasUncommittedChanges: hasChanges,
        memoryStats,
        isCurrent: targetProject === this.currentProject
      };
      
    } catch (error) {
      return {
        ...project,
        error: error.message
      };
    }
  }

  /**
   * Update project information
   */
  async updateProject(name, updates) {
    if (!this.projects.has(name)) {
      throw new Error(`Project '${name}' not found`);
    }

    const project = this.projects.get(name);
    
    // Update allowed fields
    const allowedUpdates = ['description', 'branch', 'status'];
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    }
    
    project.lastModified = Date.now();
    
    await this.saveProjects();
    
    return project;
  }

  /**
   * Get statistics about all projects
   */
  async getProjectsStats() {
    const stats = {
      totalProjects: this.projects.size,
      currentProject: this.currentProject,
      activeProjects: 0,
      totalMemoryEntries: 0,
      projectDetails: []
    };
    
    for (const [name, project] of this.projects) {
      if (project.status === 'active') {
        stats.activeProjects++;
      }
      
      try {
        const memoryStats = await this.memoryManager.getProjectMemoryStats(name);
        stats.totalMemoryEntries += memoryStats.localMemories || 0;
        
        stats.projectDetails.push({
          name,
          status: project.status,
          memoryCount: memoryStats.localMemories || 0,
          lastSync: project.lastSync,
          isCurrent: name === this.currentProject
        });
      } catch (error) {
        stats.projectDetails.push({
          name,
          status: project.status,
          error: error.message
        });
      }
    }
    
    return stats;
  }
}

module.exports = GitProjectManager; 
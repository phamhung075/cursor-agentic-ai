/**
 * 📁 File Manager - Agent working file management
 * 
 * Manages file paths and storage for agent working files separate from user project code
 */

const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor() {
    this.storeRoot = path.join(__dirname, '../../_store');
    this.projectsRoot = path.join(this.storeRoot, 'projects');
    this.currentProject = null;
  }

  /**
   * Initialize file manager and create necessary directories
   */
  async initialize() {
    await this.ensureDirectories();
  }

  /**
   * Ensure all necessary directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.storeRoot,
      this.projectsRoot,
      path.join(this.storeRoot, 'memory'),
      path.join(this.storeRoot, 'templates'),
      path.join(this.storeRoot, 'logs')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Set current project for file operations
   */
  setProject(projectName) {
    if (!projectName || typeof projectName !== 'string') {
      throw new Error('Project name must be a non-empty string');
    }
    
    // Sanitize project name for file system
    this.currentProject = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return this.currentProject;
  }

  /**
   * Get current project directory
   */
  getProjectDir(projectName = null) {
    const project = projectName || this.currentProject;
    if (!project) {
      throw new Error('No project set. Use setProject() first.');
    }
    return path.join(this.projectsRoot, project);
  }

  /**
   * Ensure project directory exists
   */
  async ensureProjectDir(projectName = null) {
    const projectDir = this.getProjectDir(projectName);
    await fs.mkdir(projectDir, { recursive: true });
    return projectDir;
  }

  /**
   * Get file path for agent working files
   */
  getFilePath(fileName, projectName = null) {
    const projectDir = this.getProjectDir(projectName);
    return path.join(projectDir, fileName);
  }

  /**
   * Write agent working file
   */
  async writeFile(fileName, content, projectName = null) {
    await this.ensureProjectDir(projectName);
    const filePath = this.getFilePath(fileName, projectName);
    
    // Ensure content is string
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    console.log(`📁 Saved: ${fileName} -> ${filePath}`);
    return filePath;
  }

  /**
   * Read agent working file
   */
  async readFile(fileName, projectName = null) {
    const filePath = this.getFilePath(fileName, projectName);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Try to parse as JSON, return as string if not JSON
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${fileName}`);
      }
      throw error;
    }
  }

  /**
   * Check if agent working file exists
   */
  async fileExists(fileName, projectName = null) {
    const filePath = this.getFilePath(fileName, projectName);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all files in project directory
   */
  async listProjectFiles(projectName = null) {
    const projectDir = this.getProjectDir(projectName);
    
    try {
      const files = await fs.readdir(projectDir);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get all projects
   */
  async listProjects() {
    try {
      const projects = await fs.readdir(this.projectsRoot);
      return projects.filter(project => !project.startsWith('.'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Delete project directory
   */
  async deleteProject(projectName) {
    const projectDir = this.getProjectDir(projectName);
    await fs.rmdir(projectDir, { recursive: true });
    console.log(`🗑️ Deleted project: ${projectName}`);
  }

  /**
   * Get project stats
   */
  async getProjectStats(projectName = null) {
    const projectDir = this.getProjectDir(projectName);
    const files = await this.listProjectFiles(projectName);
    
    const stats = {
      projectName: projectName || this.currentProject,
      projectDir,
      fileCount: files.length,
      files: []
    };

    for (const file of files) {
      try {
        const filePath = path.join(projectDir, file);
        const fileStat = await fs.stat(filePath);
        stats.files.push({
          name: file,
          size: fileStat.size,
          modified: fileStat.mtime,
          type: file.endsWith('.json') ? 'json' : file.endsWith('.mdc') ? 'markdown' : 'text'
        });
      } catch (error) {
        // Skip files that can't be accessed
      }
    }

    return stats;
  }

  /**
   * Migrate existing files to agent store
   */
  async migrateExistingFiles(projectName, filesToMigrate = []) {
    await this.ensureProjectDir(projectName);
    const migrated = [];
    const errors = [];

    const defaultFiles = [
      'idea_document.mdc',
      'market_research.mdc', 
      'core_concept.mdc',
      'project_prd.mdc',
      'tasks.json',
      'project_session_state.json'
    ];

    const files = filesToMigrate.length > 0 ? filesToMigrate : defaultFiles;

    for (const fileName of files) {
      try {
        // Check various possible locations
        const possiblePaths = [
          fileName, // Root directory
          path.join('.cursor/rules/projet', fileName),
          path.join('.cursor/rules/tasks', fileName),
          path.join('.cursor/rules', fileName)
        ];

        let sourceFound = false;
        for (const sourcePath of possiblePaths) {
          try {
            const content = await fs.readFile(sourcePath, 'utf8');
            await this.writeFile(fileName, content, projectName);
            
            // Remove original file after successful migration
            await fs.unlink(sourcePath);
            
            migrated.push({
              fileName,
              from: sourcePath,
              to: this.getFilePath(fileName, projectName)
            });
            sourceFound = true;
            break;
          } catch {
            // Try next path
          }
        }

        if (!sourceFound) {
          console.log(`⚠️ File not found for migration: ${fileName}`);
        }
      } catch (error) {
        errors.push({
          fileName,
          error: error.message
        });
      }
    }

    return { migrated, errors };
  }

  /**
   * Get agent store overview
   */
  async getStoreOverview() {
    const projects = await this.listProjects();
    const overview = {
      storeRoot: this.storeRoot,
      projectCount: projects.length,
      projects: []
    };

    for (const project of projects) {
      try {
        const stats = await this.getProjectStats(project);
        overview.projects.push(stats);
      } catch (error) {
        // Skip projects that can't be accessed
      }
    }

    return overview;
  }

  /**
   * Standard file name mappings for AutoPilot workflow
   */
  getStandardFileName(phase) {
    const fileMap = {
      'idea': 'idea_document.mdc',
      'market-research': 'market_research.mdc',
      'core-concept': 'core_concept.mdc',
      'prd': 'project_prd.mdc',
      'tasks': 'tasks.json',
      'session': 'session_state.json',
      'readme': 'README.mdc'
    };

    return fileMap[phase] || `${phase}.mdc`;
  }

  /**
   * Get file path for workflow phase
   */
  getWorkflowFilePath(phase, projectName = null) {
    const fileName = this.getStandardFileName(phase);
    return this.getFilePath(fileName, projectName);
  }

  /**
   * Get core framework path
   */
  getCoreFrameworkPath() {
    return path.resolve('agents/_store/projects/_core');
  }

  /**
   * Access core workflow files
   */
  getCoreWorkflowFiles() {
    const workflowPath = path.join(this.getCoreFrameworkPath(), 'rules/01__AI-RUN');
    return this.listFiles(workflowPath, '.mdc');
  }

  /**
   * Access core templates
   */
  getCoreTemplates() {
    const templatesPath = path.join(this.getCoreFrameworkPath(), 'rules/02__AI-DOCS');
    return this.listFiles(templatesPath, '.mdc');
  }

  /**
   * Access core specifications
   */
  getCoreSpecs() {
    const specsPath = path.join(this.getCoreFrameworkPath(), 'rules/03__SPECS');
    return this.listFiles(specsPath, '.mdc');
  }

  /**
   * List files in directory with extension filter
   */
  async listFiles(directory, extension) {
    try {
      const files = await fs.readdir(directory);
      return files
        .filter(file => file.endsWith(extension))
        .map(file => path.join(directory, file));
    } catch (error) {
      return [];
    }
  }

}

module.exports = FileManager;
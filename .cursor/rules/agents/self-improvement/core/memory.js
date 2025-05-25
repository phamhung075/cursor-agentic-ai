/**
 * 🧠 Memory Manager - Dual memory system for agent and projects
 * 
 * Agent Memory: Global learning, synced with git, improves agent performance
 * Project Memory: Per sub-git project, isolated, project-specific context
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MemoryManager {
  constructor(config) {
    this.config = config;
    this.pinecone = null;
    this.index = null;
    this.openai = null;
    this.isInitialized = false;
    this.localCache = new Map();
    
    // Dual memory paths
    this.agentMemoryStore = path.join(__dirname, '../../_store/agent-memory'); // Version controlled
    this.projectMemoryStore = path.join(__dirname, '../../_store/project-memory'); // Per project
    this.currentProject = null;
  }

  /**
   * Initialize Pinecone and OpenAI connections
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Dual Memory Manager...');
      
      // Initialize Pinecone (if API key provided)
      if (process.env.PINECONE_API_KEY) {
        console.log('🔑 Pinecone API key found');
        this.pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY
        });
        
        // Get index name from environment variable or config
        const indexName = process.env.PINECONE_INDEX_NAME || this.config.memory?.indexName || 'agentic-framework-memory';
        
        try {
          console.log(`🔗 Connecting to Pinecone index: ${indexName}`);
          this.index = this.pinecone.index(indexName);
          
          // Test the connection with a simple stats call
          await this.index.describeIndexStats();
          console.log('✅ Connected to Pinecone index:', indexName);
        } catch (error) {
          console.log('⚠️ Pinecone index connection failed:', error.message);
          console.log('💡 Using local memory only');
          this.index = null;
        }
      } else {
        console.log('⚠️ PINECONE_API_KEY not found in environment variables');
      }

      // Initialize OpenAI for embeddings (if API key provided)
      if (process.env.OPENAI_API_KEY) {
        console.log('🔑 OpenAI API key found');
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ Connected to OpenAI for embeddings');
      } else {
        console.log('⚠️ OPENAI_API_KEY not found in environment variables');
      }

      // Ensure memory directories exist
      await this.ensureDirectories();
      
      this.isInitialized = true;
      console.log('🧠 Dual MemoryManager initialized');
      
    } catch (error) {
      console.warn('⚠️ MemoryManager initialization error:', error.message);
      console.log('💡 Using local memory only');
      this.isInitialized = true;
    }
  }

  /**
   * Ensure memory directories exist for both agent and project memory
   */
  async ensureDirectories() {
    // Agent memory directories (version controlled)
    const agentDirs = ['learning', 'patterns', 'performance', 'improvements'];
    for (const dir of agentDirs) {
      await fs.mkdir(path.join(this.agentMemoryStore, dir), { recursive: true });
    }

    // Project memory base directory
    await fs.mkdir(this.projectMemoryStore, { recursive: true });
  }

  /**
   * Set current project for project-specific memory
   */
  setCurrentProject(projectName) {
    this.currentProject = projectName;
    console.log(`📁 Memory context set to project: ${projectName}`);
  }

  /**
   * Get current project memory directory
   */
  getCurrentProjectMemoryDir() {
    if (!this.currentProject) {
      throw new Error('No current project set. Use setCurrentProject() first.');
    }
    return path.join(this.projectMemoryStore, this.currentProject);
  }

  /**
   * Ensure project memory directories exist
   */
  async ensureProjectDirectories(projectName) {
    const projectDir = path.join(this.projectMemoryStore, projectName);
    const projectDirs = ['context', 'decisions', 'issues', 'solutions'];
    
    for (const dir of projectDirs) {
      await fs.mkdir(path.join(projectDir, dir), { recursive: true });
    }
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text) {
    if (!this.openai) {
      // Fallback: simple hash-based pseudo-embedding
      const hash = crypto.createHash('md5').update(text).digest('hex');
      return Array.from(hash).map((char, i) => (char.charCodeAt(0) + i) / 1000);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      console.warn('⚠️ OpenAI embedding error:', error.message);
      // Fallback to local embedding
      const hash = crypto.createHash('md5').update(text).digest('hex');
      return Array.from(hash).map((char, i) => (char.charCodeAt(0) + i) / 1000);
    }
  }

  /**
   * Store agent memory (global, version controlled)
   */
  async storeAgentMemory(type, content, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const memoryEntry = {
      id: crypto.randomUUID(),
      type: `agent_${type}`,
      content,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        memoryClass: 'agent',
        agentVersion: this.config.agent.version
      },
      embedding: await this.generateEmbedding(content)
    };

    // Store in Pinecone with agent prefix
    if (this.index) {
      try {
        await this.index.upsert([{
          id: memoryEntry.id,
          values: memoryEntry.embedding,
          metadata: {
            type: memoryEntry.type,
            content: memoryEntry.content.substring(0, 1000),
            memoryClass: 'agent',
            ...memoryEntry.metadata
          }
        }]);
      } catch (error) {
        console.warn('⚠️ Pinecone agent memory storage error:', error.message);
      }
    }

    // Always store locally in agent memory store
    await this.storeAgentMemoryLocally(memoryEntry, type);
    
    // Cache locally
    this.localCache.set(memoryEntry.id, memoryEntry);
    
    console.log(`🧠 Stored agent memory: ${type}`);
    return memoryEntry.id;
  }

  /**
   * Store project memory (per sub-git project)
   */
  async storeProjectMemory(type, content, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.currentProject) {
      throw new Error('No current project set. Use setCurrentProject() first.');
    }

    const memoryEntry = {
      id: crypto.randomUUID(),
      type: `project_${type}`,
      content,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        memoryClass: 'project',
        projectName: this.currentProject
      },
      embedding: await this.generateEmbedding(content)
    };

    // Store in Pinecone with project prefix (optional, as it's less important)
    if (this.index && this.config.memory?.syncProjectMemory !== false) {
      try {
        await this.index.upsert([{
          id: memoryEntry.id,
          values: memoryEntry.embedding,
          metadata: {
            type: memoryEntry.type,
            content: memoryEntry.content.substring(0, 1000),
            memoryClass: 'project',
            projectName: this.currentProject,
            ...memoryEntry.metadata
          }
        }]);
      } catch (error) {
        console.warn('⚠️ Pinecone project memory storage error:', error.message);
      }
    }

    // Always store locally in project memory store
    await this.storeProjectMemoryLocally(memoryEntry, type);
    
    console.log(`📁 Stored project memory: ${this.currentProject}/${type}`);
    return memoryEntry.id;
  }

  /**
   * Store agent memory locally (version controlled)
   */
  async storeAgentMemoryLocally(memoryEntry, type) {
    const typeDir = path.join(this.agentMemoryStore, type);
    await fs.mkdir(typeDir, { recursive: true });
    
    const filePath = path.join(typeDir, `${memoryEntry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(memoryEntry, null, 2));
  }

  /**
   * Store project memory locally (per project)
   */
  async storeProjectMemoryLocally(memoryEntry, type) {
    await this.ensureProjectDirectories(this.currentProject);
    
    const typeDir = path.join(this.getCurrentProjectMemoryDir(), type);
    await fs.mkdir(typeDir, { recursive: true });
    
    const filePath = path.join(typeDir, `${memoryEntry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(memoryEntry, null, 2));
  }

  /**
   * Search agent memories (global learning)
   */
  async searchAgentMemories(query, type = null, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const queryEmbedding = await this.generateEmbedding(query);
    let results = [];

    // Search in Pinecone if available
    if (this.index) {
      try {
        const filter = { 
          memoryClass: { $eq: 'agent' },
          ...(type ? { type: { $eq: `agent_${type}` } } : {})
        };
        
        const searchResults = await this.index.query({
          vector: queryEmbedding,
          topK: limit,
          filter,
          includeMetadata: true
        });
        
        results = searchResults.matches.map(match => ({
          id: match.id,
          score: match.score,
          content: match.metadata.content,
          metadata: match.metadata
        }));
      } catch (error) {
        console.warn('⚠️ Pinecone agent search error:', error.message);
      }
    }

    // Fallback to local search if no Pinecone results
    if (results.length === 0) {
      results = await this.searchAgentMemoriesLocally(queryEmbedding, type, limit);
    }

    return results;
  }

  /**
   * Search project memories (current project only)
   */
  async searchProjectMemories(query, type = null, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.currentProject) {
      return [];
    }

    const queryEmbedding = await this.generateEmbedding(query);
    let results = [];

    // Search in Pinecone if available
    if (this.index) {
      try {
        const filter = { 
          memoryClass: { $eq: 'project' },
          projectName: { $eq: this.currentProject },
          ...(type ? { type: { $eq: `project_${type}` } } : {})
        };
        
        const searchResults = await this.index.query({
          vector: queryEmbedding,
          topK: limit,
          filter,
          includeMetadata: true
        });
        
        results = searchResults.matches.map(match => ({
          id: match.id,
          score: match.score,
          content: match.metadata.content,
          metadata: match.metadata
        }));
      } catch (error) {
        console.warn('⚠️ Pinecone project search error:', error.message);
      }
    }

    // Fallback to local search if no Pinecone results
    if (results.length === 0) {
      results = await this.searchProjectMemoriesLocally(queryEmbedding, type, limit);
    }

    return results;
  }

  /**
   * Search agent memories locally
   */
  async searchAgentMemoriesLocally(queryEmbedding, type = null, limit = 5) {
    const results = [];
    
    try {
      let searchDirs;
      if (type) {
        searchDirs = [type];
      } else {
        const agentTypes = await fs.readdir(this.agentMemoryStore);
        searchDirs = [];
        for (const agentType of agentTypes) {
          const typePath = path.join(this.agentMemoryStore, agentType);
          try {
            const stat = await fs.stat(typePath);
            if (stat.isDirectory()) {
              searchDirs.push(agentType);
            }
          } catch (error) {
            // Skip if not a directory
          }
        }
      }

      for (const dir of searchDirs) {
        const dirPath = path.join(this.agentMemoryStore, dir);
        try {
          const files = await fs.readdir(dirPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(dirPath, file);
              const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
              const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
              results.push({
                id: memory.id,
                score: similarity,
                content: memory.content,
                metadata: memory.metadata
              });
            }
          }
        } catch (error) {
          // Directory might not exist, continue
        }
      }
    } catch (error) {
      // Agent memory store might not exist
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search project memories locally
   */
  async searchProjectMemoriesLocally(queryEmbedding, type = null, limit = 5) {
    const results = [];
    
    if (!this.currentProject) {
      return results;
    }

    try {
      const projectDir = this.getCurrentProjectMemoryDir();
      
      let searchDirs;
      if (type) {
        searchDirs = [type];
      } else {
        const projectTypes = await fs.readdir(projectDir);
        searchDirs = [];
        for (const projectType of projectTypes) {
          const typePath = path.join(projectDir, projectType);
          try {
            const stat = await fs.stat(typePath);
            if (stat.isDirectory()) {
              searchDirs.push(projectType);
            }
          } catch (error) {
            // Skip if not a directory
          }
        }
      }

      for (const dir of searchDirs) {
        const dirPath = path.join(projectDir, dir);
        try {
          const files = await fs.readdir(dirPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(dirPath, file);
              const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
              const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
              results.push({
                id: memory.id,
                score: similarity,
                content: memory.content,
                metadata: memory.metadata
              });
            }
          }
        } catch (error) {
          // Directory might not exist, continue
        }
      }
    } catch (error) {
      // Project memory store might not exist
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Store agent learning pattern (version controlled)
   */
  async storeAgentLearning(pattern, context = {}) {
    return await this.storeAgentMemory('learning', JSON.stringify({
      pattern,
      context,
      success: true
    }), {
      type: 'learning_pattern',
      ...context
    });
  }

  /**
   * Store project decision (project-specific)
   */
  async storeProjectDecision(decision, context = {}) {
    return await this.storeProjectMemory('decisions', JSON.stringify({
      decision,
      context,
      timestamp: Date.now()
    }), {
      type: 'project_decision',
      ...context
    });
  }

  /**
   * Get agent memory statistics
   */
  async getAgentMemoryStats() {
    const stats = {
      memoryClass: 'agent',
      localMemories: 0,
      types: {}
    };

    try {
      const agentTypes = await fs.readdir(this.agentMemoryStore);
      for (const type of agentTypes) {
        const typePath = path.join(this.agentMemoryStore, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            const count = files.filter(f => f.endsWith('.json')).length;
            stats.types[type] = count;
            stats.localMemories += count;
          }
        } catch (error) {
          // Skip if not a directory
        }
      }
    } catch (error) {
      // Agent memory store might not exist
    }

    return stats;
  }

  /**
   * Get project memory statistics
   */
  async getProjectMemoryStats(projectName = null) {
    const targetProject = projectName || this.currentProject;
    
    if (!targetProject) {
      return { error: 'No project specified' };
    }

    const stats = {
      memoryClass: 'project',
      projectName: targetProject,
      localMemories: 0,
      types: {}
    };

    try {
      const projectDir = path.join(this.projectMemoryStore, targetProject);
      const projectTypes = await fs.readdir(projectDir);
      
      for (const type of projectTypes) {
        const typePath = path.join(projectDir, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            const count = files.filter(f => f.endsWith('.json')).length;
            stats.types[type] = count;
            stats.localMemories += count;
          }
        } catch (error) {
          // Skip if not a directory
        }
      }
    } catch (error) {
      // Project memory store might not exist
    }

    return stats;
  }

  /**
   * Clean project memory for specific project
   */
  async cleanProjectMemory(projectName) {
    try {
      const projectDir = path.join(this.projectMemoryStore, projectName);
      await fs.rm(projectDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned project memory for: ${projectName}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Error cleaning project memory for ${projectName}:`, error.message);
      return false;
    }
  }

  /**
   * List all projects with memory
   */
  async listProjectsWithMemory() {
    try {
      const projects = await fs.readdir(this.projectMemoryStore);
      const projectStats = [];
      
      for (const project of projects) {
        const projectPath = path.join(this.projectMemoryStore, project);
        try {
          const stat = await fs.stat(projectPath);
          if (stat.isDirectory()) {
            const stats = await this.getProjectMemoryStats(project);
            projectStats.push({
              name: project,
              memoryCount: stats.localMemories,
              types: Object.keys(stats.types)
            });
          }
        } catch (error) {
          // Skip invalid directories
        }
      }
      
      return projectStats;
    } catch (error) {
      return [];
    }
  }

  /**
   * Sync agent memory to git (version controlled memory)
   */
  async syncAgentMemoryToGit() {
    // This would be called when pushing to git
    console.log('📤 Agent memory is stored in version-controlled directory');
    console.log(`📁 Location: ${this.agentMemoryStore}`);
    
    const stats = await this.getAgentMemoryStats();
    console.log(`🧠 Agent memory contains ${stats.localMemories} entries`);
    
    return {
      success: true,
      location: this.agentMemoryStore,
      memoryCount: stats.localMemories,
      message: 'Agent memory ready for git sync'
    };
  }

  /**
   * Get memory statistics (combined)
   */
  async getStats() {
    const .cursor/rules/agentstats = await this.getAgentMemoryStats();
    const projectStats = this.currentProject ? await this.getProjectMemoryStats() : null;
    
    return {
      pineconeConnected: !!this.index,
      openaiConnected: !!this.openai,
      agent: .cursor/rules/agentstats,
      project: projectStats,
      cacheSize: this.localCache.size,
      currentProject: this.currentProject
    };
  }

  /**
   * Store core framework learning
   */
  async storeCoreFrameworkLearning(pattern, context = {}) {
    const metadata = {
      type: 'core_framework',
      source: '.cursor/rules/agents/_store/projects/_core',
      ...context,
      timestamp: Date.now()
    };
    
    return await this.storeAgentMemory('core_learning', JSON.stringify(pattern), metadata);
  }

  /**
   * Retrieve core framework patterns
   */
  async getCoreFrameworkPatterns(query) {
    const memories = await this.searchAgentMemories(query, {
      filter: { type: 'core_framework' },
      limit: 10
    });
    
    return memories.map(memory => JSON.parse(memory.content));
  }

  /**
   * Handle project memory commands (CLI interface)
   */
  async handleProjectMemoryCommand(subcommand, args = []) {
    try {
      switch (subcommand) {
        case 'stats':
          const projectName = args[0];
          const stats = await this.getProjectMemoryStats(projectName);
          return {
            success: true,
            stats,
            message: `Project memory statistics for: ${stats.projectName || 'current project'}`
          };

        case 'search':
          if (args.length === 0) {
            return {
              success: false,
              message: 'Usage: project-memory search <query>'
            };
          }
          const query = args.join(' ');
          const results = await this.searchProjectMemories(query);
          return {
            success: true,
            results,
            message: `Found ${results.length} project memory entries`
          };

        case 'clean':
          const projectToClean = args[0];
          if (!projectToClean) {
            return {
              success: false,
              message: 'Usage: project-memory clean <project-name>'
            };
          }
          const cleanResult = await this.cleanProjectMemory(projectToClean);
          return {
            success: cleanResult,
            project: projectToClean,
            message: cleanResult ? 
              `Successfully cleaned project memory for: ${projectToClean}` :
              `Failed to clean project memory for: ${projectToClean}`
          };

        case 'list-projects':
          const projects = await this.listProjectsWithMemory();
          return {
            success: true,
            projects,
            message: `Found ${projects.length} projects with memory`
          };

        case 'set-project':
          const newProject = args[0];
          if (!newProject) {
            return {
              success: false,
              message: 'Usage: project-memory set-project <project-name>'
            };
          }
          this.setCurrentProject(newProject);
          return {
            success: true,
            project: newProject,
            message: `Set current project to: ${newProject}`
          };

        case 'current':
          return {
            success: true,
            project: this.currentProject,
            message: this.currentProject ? 
              `Current project: ${this.currentProject}` :
              'No current project set'
          };

        default:
          return {
            success: false,
            message: `Unknown project memory subcommand: ${subcommand}. Available: stats, search, clean, list-projects, set-project, current`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Project memory command failed: ${error.message}`
      };
    }
  }

}

module.exports = MemoryManager;
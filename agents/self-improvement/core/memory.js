/**
 * 🧠 Memory Manager - Pinecone-powered agent memory system
 * 
 * Stores and retrieves agent learning, context, and user preferences
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
    this.memoryStore = path.join(__dirname, '../../_store/memory');
  }

  /**
   * Initialize Pinecone and OpenAI connections
   */
  async initialize() {
    try {
      // Initialize Pinecone (if API key provided)
      if (process.env.PINECONE_API_KEY) {
        this.pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY
        });
        
        // Create or get index
        const indexName = this.config.memory?.indexName || 'agent-memory';
        try {
          this.index = this.pinecone.index(indexName);
          console.log('✅ Connected to Pinecone index:', indexName);
        } catch (error) {
          console.log('⚠️ Pinecone index not found, using local memory only');
        }
      }

      // Initialize OpenAI for embeddings (if API key provided)
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ Connected to OpenAI for embeddings');
      }

      // Ensure local memory directories exist
      await this.ensureDirectories();
      
      this.isInitialized = true;
      console.log('🧠 MemoryManager initialized');
      
    } catch (error) {
      console.warn('⚠️ MemoryManager initialization error:', error.message);
      console.log('💡 Using local memory only');
      this.isInitialized = true;
    }
  }

  /**
   * Ensure local memory directories exist
   */
  async ensureDirectories() {
    const dirs = ['embeddings', 'contexts', 'learning'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.memoryStore, dir), { recursive: true });
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
   * Store memory entry
   */
  async storeMemory(type, content, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const memoryEntry = {
      id: crypto.randomUUID(),
      type,
      content,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        projectType: metadata.projectType || 'unknown'
      },
      embedding: await this.generateEmbedding(content)
    };

    // Store in Pinecone if available
    if (this.index) {
      try {
        await this.index.upsert([{
          id: memoryEntry.id,
          values: memoryEntry.embedding,
          metadata: {
            type: memoryEntry.type,
            content: memoryEntry.content.substring(0, 1000), // Pinecone metadata limit
            ...memoryEntry.metadata
          }
        }]);
      } catch (error) {
        console.warn('⚠️ Pinecone storage error:', error.message);
      }
    }

    // Always store locally as backup
    await this.storeLocally(memoryEntry);
    
    // Cache locally
    this.localCache.set(memoryEntry.id, memoryEntry);
    
    return memoryEntry.id;
  }

  /**
   * Store memory locally
   */
  async storeLocally(memoryEntry) {
    const filePath = path.join(this.memoryStore, memoryEntry.type, `${memoryEntry.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(memoryEntry, null, 2));
  }

  /**
   * Search memories by similarity
   */
  async searchMemories(query, type = null, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const queryEmbedding = await this.generateEmbedding(query);
    let results = [];

    // Search in Pinecone if available
    if (this.index) {
      try {
        const filter = type ? { type: { $eq: type } } : {};
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
        console.warn('⚠️ Pinecone search error:', error.message);
      }
    }

    // Fallback to local search if no Pinecone results
    if (results.length === 0) {
      results = await this.searchLocally(queryEmbedding, type, limit);
    }

    return results;
  }

  /**
   * Search memories locally using simple similarity
   */
  async searchLocally(queryEmbedding, type = null, limit = 5) {
    const results = [];
    const searchDirs = type ? [type] : ['embeddings', 'contexts', 'learning'];

    for (const dir of searchDirs) {
      const dirPath = path.join(this.memoryStore, dir);
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
   * Store user feedback on improvements
   */
  async storeUserFeedback(improvement, userResponse, context = {}) {
    return await this.storeMemory('learning', JSON.stringify({
      improvement,
      userResponse, // 'approved', 'rejected', 'modified'
      context
    }), {
      type: 'user_feedback',
      category: improvement.category,
      priority: improvement.priority,
      ...context
    });
  }

  /**
   * Store successful patterns
   */
  async storeSuccessPattern(pattern, projectType, context = {}) {
    return await this.storeMemory('learning', JSON.stringify({
      pattern,
      projectType,
      context,
      success: true
    }), {
      type: 'success_pattern',
      projectType,
      ...context
    });
  }

  /**
   * Store project context
   */
  async storeProjectContext(projectName, context, phase = 'unknown') {
    return await this.storeMemory('contexts', JSON.stringify({
      projectName,
      context,
      phase
    }), {
      type: 'project_context',
      projectName,
      phase
    });
  }

  /**
   * Get relevant memories for current context
   */
  async getRelevantMemories(context, projectType = null, limit = 3) {
    const contextQuery = typeof context === 'string' ? context : JSON.stringify(context);
    return await this.searchMemories(contextQuery, null, limit);
  }

  /**
   * Learn from past user feedback
   */
  async getPastFeedback(improvementCategory, projectType = null) {
    const query = `improvement category ${improvementCategory}`;
    const memories = await this.searchMemories(query, 'learning', 10);
    
    return memories.filter(memory => {
      try {
        const data = JSON.parse(memory.content);
        return data.improvement && data.improvement.category === improvementCategory;
      } catch {
        return false;
      }
    });
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    const stats = {
      pineconeConnected: !!this.index,
      openaiConnected: !!this.openai,
      localMemories: 0,
      cacheSize: this.localCache.size
    };

    // Count local memories
    try {
      const dirs = ['embeddings', 'contexts', 'learning'];
      for (const dir of dirs) {
        const dirPath = path.join(this.memoryStore, dir);
        const files = await fs.readdir(dirPath);
        stats.localMemories += files.filter(f => f.endsWith('.json')).length;
      }
    } catch (error) {
      // Directories might not exist
    }

    return stats;
  }

  /**
   * Clear old memories (cleanup)
   */
  async clearOldMemories(daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    const dirs = ['embeddings', 'contexts', 'learning'];
    for (const dir of dirs) {
      const dirPath = path.join(this.memoryStore, dir);
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(dirPath, file);
            const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
            if (memory.metadata.timestamp < cutoffTime) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }

    return deletedCount;
  }
}

module.exports = MemoryManager; 
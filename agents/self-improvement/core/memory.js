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
      console.log('🔧 Initializing Memory Manager...');
      
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
    // Ensure the type directory exists
    const typeDir = path.join(this.memoryStore, memoryEntry.type);
    await fs.mkdir(typeDir, { recursive: true });
    
    const filePath = path.join(typeDir, `${memoryEntry.id}.json`);
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
    
    try {
      let searchDirs;
      if (type) {
        searchDirs = [type];
      } else {
        // Get all memory type directories
        const memoryTypes = await fs.readdir(this.memoryStore);
        searchDirs = [];
        for (const memoryType of memoryTypes) {
          const typePath = path.join(this.memoryStore, memoryType);
          try {
            const stat = await fs.stat(typePath);
            if (stat.isDirectory()) {
              searchDirs.push(memoryType);
            }
          } catch (error) {
            // Skip if not a directory
          }
        }
      }

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
    } catch (error) {
      // Memory store might not exist
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

    try {
      const memoryTypes = await fs.readdir(this.memoryStore);
      for (const type of memoryTypes) {
        const typePath = path.join(this.memoryStore, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            for (const file of files) {
              if (file.endsWith('.json')) {
                const filePath = path.join(typePath, file);
                const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
                if (memory.metadata.timestamp < cutoffTime) {
                  await fs.unlink(filePath);
                  deletedCount++;
                }
              }
            }
          }
        } catch (error) {
          // Skip if not a directory or can't read
        }
      }
    } catch (error) {
      // Memory store directory might not exist
    }

    return deletedCount;
  }

  /**
   * Sync local memories to Pinecone
   */
  async syncLocalToPinecone() {
    if (!this.index) {
      throw new Error('Pinecone not connected. Cannot sync to cloud.');
    }

    console.log('🔄 Starting local → Pinecone sync...');
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const memoryTypes = await fs.readdir(this.memoryStore);
      for (const type of memoryTypes) {
        const typePath = path.join(this.memoryStore, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            console.log(`📁 Processing ${files.length} files in ${type}/`);

            for (const file of files) {
              if (file.endsWith('.json')) {
                try {
                  const filePath = path.join(typePath, file);
                  const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
                  
                  // Check if already exists in Pinecone
                  const existing = await this.checkPineconeMemory(memory.id);
                  if (existing) {
                    skipped++;
                    continue;
                  }

                  // Upload to Pinecone
                  await this.index.upsert([{
                    id: memory.id,
                    values: memory.embedding,
                    metadata: {
                      type: memory.type,
                      content: memory.content.substring(0, 1000), // Pinecone metadata limit
                      ...memory.metadata
                    }
                  }]);
                  
                  uploaded++;
                  if (uploaded % 10 === 0) {
                    console.log(`  ✅ Uploaded ${uploaded} memories...`);
                  }
                } catch (error) {
                  console.warn(`⚠️ Error uploading ${file}:`, error.message);
                  errors++;
                }
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error reading directory ${type}:`, error.message);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error reading memory store:`, error.message);
    }

    console.log(`🎯 Sync complete: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors`);
    return { uploaded, skipped, errors };
  }

  /**
   * Sync Pinecone memories to local
   */
  async syncPineconeToLocal() {
    if (!this.index) {
      throw new Error('Pinecone not connected. Cannot sync from cloud.');
    }

    console.log('🔄 Starting Pinecone → local sync...');
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Query all memories from Pinecone (using empty vector to get all)
      const emptyVector = new Array(1536).fill(0); // OpenAI embedding dimension
      const allResults = await this.index.query({
        vector: emptyVector,
        topK: 10000, // Large number to get all memories
        includeMetadata: true
      });

      console.log(`📥 Found ${allResults.matches.length} memories in Pinecone`);

      for (const match of allResults.matches) {
        try {
          const memory = {
            id: match.id,
            type: match.metadata.type,
            content: match.metadata.content,
            metadata: match.metadata,
            embedding: match.values || []
          };

          // Check if already exists locally
          const localPath = path.join(this.memoryStore, memory.type, `${memory.id}.json`);
          try {
            await fs.access(localPath);
            skipped++;
            continue;
          } catch {
            // File doesn't exist, proceed with download
          }

          // Save locally
          await this.storeLocally(memory);
          downloaded++;
          
          if (downloaded % 10 === 0) {
            console.log(`  ✅ Downloaded ${downloaded} memories...`);
          }
        } catch (error) {
          console.warn(`⚠️ Error downloading memory ${match.id}:`, error.message);
          errors++;
        }
      }
    } catch (error) {
      console.error('❌ Error querying Pinecone:', error.message);
      throw error;
    }

    console.log(`🎯 Sync complete: ${downloaded} downloaded, ${skipped} skipped, ${errors} errors`);
    return { downloaded, skipped, errors };
  }

  /**
   * Bidirectional sync (local ↔ Pinecone)
   */
  async bidirectionalSync() {
    if (!this.index) {
      throw new Error('Pinecone not connected. Cannot perform bidirectional sync.');
    }

    console.log('🔄 Starting bidirectional sync...');
    
    // First sync local to Pinecone
    const uploadResult = await this.syncLocalToPinecone();
    
    // Then sync Pinecone to local
    const downloadResult = await this.syncPineconeToLocal();
    
    console.log('🎯 Bidirectional sync complete!');
    console.log(`📤 Uploaded: ${uploadResult.uploaded}, Skipped: ${uploadResult.skipped}`);
    console.log(`📥 Downloaded: ${downloadResult.downloaded}, Skipped: ${downloadResult.skipped}`);
    
    return {
      upload: uploadResult,
      download: downloadResult
    };
  }

  /**
   * Check if memory exists in Pinecone
   */
  async checkPineconeMemory(memoryId) {
    if (!this.index) return false;
    
    try {
      const result = await this.index.fetch([memoryId]);
      return result.records && result.records[memoryId];
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const status = {
      pineconeConnected: !!this.index,
      openaiConnected: !!this.openai,
      localMemories: 0,
      pineconeMemories: 0,
      lastSync: null
    };

    // Count local memories in all subdirectories
    try {
      const memoryTypes = await fs.readdir(this.memoryStore);
      for (const type of memoryTypes) {
        const typePath = path.join(this.memoryStore, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            status.localMemories += files.filter(f => f.endsWith('.json')).length;
          }
        } catch (error) {
          // Skip if not a directory or can't read
        }
      }
    } catch (error) {
      // Memory store directory might not exist
    }

    // Count Pinecone memories
    if (this.index) {
      try {
        const emptyVector = new Array(1536).fill(0);
        const result = await this.index.query({
          vector: emptyVector,
          topK: 10000,
          includeMetadata: false
        });
        status.pineconeMemories = result.matches.length;
      } catch (error) {
        console.warn('⚠️ Error counting Pinecone memories:', error.message);
      }
    }

    return status;
  }

  /**
   * Reset Pinecone index (delete all memories)
   */
  async resetPineconeIndex() {
    if (!this.index) {
      throw new Error('Pinecone not connected.');
    }

    console.log('⚠️ Resetting Pinecone index...');
    
    try {
      await this.index.deleteAll();
      console.log('✅ Pinecone index reset complete');
    } catch (error) {
      console.error('❌ Error resetting Pinecone index:', error.message);
      throw error;
    }
  }

  /**
   * Fix embedding dimensions for memories with incorrect dimensions
   */
  async fixEmbeddingDimensions() {
    console.log('🔧 Fixing embedding dimensions...');
    let fixed = 0;
    let errors = 0;

    try {
      const memoryTypes = await fs.readdir(this.memoryStore);
      for (const type of memoryTypes) {
        const typePath = path.join(this.memoryStore, type);
        try {
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            
            for (const file of files) {
              if (file.endsWith('.json')) {
                try {
                  const filePath = path.join(typePath, file);
                  const memory = JSON.parse(await fs.readFile(filePath, 'utf8'));
                  
                  // Check if embedding has wrong dimension
                  if (memory.embedding && memory.embedding.length !== 1536) {
                    console.log(`🔧 Fixing ${file} (${memory.embedding.length} → 1536 dimensions)`);
                    
                    // Regenerate embedding with correct dimension
                    memory.embedding = await this.generateEmbedding(memory.content);
                    
                    // Save the fixed memory
                    await fs.writeFile(filePath, JSON.stringify(memory, null, 2));
                    fixed++;
                  }
                } catch (error) {
                  console.warn(`⚠️ Error fixing ${file}:`, error.message);
                  errors++;
                }
              }
            }
          }
        } catch (error) {
          // Skip if not a directory
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error reading memory store:`, error.message);
    }

    console.log(`🎯 Fixed ${fixed} memories, ${errors} errors`);
    return { fixed, errors };
  }
}

module.exports = MemoryManager; 
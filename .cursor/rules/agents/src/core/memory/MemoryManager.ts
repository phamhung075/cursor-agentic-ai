import { EventEmitter } from 'events';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Memory,
  MemoryType,
  MemoryQuery,
  MemorySearchResult,
  MemoryAnalytics,
  AAIError,
  ValidationError,
  NotFoundError
} from '@/types';

export interface VectorStore {
  store(id: string, embedding: number[], metadata: Record<string, any>): Promise<void>;
  search(query: number[], limit: number, threshold?: number): Promise<Array<{
    id: string;
    score: number;
    metadata: Record<string, any>;
  }>>;
  delete(id: string): Promise<void>;
}

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * Enhanced Memory Manager for AAI System
 * 
 * Provides intelligent memory storage, retrieval, and management with
 * AI-powered semantic search and automatic memory organization.
 */
export class MemoryManager extends EventEmitter {
  private db: Database.Database;
  private vectorStore: VectorStore;
  private embeddingService: EmbeddingService;
  private memoryCache: Map<string, Memory> = new Map();
  private readonly CACHE_SIZE = 1000;

  constructor(
    dbPath: string,
    vectorStore: VectorStore,
    embeddingService: EmbeddingService
  ) {
    super();
    this.db = new Database(dbPath);
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
    
    this.initializeDatabase();
    this.loadRecentMemories();
  }

  /**
   * Initialize database indexes for better performance
   */
  private initializeDatabase(): void {
    // Create additional indexes for memory operations
    this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_memories_type_importance 
      ON memories(type, importance DESC)
    `).run();

    this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_memories_project_type 
      ON memories(project_id, type)
    `).run();

    this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_memories_access_count 
      ON memories(access_count DESC)
    `).run();
  }

  /**
   * Load recent memories into cache
   */
  private async loadRecentMemories(): Promise<void> {
    try {
      const recentMemories = this.db.prepare(`
        SELECT * FROM memories 
        ORDER BY last_accessed DESC 
        LIMIT ?
      `).all(this.CACHE_SIZE) as any[];

      for (const memory of recentMemories) {
        this.memoryCache.set(memory.id, this.deserializeMemory(memory));
      }

      this.emit('memoriesLoaded', this.memoryCache.size);
    } catch (error) {
      throw new AAIError('Failed to load recent memories', 'MEMORY_LOAD_ERROR', 500, { error });
    }
  }

  /**
   * Store memory with AI-powered embedding generation
   */
  async storeMemory(
    projectId: string,
    content: string,
    type: MemoryType,
    metadata: {
      filePath?: string;
      language?: string;
      framework?: string;
      tags?: string[];
      importance?: number;
    } = {}
  ): Promise<string> {
    try {
      this.validateMemoryContent(content, type);

      const memoryId = uuidv4();
      const embedding = await this.embeddingService.generateEmbedding(content);
      const importance = metadata.importance || this.calculateImportance(content, type);
      const tags = metadata.tags || this.extractTags(content, type);

      // Store in database
      const insertMemory = this.db.prepare(`
        INSERT INTO memories (
          id, content, type, project_id, embedding_id, file_path,
          language, framework, tags, importance, access_count,
          created_at, updated_at, last_accessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'), datetime('now'))
      `);

      insertMemory.run(
        memoryId,
        content,
        type,
        projectId,
        memoryId, // Use memory ID as embedding ID
        metadata.filePath || null,
        metadata.language || null,
        metadata.framework || null,
        JSON.stringify(tags),
        importance
      );

      // Store embedding in vector store
      await this.vectorStore.store(memoryId, embedding, {
        projectId,
        type,
        filePath: metadata.filePath,
        language: metadata.language,
        framework: metadata.framework,
        importance,
        tags
      });

      // Update cache
      const memory: Memory = {
        id: memoryId,
        content,
        type,
        projectId,
        embeddingId: memoryId,
        filePath: metadata.filePath,
        language: metadata.language,
        framework: metadata.framework,
        tags,
        importance,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessed: new Date()
      };

      this.updateCache(memoryId, memory);

      this.emit('memoryStored', { memoryId, projectId, type, importance });

      return memoryId;
    } catch (error) {
      this.emit('memoryStoreError', { projectId, type, error });
      throw new AAIError('Failed to store memory', 'MEMORY_STORE_ERROR', 500, { projectId, type, error });
    }
  }

  /**
   * Retrieve memories with semantic search
   */
  async retrieveMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    try {
      let results: MemorySearchResult[] = [];

      if (query.semanticQuery) {
        // Semantic search using embeddings
        results = await this.semanticSearch(query);
      } else {
        // Traditional database search
        results = await this.databaseSearch(query);
      }

      // Update access counts for retrieved memories
      await this.updateAccessCounts(results.map(r => r.memory.id));

      this.emit('memoriesRetrieved', { 
        query: query.semanticQuery || query.filters?.type, 
        resultCount: results.length 
      });

      return results;
    } catch (error) {
      this.emit('memoryRetrieveError', { query, error });
      throw new AAIError('Failed to retrieve memories', 'MEMORY_RETRIEVE_ERROR', 500, { query, error });
    }
  }

  /**
   * Semantic search using vector embeddings
   */
  private async semanticSearch(query: MemoryQuery): Promise<MemorySearchResult[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query.semanticQuery!);
    
    const vectorResults = await this.vectorStore.search(
      queryEmbedding,
      query.limit || 10,
      query.threshold || 0.7
    );

    const results: MemorySearchResult[] = [];

    for (const vectorResult of vectorResults) {
      const memory = await this.getMemoryById(vectorResult.id);
      if (memory && this.matchesFilters(memory, query.filters)) {
        results.push({
          memory,
          score: vectorResult.score,
          relevanceReason: this.generateRelevanceReason(memory, query.semanticQuery!)
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Traditional database search
   */
  private async databaseSearch(query: MemoryQuery): Promise<MemorySearchResult[]> {
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    // Apply filters
    if (query.filters?.projectId) {
      sql += ' AND project_id = ?';
      params.push(query.filters.projectId);
    }

    if (query.filters?.type) {
      sql += ' AND type = ?';
      params.push(query.filters.type);
    }

    if (query.filters?.filePath) {
      sql += ' AND file_path LIKE ?';
      params.push(`%${query.filters.filePath}%`);
    }

    if (query.filters?.language) {
      sql += ' AND language = ?';
      params.push(query.filters.language);
    }

    if (query.filters?.framework) {
      sql += ' AND framework = ?';
      params.push(query.filters.framework);
    }

    if (query.filters?.minImportance) {
      sql += ' AND importance >= ?';
      params.push(query.filters.minImportance);
    }

    if (query.filters?.tags && query.filters.tags.length > 0) {
      const tagConditions = query.filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      sql += ` AND (${tagConditions})`;
      query.filters.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    // Text search in content
    if (query.textQuery) {
      sql += ' AND content LIKE ?';
      params.push(`%${query.textQuery}%`);
    }

    // Ordering
    sql += ' ORDER BY importance DESC, last_accessed DESC';

    // Limit
    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    const rows = this.db.prepare(sql).all(...params) as any[];
    
    return rows.map(row => ({
      memory: this.deserializeMemory(row),
      score: this.calculateRelevanceScore(this.deserializeMemory(row)),
      relevanceReason: this.generateRelevanceReason(this.deserializeMemory(row), query.textQuery || '')
    }));
  }

  /**
   * Get memory by ID
   */
  async getMemoryById(memoryId: string): Promise<Memory | null> {
    // Check cache first
    if (this.memoryCache.has(memoryId)) {
      const memory = this.memoryCache.get(memoryId)!;
      await this.updateAccessCount(memoryId);
      return memory;
    }

    // Query database
    const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(memoryId) as any;
    
    if (!row) {
      return null;
    }

    const memory = this.deserializeMemory(row);
    this.updateCache(memoryId, memory);
    await this.updateAccessCount(memoryId);

    return memory;
  }

  /**
   * Update memory content and regenerate embedding
   */
  async updateMemory(memoryId: string, updates: {
    content?: string;
    tags?: string[];
    importance?: number;
    userFeedback?: Record<string, any>;
  }): Promise<void> {
    try {
      const memory = await this.getMemoryById(memoryId);
      if (!memory) {
        throw new NotFoundError('Memory', memoryId);
      }

      const updateFields: string[] = [];
      const params: any[] = [];

      if (updates.content && updates.content !== memory.content) {
        // Regenerate embedding for new content
        const newEmbedding = await this.embeddingService.generateEmbedding(updates.content);
        await this.vectorStore.store(memoryId, newEmbedding, {
          projectId: memory.projectId,
          type: memory.type,
          filePath: memory.filePath,
          language: memory.language,
          framework: memory.framework,
          importance: updates.importance || memory.importance,
          tags: updates.tags || memory.tags
        });

        updateFields.push('content = ?');
        params.push(updates.content);
      }

      if (updates.tags) {
        updateFields.push('tags = ?');
        params.push(JSON.stringify(updates.tags));
      }

      if (updates.importance !== undefined) {
        updateFields.push('importance = ?');
        params.push(updates.importance);
      }

      if (updates.userFeedback) {
        updateFields.push('user_feedback = ?');
        params.push(JSON.stringify(updates.userFeedback));
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = datetime(\'now\')');
        params.push(memoryId);

        const sql = `UPDATE memories SET ${updateFields.join(', ')} WHERE id = ?`;
        this.db.prepare(sql).run(...params);

        // Update cache
        const updatedMemory = { ...memory, ...updates, updatedAt: new Date() };
        this.updateCache(memoryId, updatedMemory);

        this.emit('memoryUpdated', { memoryId, updates });
      }
    } catch (error) {
      this.emit('memoryUpdateError', { memoryId, updates, error });
      throw new AAIError('Failed to update memory', 'MEMORY_UPDATE_ERROR', 500, { memoryId, updates, error });
    }
  }

  /**
   * Delete memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    try {
      const memory = await this.getMemoryById(memoryId);
      if (!memory) {
        throw new NotFoundError('Memory', memoryId);
      }

      // Delete from database
      this.db.prepare('DELETE FROM memories WHERE id = ?').run(memoryId);

      // Delete from vector store
      await this.vectorStore.delete(memoryId);

      // Remove from cache
      this.memoryCache.delete(memoryId);

      this.emit('memoryDeleted', { memoryId, projectId: memory.projectId });
    } catch (error) {
      this.emit('memoryDeleteError', { memoryId, error });
      throw new AAIError('Failed to delete memory', 'MEMORY_DELETE_ERROR', 500, { memoryId, error });
    }
  }

  /**
   * Get memory analytics
   */
  async getMemoryAnalytics(projectId?: string): Promise<MemoryAnalytics> {
    try {
      const whereClause = projectId ? 'WHERE project_id = ?' : '';
      const params = projectId ? [projectId] : [];

      const totalMemories = this.db.prepare(`
        SELECT COUNT(*) as count FROM memories ${whereClause}
      `).get(...params) as { count: number };

      const memoryByType = this.db.prepare(`
        SELECT type, COUNT(*) as count FROM memories ${whereClause}
        GROUP BY type
      `).all(...params) as Array<{ type: string; count: number }>;

      const avgImportance = this.db.prepare(`
        SELECT AVG(importance) as avg FROM memories ${whereClause}
      `).get(...params) as { avg: number };

      const topTags = this.db.prepare(`
        SELECT tags FROM memories ${whereClause}
      `).all(...params) as Array<{ tags: string }>;

      // Process tags
      const tagCounts: Record<string, number> = {};
      topTags.forEach(row => {
        try {
          const tags = JSON.parse(row.tags) as string[];
          tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } catch {
          // Skip invalid JSON
        }
      });

      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return {
        totalMemories: totalMemories.count,
        memoryByType: memoryByType.reduce((acc, item) => {
          acc[item.type as MemoryType] = item.count;
          return acc;
        }, {} as Record<MemoryType, number>),
        averageImportance: avgImportance.avg || 0,
        topTags: sortedTags,
        cacheSize: this.memoryCache.size,
        cacheHitRate: 0 // TODO: Implement cache hit rate tracking
      };
    } catch (error) {
      throw new AAIError('Failed to get memory analytics', 'MEMORY_ANALYTICS_ERROR', 500, { projectId, error });
    }
  }

  /**
   * Clean up old memories based on retention policy
   */
  async cleanupOldMemories(retentionDays: number = 90): Promise<number> {
    try {
      // Get memories to delete
      const memoriesToDelete = this.db.prepare(`
        SELECT id FROM memories 
        WHERE created_at < datetime('now', '-${retentionDays} days')
        AND access_count < 5
        AND importance < 0.3
      `).all() as Array<{ id: string }>;

      let deletedCount = 0;

      for (const memory of memoriesToDelete) {
        try {
          await this.deleteMemory(memory.id);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete memory ${memory.id}:`, error);
        }
      }

      this.emit('memoriesCleanedUp', deletedCount);
      return deletedCount;
    } catch (error) {
      throw new AAIError('Failed to cleanup old memories', 'MEMORY_CLEANUP_ERROR', 500, { retentionDays, error });
    }
  }

  /**
   * Helper methods
   */

  private validateMemoryContent(content: string, type: MemoryType): void {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Memory content cannot be empty');
    }

    if (content.length > 50000) {
      throw new ValidationError('Memory content too large (max 50KB)');
    }

    const validTypes: MemoryType[] = ['context', 'code', 'conversation', 'pattern'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid memory type: ${type}`);
    }
  }

  private calculateImportance(content: string, type: MemoryType): number {
    let importance = 0.5; // Base importance

    // Type-based importance
    switch (type) {
      case 'pattern':
        importance += 0.2;
        break;
      case 'code':
        importance += 0.15;
        break;
      case 'context':
        importance += 0.1;
        break;
      case 'conversation':
        importance += 0.05;
        break;
    }

    // Content-based importance
    if (content.includes('error') || content.includes('bug')) {
      importance += 0.1;
    }

    if (content.includes('TODO') || content.includes('FIXME')) {
      importance += 0.05;
    }

    if (content.length > 1000) {
      importance += 0.05; // Longer content might be more important
    }

    return Math.min(importance, 1.0);
  }

  private extractTags(content: string, type: MemoryType): string[] {
    const tags: string[] = [type];

    // Extract common programming keywords
    const keywords = [
      'function', 'class', 'interface', 'type', 'const', 'let', 'var',
      'import', 'export', 'async', 'await', 'promise', 'error', 'bug',
      'test', 'spec', 'component', 'hook', 'api', 'database', 'query'
    ];

    const contentLower = content.toLowerCase();
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private matchesFilters(memory: Memory, filters?: MemoryQuery['filters']): boolean {
    if (!filters) return true;

    if (filters.projectId && memory.projectId !== filters.projectId) return false;
    if (filters.type && memory.type !== filters.type) return false;
    if (filters.filePath && (!memory.filePath || !memory.filePath.includes(filters.filePath))) return false;
    if (filters.language && memory.language !== filters.language) return false;
    if (filters.framework && memory.framework !== filters.framework) return false;
    if (filters.minImportance && memory.importance < filters.minImportance) return false;

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => memory.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    return true;
  }

  private calculateRelevanceScore(memory: Memory): number {
    let score = memory.importance;

    // Boost score based on access count
    score += Math.min(memory.accessCount * 0.01, 0.2);

    // Boost score for recent memories
    const daysSinceAccess = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 7) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateRelevanceReason(memory: Memory, query: string): string {
    const reasons: string[] = [];

    if (memory.importance > 0.7) {
      reasons.push('High importance');
    }

    if (memory.accessCount > 10) {
      reasons.push('Frequently accessed');
    }

    const daysSinceAccess = (Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 1) {
      reasons.push('Recently accessed');
    }

    if (query && memory.content.toLowerCase().includes(query.toLowerCase())) {
      reasons.push('Content match');
    }

    return reasons.join(', ') || 'General relevance';
  }

  private async updateAccessCount(memoryId: string): Promise<void> {
    this.db.prepare(`
      UPDATE memories 
      SET access_count = access_count + 1, last_accessed = datetime('now')
      WHERE id = ?
    `).run(memoryId);

    // Update cache if present
    if (this.memoryCache.has(memoryId)) {
      const memory = this.memoryCache.get(memoryId)!;
      memory.accessCount++;
      memory.lastAccessed = new Date();
    }
  }

  private async updateAccessCounts(memoryIds: string[]): Promise<void> {
    if (memoryIds.length === 0) return;

    const placeholders = memoryIds.map(() => '?').join(',');
    this.db.prepare(`
      UPDATE memories 
      SET access_count = access_count + 1, last_accessed = datetime('now')
      WHERE id IN (${placeholders})
    `).run(...memoryIds);

    // Update cache
    memoryIds.forEach(id => {
      if (this.memoryCache.has(id)) {
        const memory = this.memoryCache.get(id)!;
        memory.accessCount++;
        memory.lastAccessed = new Date();
      }
    });
  }

  private updateCache(memoryId: string, memory: Memory): void {
    // Implement LRU cache eviction if needed
    if (this.memoryCache.size >= this.CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(memoryId, memory);
  }

  private deserializeMemory(row: any): Memory {
    return {
      id: row.id,
      content: row.content,
      type: row.type as MemoryType,
      projectId: row.project_id,
      embeddingId: row.embedding_id,
      filePath: row.file_path,
      language: row.language,
      framework: row.framework,
      tags: row.tags ? JSON.parse(row.tags) : [],
      importance: row.importance,
      accessCount: row.access_count,
      userFeedback: row.user_feedback ? JSON.parse(row.user_feedback) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAccessed: new Date(row.last_accessed)
    };
  }

  /**
   * Close database connection and cleanup
   */
  close(): void {
    this.db.close();
    this.memoryCache.clear();
    this.removeAllListeners();
  }
} 
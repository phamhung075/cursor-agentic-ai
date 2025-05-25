import { EventEmitter } from 'events';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  ProjectContext,
  ContextData,
  EnrichedContext,
  ContextSuggestion,
  ContextPattern,
  FileRelationship,
  AIInsight,
  AAIError,
  ValidationError,
  NotFoundError
} from '@/types';

export interface SessionManager {
  getCurrentSession(): string;
  updateSession(data: any): Promise<void>;
}

export interface FileRelationshipManager {
  analyzeFileRelationships(filePath: string): Promise<FileRelationship[]>;
  suggestRelatedFiles(currentFile: string, context: string): Promise<string[]>;
}

export interface AIAnalyzer {
  analyzeContextPatterns(context: ContextData): Promise<ContextPattern[]>;
  generateAIInsights(context: ContextData): Promise<AIInsight[]>;
  enrichContextWithAI(context: ContextData): Promise<EnrichedContext>;
}

/**
 * Enhanced Context Manager for AAI System
 * 
 * Provides intelligent context management with AI-powered analysis,
 * persistent storage, and real-time context tracking.
 */
export class ContextManager extends EventEmitter {
  private db: Database.Database;
  private contexts: Map<string, ProjectContext> = new Map();
  private sessionManager: SessionManager;
  private fileTracker: FileRelationshipManager;
  private aiAnalyzer: AIAnalyzer;
  private currentProjectId: string | null = null;

  constructor(
    dbPath: string,
    sessionManager: SessionManager,
    fileTracker: FileRelationshipManager,
    aiAnalyzer: AIAnalyzer
  ) {
    super();
    this.db = new Database(dbPath);
    this.sessionManager = sessionManager;
    this.fileTracker = fileTracker;
    this.aiAnalyzer = aiAnalyzer;
    
    this.initializeDatabase();
    this.loadExistingContexts();
  }

  /**
   * Initialize database prepared statements
   */
  private initializeDatabase(): void {
    // Prepared statements for better performance
    this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_contexts_project_confidence 
      ON contexts(project_id, confidence DESC)
    `).run();
  }

  /**
   * Load existing contexts from database
   */
  private async loadExistingContexts(): Promise<void> {
    try {
      const contexts = this.db.prepare(`
        SELECT * FROM contexts 
        ORDER BY updated_at DESC 
        LIMIT 100
      `).all() as any[];

      for (const context of contexts) {
        this.contexts.set(context.id, this.deserializeContext(context));
      }

      this.emit('contextsLoaded', this.contexts.size);
    } catch (error) {
      throw new AAIError('Failed to load existing contexts', 'CONTEXT_LOAD_ERROR', 500, { error });
    }
  }

  /**
   * Save context with AI analysis and enrichment
   */
  async saveContext(projectId: string, context: ContextData): Promise<string> {
    try {
      this.validateContextData(context);

      // Enhanced context saving with AI analysis
      const enrichedContext = await this.enrichContextWithAI(context);
      const contextId = uuidv4();

      // Persist to database
      const insertContext = this.db.prepare(`
        INSERT INTO contexts (
          id, project_id, file_path, cursor_position, selected_text,
          open_files, recent_files, workspace_state, patterns,
          relationships, ai_insights, confidence, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      insertContext.run(
        contextId,
        projectId,
        enrichedContext.filePath,
        JSON.stringify(enrichedContext.cursorPosition),
        enrichedContext.selectedText || null,
        JSON.stringify(enrichedContext.openFiles),
        JSON.stringify(enrichedContext.recentFiles),
        JSON.stringify(enrichedContext.workspaceState),
        JSON.stringify(enrichedContext.patterns),
        JSON.stringify(enrichedContext.relationships),
        JSON.stringify(enrichedContext.aiInsights),
        this.calculateContextConfidence(enrichedContext)
      );

      // Update in-memory cache
      const projectContext = await this.getProjectContext(projectId);
      this.contexts.set(contextId, {
        ...projectContext,
        contextData: enrichedContext
      });

      // Real-time context broadcasting
      this.broadcastContextChange(projectId, contextId);

      // Update session
      await this.sessionManager.updateSession({
        lastContextId: contextId,
        timestamp: new Date()
      });

      this.emit('contextSaved', { projectId, contextId, confidence: this.calculateContextConfidence(enrichedContext) });

      return contextId;
    } catch (error) {
      this.emit('contextSaveError', { projectId, error });
      throw new AAIError('Failed to save context', 'CONTEXT_SAVE_ERROR', 500, { projectId, error });
    }
  }

  /**
   * Restore context with intelligent suggestions
   */
  async restoreContext(projectId: string): Promise<ProjectContext> {
    try {
      // Intelligent context restoration with confidence scoring
      const context = await this.loadLatestContext(projectId);
      if (!context) {
        throw new NotFoundError('Context', projectId);
      }

      const suggestions = await this.generateContextSuggestions(context);
      await this.fileTracker.suggestRelatedFiles(
        context.contextData?.['filePath'] || '',
        projectId
      );

      const enrichedContext: ProjectContext = {
        ...context,
        suggestions,
        confidence: this.calculateContextConfidence(context.contextData as EnrichedContext)
      };

      // Update last accessed time
      this.db.prepare(`
        UPDATE contexts 
        SET updated_at = datetime('now') 
        WHERE project_id = ? AND id = ?
      `).run(projectId, context.id);

      this.emit('contextRestored', { projectId, contextId: context.id, confidence: enrichedContext.confidence });

      return enrichedContext;
    } catch (error) {
      this.emit('contextRestoreError', { projectId, error });
      throw error;
    }
  }

  /**
   * Enrich context with AI analysis
   */
  private async enrichContextWithAI(context: ContextData): Promise<EnrichedContext> {
    try {
      // AI-powered context analysis and enrichment
      const patterns = await this.detectContextPatterns(context);
      const relationships = await this.analyzeFileRelationships(context);
      const aiInsights = await this.generateAIInsights(context);

      return {
        ...context,
        patterns,
        relationships,
        aiInsights
      };
    } catch (error) {
      // Fallback to basic context if AI analysis fails
      console.warn('AI context enrichment failed, using basic context:', error);
      return {
        ...context,
        patterns: [],
        relationships: [],
        aiInsights: []
      };
    }
  }

  /**
   * Detect context patterns using AI
   */
  private async detectContextPatterns(context: ContextData): Promise<ContextPattern[]> {
    try {
      return await this.aiAnalyzer.analyzeContextPatterns(context);
    } catch (error) {
      console.warn('Pattern detection failed:', error);
      return [];
    }
  }

  /**
   * Analyze file relationships
   */
  private async analyzeFileRelationships(context: ContextData): Promise<FileRelationship[]> {
    try {
      return await this.fileTracker.analyzeFileRelationships(context.filePath);
    } catch (error) {
      console.warn('File relationship analysis failed:', error);
      return [];
    }
  }

  /**
   * Generate AI insights
   */
  private async generateAIInsights(context: ContextData): Promise<AIInsight[]> {
    try {
      return await this.aiAnalyzer.generateAIInsights(context);
    } catch (error) {
      console.warn('AI insights generation failed:', error);
      return [];
    }
  }

  /**
   * Calculate context confidence score
   */
  private calculateContextConfidence(context?: ContextData | EnrichedContext): number {
    if (!context) return 0;

    let confidence = 0.5; // Base confidence

    // File path confidence
    if (context.filePath && context.filePath.length > 0) {
      confidence += 0.2;
    }

    // Cursor position confidence
    if (context.cursorPosition && context.cursorPosition.line >= 0) {
      confidence += 0.1;
    }

    // Open files confidence
    if (context.openFiles && context.openFiles.length > 0) {
      confidence += 0.1;
    }

    // Workspace state confidence
    if (context.workspaceState && context.workspaceState.activeEditor) {
      confidence += 0.1;
    }

    // AI enrichment confidence
    if ('patterns' in context && context.patterns && context.patterns.length > 0) {
      confidence += 0.1;
    }

    if ('relationships' in context && context.relationships && context.relationships.length > 0) {
      confidence += 0.1;
    }

    if ('aiInsights' in context && context.aiInsights && context.aiInsights.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate context suggestions
   */
  private async generateContextSuggestions(context: ProjectContext): Promise<ContextSuggestion[]> {
    const suggestions: ContextSuggestion[] = [];

    try {
      // File suggestions based on relationships
      if (context.contextData) {
        const relatedFiles = await this.fileTracker.suggestRelatedFiles(
          context.contextData['filePath'],
          context.id
        );

        for (const file of relatedFiles.slice(0, 3)) {
          suggestions.push({
            type: 'file',
            title: `Open ${file}`,
            description: `Related file that might be relevant to your current work`,
            confidence: 0.8,
            metadata: { filePath: file, action: 'open' }
          });
        }
      }

      // Action suggestions based on patterns
      if (context.contextData && 'patterns' in context.contextData) {
        const patterns = context.contextData['patterns'] || [];
        for (const pattern of patterns.slice(0, 2)) {
          if (pattern.confidence > 0.7) {
            suggestions.push({
              type: 'action',
              title: `Continue ${pattern.type} workflow`,
              description: `Based on detected pattern: ${pattern.type}`,
              confidence: pattern.confidence,
              metadata: { pattern: pattern.type, action: 'continue_workflow' }
            });
          }
        }
      }

      // Automation suggestions
      suggestions.push({
        type: 'automation',
        title: 'Create automation for this workflow',
        description: 'Automate repetitive tasks based on your current context',
        confidence: 0.6,
        metadata: { action: 'create_automation' }
      });

    } catch (error) {
      console.warn('Failed to generate context suggestions:', error);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Broadcast context changes to listeners
   */
  private broadcastContextChange(projectId: string, contextId: string): void {
    this.emit('contextChanged', {
      projectId,
      contextId,
      timestamp: new Date()
    });
  }

  /**
   * Load latest context for project
   */
  private async loadLatestContext(projectId: string): Promise<ProjectContext | null> {
    try {
      const contextRow = this.db.prepare(`
        SELECT * FROM contexts 
        WHERE project_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `).get(projectId);

      if (!contextRow) {
        return null;
      }

      const projectRow = this.db.prepare(`
        SELECT * FROM projects WHERE id = ?
      `).get(projectId);

      if (!projectRow) {
        throw new NotFoundError('Project', projectId);
      }

      return {
        ...this.deserializeProject(projectRow),
        contextData: this.deserializeContextData(contextRow)
      };
    } catch (error) {
      throw new AAIError('Failed to load latest context', 'CONTEXT_LOAD_ERROR', 500, { projectId, error });
    }
  }

  /**
   * Get project context
   */
  private async getProjectContext(projectId: string): Promise<ProjectContext> {
    const projectRow = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).get(projectId);

    if (!projectRow) {
      throw new NotFoundError('Project', projectId);
    }

    return this.deserializeProject(projectRow);
  }

  /**
   * Validate context data
   */
  private validateContextData(context: ContextData): void {
    if (!context.filePath) {
      throw new ValidationError('Context must have a file path');
    }

    if (!context.cursorPosition || typeof context.cursorPosition.line !== 'number') {
      throw new ValidationError('Context must have valid cursor position');
    }

    if (!Array.isArray(context.openFiles)) {
      throw new ValidationError('Context must have valid open files array');
    }

    if (!context.workspaceState) {
      throw new ValidationError('Context must have workspace state');
    }
  }

  /**
   * Deserialize context from database
   */
  private deserializeContext(row: any): ProjectContext {
    return {
      id: row.id,
      name: row.name || 'Unknown Project',
      path: row.path || '',
      branch: row.branch || 'main',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAccessed: new Date(row.last_accessed || row.updated_at),
      contextData: this.deserializeContextData(row)
    };
  }

  /**
   * Deserialize project from database
   */
  private deserializeProject(row: any): ProjectContext {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      gitUrl: row.git_url,
      branch: row.branch,
      language: row.language,
      framework: row.framework,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAccessed: new Date(row.last_accessed),
      contextData: row.context_data ? JSON.parse(row.context_data) : undefined,
      settings: row.settings ? JSON.parse(row.settings) : undefined
    };
  }

  /**
   * Deserialize context data from database
   */
  private deserializeContextData(row: any): EnrichedContext {
    return {
      filePath: row.file_path,
      cursorPosition: JSON.parse(row.cursor_position),
      selectedText: row.selected_text,
      openFiles: JSON.parse(row.open_files),
      recentFiles: JSON.parse(row.recent_files),
      workspaceState: JSON.parse(row.workspace_state),
      timestamp: new Date(row.created_at),
      patterns: row.patterns ? JSON.parse(row.patterns) : [],
      relationships: row.relationships ? JSON.parse(row.relationships) : [],
      aiInsights: row.ai_insights ? JSON.parse(row.ai_insights) : []
    };
  }

  /**
   * Get context analytics
   */
  async getContextAnalytics(projectId?: string): Promise<{
    totalContexts: number;
    averageConfidence: number;
    topPatterns: string[];
    recentActivity: number;
  }> {
    try {
      const whereClause = projectId ? 'WHERE project_id = ?' : '';
      const params = projectId ? [projectId] : [];

      const totalContexts = this.db.prepare(`
        SELECT COUNT(*) as count FROM contexts ${whereClause}
      `).get(...params) as { count: number };

      const avgConfidence = this.db.prepare(`
        SELECT AVG(confidence) as avg FROM contexts ${whereClause}
      `).get(...params) as { avg: number };

      const recentActivity = this.db.prepare(`
        SELECT COUNT(*) as count FROM contexts 
        ${whereClause} ${whereClause ? 'AND' : 'WHERE'} created_at > datetime('now', '-7 days')
      `).get(...params) as { count: number };

      return {
        totalContexts: totalContexts.count,
        averageConfidence: avgConfidence.avg || 0,
        topPatterns: [], // TODO: Implement pattern analysis
        recentActivity: recentActivity.count
      };
    } catch (error) {
      throw new AAIError('Failed to get context analytics', 'ANALYTICS_ERROR', 500, { projectId, error });
    }
  }

  /**
   * Set current project
   */
  setCurrentProject(projectId: string): void {
    this.currentProjectId = projectId;
    this.emit('currentProjectChanged', projectId);
  }

  /**
   * Get current project
   */
  getCurrentProject(): string | null {
    return this.currentProjectId;
  }

  /**
   * Clean up old contexts
   */
  async cleanupOldContexts(retentionDays: number = 30): Promise<number> {
    try {
      const result = this.db.prepare(`
        DELETE FROM contexts 
        WHERE created_at < datetime('now', '-${retentionDays} days')
      `).run();

      this.emit('contextsCleanedUp', result.changes);
      return result.changes;
    } catch (error) {
      throw new AAIError('Failed to cleanup old contexts', 'CLEANUP_ERROR', 500, { retentionDays, error });
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    this.removeAllListeners();
  }
} 
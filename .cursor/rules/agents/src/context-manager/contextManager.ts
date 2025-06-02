import { ContextFile, ContextStatus, ContextSession, ContextAction, TechnicalDecision, ProblemSolution, ContinuationNote, FileChange } from '../common/types';
import fs from 'fs';
import path from 'path';

/**
 * Manages context files for AI assistants
 */
export class ContextManager {
  private contextsDir: string;
  private static instance: ContextManager;

  /**
   * Creates a new ContextManager instance
   * @param contextsDir Directory to store context files
   */
  constructor(contextsDir: string = 'contexts') {
    this.contextsDir = contextsDir;
    this.ensureContextDirectory();
  }

  /**
   * Gets the singleton instance of ContextManager
   * @param contextsDir Optional directory to store context files
   * @returns The ContextManager instance
   */
  public static getInstance(contextsDir?: string): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager(contextsDir);
    }
    return ContextManager.instance;
  }

  /**
   * Ensures the contexts directory exists
   * @private
   */
  private ensureContextDirectory(): void {
    if (!fs.existsSync(this.contextsDir)) {
      fs.mkdirSync(this.contextsDir, { recursive: true });
    }
  }

  /**
   * Gets the context file path for a task
   * @param taskId ID of the task
   * @returns Path to the context file
   * @private
   */
  private getContextFilePath(taskId: string): string {
    return path.join(this.contextsDir, `context_${taskId}.json`);
  }

  /**
   * Gets a context file for a task
   * @param taskId ID of the task
   * @returns The context file or null if not found
   */
  public async getContext(taskId: string): Promise<ContextFile | null> {
    const filePath = this.getContextFilePath(taskId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content) as ContextFile;
    } catch (error) {
      console.error(`Error reading context file for task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Saves a context file
   * @param contextFile The context file to save
   */
  public async saveContext(contextFile: ContextFile): Promise<void> {
    const filePath = this.getContextFilePath(contextFile.taskId);

    try {
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(contextFile, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error(`Error saving context file for task ${contextFile.taskId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a context file
   * @param taskId ID of the task
   */
  public async deleteContext(taskId: string): Promise<void> {
    const filePath = this.getContextFilePath(taskId);

    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error(`Error deleting context file for task ${taskId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Lists all context files
   * @returns Array of context files
   */
  public async listContexts(): Promise<ContextFile[]> {
    this.ensureContextDirectory();

    try {
      const files = await fs.promises.readdir(this.contextsDir);
      const contextFiles: ContextFile[] = [];

      for (const file of files) {
        if (file.startsWith('context_') && file.endsWith('.json')) {
          const filePath = path.join(this.contextsDir, file);
          const content = await fs.promises.readFile(filePath, 'utf8');
          contextFiles.push(JSON.parse(content) as ContextFile);
        }
      }

      return contextFiles;
    } catch (error) {
      console.error('Error listing context files:', error);
      return [];
    }
  }

  /**
   * Checks if a context file exists for a task
   * @param taskId ID of the task
   * @returns Whether a context file exists
   */
  public contextExists(taskId: string): boolean {
    return fs.existsSync(this.getContextFilePath(taskId));
  }

  /**
   * Creates a new context file for a task
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns The created context file
   */
  public createContext(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();

    const context: ContextFile = {
      taskId,
      taskTitle,
      lastUpdated: timestamp,
      session: 1,
      toolCallsUsed: 0,
      status: {
        phase: 'Analysis',
        progress: '0% - Beginning task analysis',
        nextAction: 'Understand requirements and plan approach'
      },
      sessions: [
        {
          number: 1,
          timestamp,
          actions: [
            {
              timestamp,
              description: 'Started analysis of task requirements'
            }
          ]
        }
      ],
      technicalDecisions: [],
      problems: [],
      nextSteps: ['Analyze task requirements', 'Develop implementation plan', 'Identify dependencies'],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Understand task requirements fully before implementation'
        }
      ],
      codeCreated: [],
      codeModified: []
    };

    this.saveContext(context);
    return context;
  }

  /**
   * Loads a context file for a task
   * @param taskId ID of the task
   * @returns The loaded context file or null if it doesn't exist
   */
  public loadContext(taskId: string): ContextFile | null {
    const filePath = this.getContextFilePath(taskId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    // For demonstration, we'll parse the markdown file into our structure
    // In a real implementation, this would be more robust
    const content = fs.readFileSync(filePath, 'utf8');

    // Parse the context file content into a ContextFile object
    return this.parseContextFile(content, taskId);
  }

  /**
   * Parses a context file from markdown format
   * @param content Context file content
   * @param taskId ID of the task
   * @returns Parsed context file
   */
  private parseContextFile(content: string, taskId: string): ContextFile {
    // Extract basic metadata
    const titleMatch = content.match(/^# Context for Task .+ - (.+)$/m);
    const taskTitle = titleMatch ? titleMatch[1] : 'Unknown Task';

    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\* (.+)$/m);
    const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toISOString();

    const sessionMatch = content.match(/\*\*Session:\*\* (\d+)$/m);
    const session = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;

    const toolCallsMatch = content.match(/\*\*Tool Calls Used:\*\* (\d+)\/\d+$/m);
    const toolCallsUsed = toolCallsMatch ? parseInt(toolCallsMatch[1], 10) : 0;

    // Extract status
    const phaseMatch = content.match(/\*\*Phase:\*\* (.+)$/m);
    const progressMatch = content.match(/\*\*Progress:\*\* (.+)$/m);
    const nextActionMatch = content.match(/\*\*Next Action:\*\* (.+)$/m);

    const status: ContextStatus = {
      phase: (phaseMatch ? phaseMatch[1] : 'Analysis') as any,
      progress: progressMatch ? progressMatch[1] : '0% - Not started',
      nextAction: nextActionMatch ? nextActionMatch[1] : 'Begin task analysis'
    };

    // For simplicity, we'll create placeholder data for other sections
    // In a real implementation, these would be parsed from the file content
    const sessions: ContextSession[] = [];
    const technicalDecisions: TechnicalDecision[] = [];
    const problems: ProblemSolution[] = [];
    const nextSteps: string[] = [];
    const continuationNotes: ContinuationNote[] = [];

    // Parse session data (simplified)
    const sessionRegex = /### Session (\d+) - (.+?)\n([\s\S]*?)(?=###|$)/g;
    let sessionMatchResult;

    while ((sessionMatchResult = sessionRegex.exec(content)) !== null) {
      const sessionNumber = parseInt(sessionMatchResult[1], 10);
      const sessionTimestamp = sessionMatchResult[2];
      const sessionContent = sessionMatchResult[3].trim();

      // Parse actions (simplified)
      const actionStrings = sessionContent
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2));

      // Convert string actions to ContextAction objects
      const actions: ContextAction[] = actionStrings.map(description => ({
        timestamp: sessionTimestamp,
        description
      }));

      sessions.push({
        number: sessionNumber,
        timestamp: sessionTimestamp,
        actions
      });
    }

    // If no sessions were found, create a default one
    if (sessions.length === 0) {
      sessions.push({
        number: 1,
        timestamp: lastUpdated,
        actions: [
          {
            timestamp: lastUpdated,
            description: 'Session data not found'
          }
        ]
      });
    }

    return {
      taskId,
      taskTitle,
      lastUpdated,
      session,
      toolCallsUsed,
      status,
      sessions,
      technicalDecisions,
      problems,
      nextSteps,
      continuationNotes,
      codeCreated: [],
      codeModified: []
    };
  }

  /**
   * Updates the tool call count in a context file
   * @param taskId ID of the task
   * @param toolCallsUsed Number of tool calls used
   */
  public updateToolCallCount(taskId: string, toolCallsUsed: number): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.toolCallsUsed = toolCallsUsed;
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }

  /**
   * Adds an action to the current session in a context file
   * @param taskId ID of the task
   * @param actionDescription Action description to add
   */
  public addAction(taskId: string, actionDescription: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      const currentSession = context.sessions.find(s => s.number === context.session);
      const timestamp = new Date().toISOString();

      const action: ContextAction = {
        timestamp,
        description: actionDescription
      };

      if (currentSession) {
        currentSession.actions.push(action);
      } else {
        context.sessions.push({
          number: context.session,
          timestamp,
          actions: [action]
        });
      }

      context.lastUpdated = timestamp;
      this.saveContext(context);
    }
  }

  /**
   * Records a file creation in the context file
   * @param taskId ID of the task
   * @param filePath Path to the created file
   * @param description Description of the file
   */
  public recordFileCreation(taskId: string, filePath: string, description: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      // Initialize codeCreated array if it doesn't exist
      context.codeCreated = context.codeCreated || [];

      // Add the file reference
      context.codeCreated.push({
        filePath,
        description,
        timestamp: new Date().toISOString()
      });

      context.lastUpdated = new Date().toISOString();
      this.saveContext(context);
    }
  }

  /**
   * Records a file modification in the context file
   * @param taskId ID of the task
   * @param filePath Path to the modified file
   * @param description Description of the changes
   */
  public recordFileModification(taskId: string, filePath: string, description: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      // Initialize codeModified array if it doesn't exist
      context.codeModified = context.codeModified || [];

      // Add the file reference
      context.codeModified.push({
        filePath,
        description,
        timestamp: new Date().toISOString()
      });

      context.lastUpdated = new Date().toISOString();
      this.saveContext(context);
    }
  }

  /**
   * Updates the status of a task in the context file
   * @param taskId ID of the task
   * @param phase Current phase
   * @param progress Progress description
   * @param nextAction Next action to take
   */
  public updateStatus(taskId: string, phase: ContextStatus['phase'], progress: string, nextAction: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.status = { phase, progress, nextAction };
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }

  /**
   * Starts a new session for a task
   * @param taskId ID of the task
   * @returns The new session number
   */
  public startNewSession(taskId: string): number {
    const context = this.loadContext(taskId);

    if (!context) {
      return 1;
    }

    const newSessionNumber = context.session + 1;
    const timestamp = new Date().toISOString();

    context.session = newSessionNumber;
    context.lastUpdated = timestamp;

    context.sessions.push({
      number: newSessionNumber,
      timestamp,
      actions: [
        {
          timestamp,
          description: 'Started new session'
        }
      ]
    });

    this.saveContext(context);
    return newSessionNumber;
  }

  /**
   * Records a technical decision in the context file
   * @param taskId ID of the task
   * @param category Category of the decision
   * @param description Description of the decision
   * @param reasoning Reasoning behind the decision
   */
  public recordTechnicalDecision(taskId: string, category: string, description: string, reasoning: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.technicalDecisions.push({ category, description, reasoning });
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }

  /**
   * Records a problem and its solution in the context file
   * @param taskId ID of the task
   * @param problem Description of the problem
   * @param solution Solution applied
   * @param impact Impact of the solution
   */
  public recordProblem(taskId: string, problem: string, solution: string, impact: string): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.problems.push({ problem, solution, impact });
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }

  /**
   * Updates the next steps in the context file
   * @param taskId ID of the task
   * @param nextSteps Array of next steps
   */
  public updateNextSteps(taskId: string, nextSteps: string[]): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.nextSteps = nextSteps;
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }

  /**
   * Updates the continuation notes in the context file
   * @param taskId ID of the task
   * @param continuationNotes Array of continuation notes
   */
  public updateContinuationNotes(taskId: string, continuationNotes: ContinuationNote[]): void {
    const context = this.loadContext(taskId);

    if (context) {
      context.continuationNotes = continuationNotes;
      context.lastUpdated = new Date().toISOString();

      this.saveContext(context);
    }
  }
}

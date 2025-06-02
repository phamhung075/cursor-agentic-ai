import fs from 'fs';
import path from 'path';
import { ContextFile, ContextStatus, ContextSession, ContextAction, FileChange } from '../common/types';
import { ContextManager } from './contextManager';
import { ContextTemplates } from './templates';

/**
 * Responsible for automating context file operations
 */
export class ContextAutomation {
  private contextManager: ContextManager;
  private static instance: ContextAutomation;

  /**
   * Creates a new ContextAutomation instance
   */
  private constructor() {
    this.contextManager = new ContextManager();
  }

  /**
   * Gets the singleton instance of ContextAutomation
   * @returns The ContextAutomation instance
   */
  public static getInstance(): ContextAutomation {
    if (!ContextAutomation.instance) {
      ContextAutomation.instance = new ContextAutomation();
    }
    return ContextAutomation.instance;
  }

  /**
   * Initializes a new context file for a task
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns The created context file
   */
  public async initializeContext(taskId: string, taskTitle: string): Promise<ContextFile> {
    console.log(`Initializing context for task ${taskId}: ${taskTitle}`);

    // Create a new context file from template
    const contextFile = ContextTemplates.createBasicTemplate(taskId, taskTitle);

    // Save the context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Context file for task ${taskId} initialized`);

    return contextFile;
  }

  /**
   * Updates a context file with progress information
   * @param taskId ID of the task
   * @param status New status information
   * @param toolCallsUsed Number of tool calls used
   * @returns The updated context file
   */
  public async updateStatus(taskId: string, status: ContextStatus, toolCallsUsed: number): Promise<ContextFile> {
    console.log(`Updating status for task ${taskId}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, create a new one
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Update the status and tool calls
    contextFile.status = status;
    contextFile.toolCallsUsed = toolCallsUsed;
    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Status updated for task ${taskId}`);

    return contextFile;
  }

  /**
   * Adds a new session to a context file
   * @param taskId ID of the task
   * @returns The updated context file
   */
  public async startNewSession(taskId: string): Promise<ContextFile> {
    console.log(`Starting new session for task ${taskId}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, throw an error
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Create a new session
    const newSession: ContextSession = {
      timestamp: new Date().toISOString(),
      number: contextFile.session + 1,
      actions: []
    };

    // Update the context file with the new session
    contextFile.session = newSession.number;
    contextFile.sessions = contextFile.sessions || [];
    contextFile.sessions.push(newSession);
    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`New session ${newSession.number} started for task ${taskId}`);

    return contextFile;
  }

  /**
   * Adds an action to the current session
   * @param taskId ID of the task
   * @param action Action description
   * @returns The updated context file
   */
  public async addAction(taskId: string, action: string): Promise<ContextFile> {
    console.log(`Adding action for task ${taskId}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, throw an error
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Make sure we have sessions
    if (!contextFile.sessions || contextFile.sessions.length === 0) {
      await this.startNewSession(taskId);
      contextFile = await this.contextManager.getContext(taskId);
    }

    // Add the action to the current session
    const currentSession = contextFile.sessions[contextFile.sessions.length - 1];
    currentSession.actions.push({
      timestamp: new Date().toISOString(),
      description: action
    });

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Action added for task ${taskId}`);

    return contextFile;
  }

  /**
   * Updates the context file's tool calls count
   * @param taskId ID of the task
   * @param incrementAmount Amount to increment the tool calls count
   * @returns The updated context file
   */
  public async incrementToolCalls(taskId: string, incrementAmount: number = 1): Promise<ContextFile> {
    console.log(`Incrementing tool calls for task ${taskId} by ${incrementAmount}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, throw an error
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Update the tool calls count
    contextFile.toolCallsUsed += incrementAmount;
    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Tool calls updated for task ${taskId}: ${contextFile.toolCallsUsed}`);

    return contextFile;
  }

  /**
   * Adds information about code created or modified
   * @param taskId ID of the task
   * @param filePath Path to the file
   * @param description Description of the changes
   * @param isCreated Whether the file was created or modified
   * @returns The updated context file
   */
  public async addCodeReference(
    taskId: string,
    filePath: string,
    description: string,
    isCreated: boolean = false
  ): Promise<ContextFile> {
    console.log(`Adding code reference for task ${taskId}: ${filePath}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, throw an error
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Initialize the code arrays if they don't exist
    contextFile.codeCreated = contextFile.codeCreated || [];
    contextFile.codeModified = contextFile.codeModified || [];

    // Add the file reference to the appropriate array
    const codeRef = {
      filePath,
      description,
      timestamp: new Date().toISOString()
    };

    if (isCreated) {
      contextFile.codeCreated.push(codeRef);
    } else {
      contextFile.codeModified.push(codeRef);
    }

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Code reference added for task ${taskId}`);

    return contextFile;
  }

  /**
   * Finalizes a context file when a task is completed
   * @param taskId ID of the task
   * @returns The finalized context file
   */
  public async finalizeContext(taskId: string): Promise<ContextFile> {
    console.log(`Finalizing context for task ${taskId}`);

    // Load the existing context file
    let contextFile = await this.contextManager.getContext(taskId);

    // If no context file exists, throw an error
    if (!contextFile) {
      throw new Error(`No context file found for task ${taskId}`);
    }

    // Update the status to completed
    contextFile.status = {
      phase: 'Complete',
      progress: '100% - Task completed',
      nextAction: 'No further actions required'
    };

    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);
    console.log(`Context finalized for task ${taskId}`);

    return contextFile;
  }

  /**
   * Gets the context file for a task
   * @param taskId ID of the task
   * @returns The context file
   */
  public async getContext(taskId: string): Promise<ContextFile | null> {
    return this.contextManager.getContext(taskId);
  }

  /**
   * Gets or creates the current session in a context file
   * @param contextFile The context file
   * @returns The current session
   * @private
   */
  private getCurrentSession(contextFile: ContextFile): ContextSession {
    // Check for existing sessions
    if (contextFile.sessions.length === 0 ||
        contextFile.sessions[contextFile.sessions.length - 1].number !== contextFile.session) {
      // Create a new session
      const newSession: ContextSession = {
        timestamp: new Date().toISOString(),
        number: contextFile.session,
        actions: []
      };

      contextFile.sessions.push(newSession);
    }

    // Return the current session
    return contextFile.sessions[contextFile.sessions.length - 1];
  }

  /**
   * Adds an action to the context session
   * @param taskId ID of the task
   * @param actionType Type of action (for metadata)
   * @param description Description of the action
   * @param metadata Additional metadata
   * @returns Updated context file
   */
  public async addContextAction(
    taskId: string,
    actionType: string,
    description: string,
    metadata?: any
  ): Promise<ContextFile | null> {
    // Load the existing context file
    const contextFile = await this.contextManager.getContext(taskId);

    if (!contextFile) {
      console.warn(`No context file found for task ${taskId}`);
      return null;
    }

    // Get the current session or create a new one
    const currentSession = this.getCurrentSession(contextFile);

    // Create the action
    const action: ContextAction = {
      timestamp: new Date().toISOString(),
      description
    };

    // Add action to the current session
    currentSession.actions.push(action);

    // Increment tool calls
    contextFile.toolCallsUsed += 1;

    // Update last updated timestamp
    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);

    return contextFile;
  }

  /**
   * Adds a file modification record to the context
   * @param taskId ID of the task
   * @param filePath Path to the file
   * @param description Description of the modification
   * @returns Updated context file
   */
  public async addFileModification(
    taskId: string,
    filePath: string,
    description: string
  ): Promise<ContextFile | null> {
    // Load the existing context file
    const contextFile = await this.contextManager.getContext(taskId);

    if (!contextFile) {
      console.warn(`No context file found for task ${taskId}`);
      return null;
    }

    // Create file reference
    const fileRef = {
      filePath,
      description,
      timestamp: new Date().toISOString()
    };

    // Initialize codeModified array if it doesn't exist
    if (!contextFile.codeModified) {
      contextFile.codeModified = [];
    }

    // Check if the file is already in the list
    const existingIndex = contextFile.codeModified.findIndex(ref => ref.filePath === filePath);

    if (existingIndex >= 0) {
      // Update existing entry
      contextFile.codeModified[existingIndex] = fileRef;
    } else {
      // Add new entry
      contextFile.codeModified.push(fileRef);
    }

    // Update last updated timestamp
    contextFile.lastUpdated = new Date().toISOString();

    // Save the updated context file
    await this.contextManager.saveContext(contextFile);

    return contextFile;
  }
}

/**
 * Context Data Type Definitions
 *
 * Defines the structure of context data used throughout the application.
 */

/**
 * Context metadata interface
 */
export interface ContextMetadata {
  task_id: string;
  title: string;
  last_updated: string;
  session: number;
  tool_calls_used: number;
  tool_calls_limit: number;
  [key: string]: any;
}

/**
 * Context current status interface
 */
export interface ContextStatus {
  phase: string;
  progress_percentage: number;
  progress_summary: string;
  next_action: string;
  [key: string]: any;
}

/**
 * Context action interface
 */
export interface ContextAction {
  description: string;
  type: string;
  details: string;
  [key: string]: any;
}

/**
 * Context session interface
 */
export interface ContextSession {
  timestamp: string;
  session_number: number;
  actions: ContextAction[];
  [key: string]: any;
}

/**
 * Complete context data interface
 */
export interface ContextData {
  metadata: ContextMetadata;
  current_status: ContextStatus;
  session_history?: ContextSession[];
  [key: string]: any;
}

/**
 * Context file options
 */
export interface ContextFileOptions {
  format?: 'yaml' | 'json' | 'markdown';
  outputPath?: string;
  templateDir?: string;
}

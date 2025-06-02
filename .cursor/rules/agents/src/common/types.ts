/**
 * Common types for the Cursor AI Automation Framework
 */

/**
 * Represents a rule in the cursor workspace
 */
export interface Rule {
  /** Description of the rule */
  description: string;
  /** Glob patterns for files this rule applies to */
  globs?: string | string[];
  /** Whether this rule should always be applied */
  alwaysApply?: boolean;
  /** Version of the rule */
  version?: string;
  /** Content of the rule */
  content: string;
  /** References to other files or rules */
  references?: RuleReference[];
}

/**
 * Metadata for a rule
 */
export interface RuleMetadata {
  /** Brief description of the rule */
  description: string;
  /** File patterns this rule applies to */
  globs: string[];
  /** Whether this rule should always be applied */
  alwaysApply: boolean;
  /** Priority of the rule (1-10) */
  priority?: number;
  /** Category of the rule */
  category?: string;
  /** Related rules */
  relatedRules?: string[];
  /** Version of the rule */
  version?: string;
}

/**
 * A section within a rule
 */
export interface RuleSection {
  /** The title of the section */
  title: string;
  /** The content of the section */
  content: string;
  /** Code examples within the section */
  codeExamples?: CodeExample[];
  /** Bullet points as directives */
  directives?: string[];
}

/**
 * A code example within a rule
 */
export interface CodeExample {
  /** The language of the code */
  language: string;
  /** The code content */
  code: string;
  /** Whether this is a positive or negative example */
  isPositive: boolean;
}

/**
 * A reference to another rule
 */
export interface RuleReference {
  /** Type of reference */
  type: string;
  /** Path to the referenced file */
  path: string;
}

/**
 * Agent types in the system
 */
export enum AgentType {
  RULE_INTERPRETER = 'rule-interpreter',
  CONTEXT_MANAGER = 'context-manager',
  TASK_MANAGER = 'task-manager',
  CODE_GENERATOR = 'code-generator',
  REVIEW = 'review'
}

/**
 * Permission levels for agents
 */
export enum PermissionLevel {
  READ_ONLY = 1,
  CONTEXT_UPDATE = 2,
  CODE_MODIFICATION = 3,
  RULE_CREATION = 4,
  SYSTEM_ADMIN = 5
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Type of agent */
  type: AgentType;
  /** Permission level */
  permissionLevel: PermissionLevel;
  /** Capabilities of the agent */
  capabilities: string[];
  /** Activation triggers */
  triggers: AgentTrigger[];
}

/**
 * Trigger for agent activation
 */
export interface AgentTrigger {
  /** Type of trigger */
  type: 'file-pattern' | 'command' | 'event' | 'schedule';
  /** Pattern for the trigger */
  pattern: string;
  /** Priority of the trigger (1-10) */
  priority: number;
}

/**
 * Message for agent communication
 */
export interface AgentMessage {
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID */
  to: string;
  /** Action to perform */
  action: string;
  /** Message payload */
  payload: Record<string, any>;
  /** Priority level (1-5) */
  priority: number;
  /** Timestamp of the message */
  timestamp: string;
}

/**
 * Response to an agent message
 */
export interface AgentResponse {
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID */
  to: string;
  /** Status of the operation */
  status: 'success' | 'failure' | 'pending';
  /** Response payload */
  payload: Record<string, any>;
  /** Timestamp of the response */
  timestamp: string;
}

/**
 * Context file information
 */
export interface ContextFile {
  /** The task ID this context is for */
  taskId: string;
  /** The task title */
  taskTitle: string;
  /** When the context was last updated */
  lastUpdated: string;
  /** The current session number */
  session: number;
  /** Number of tool calls used */
  toolCallsUsed: number;
  /** Current status information */
  status: ContextStatus;
  /** History of actions taken */
  sessions: ContextSession[];
  /** Technical decisions made */
  technicalDecisions: TechnicalDecision[];
  /** Problems encountered and solutions */
  problems: ProblemSolution[];
  /** Next steps to take */
  nextSteps: string[];
  /** Notes for continuation */
  continuationNotes: ContinuationNote[];
  /** Files created during the task */
  codeCreated?: CodeReference[];
  /** Files modified during the task */
  codeModified?: CodeReference[];
}

/**
 * Status information in a context file
 */
export interface ContextStatus {
  /** Current phase of work */
  phase: 'Analysis' | 'Planning' | 'Implementation' | 'Testing' | 'Complete';
  /** Progress percentage and summary */
  progress: string;
  /** Next action to take */
  nextAction: string;
}

/**
 * Context session for a task
 */
export interface ContextSession {
  /** Timestamp when the session started */
  timestamp: string;
  /** Session number */
  number: number;
  /** Actions taken during the session */
  actions: ContextAction[];
}

/**
 * Action taken during a context session
 */
export interface ContextAction {
  /** Timestamp when the action was taken */
  timestamp: string;
  /** Description of the action */
  description: string;
}

/**
 * Information about a file change
 */
export interface FileChange {
  /** Path to the file */
  path: string;
  /** Description of the change or file */
  description: string;
}

/**
 * A technical decision recorded in the context
 */
export interface TechnicalDecision {
  /** Category of the decision */
  category: string;
  /** Description of the decision */
  description: string;
  /** Reasoning behind the decision */
  reasoning: string;
}

/**
 * A problem and its solution
 */
export interface ProblemSolution {
  /** Description of the problem */
  problem: string;
  /** Solution applied */
  solution: string;
  /** Impact of the solution */
  impact: string;
}

/**
 * Notes for continuing work in a future session
 */
export interface ContinuationNote {
  /** Type of note */
  type: 'focus' | 'remember' | 'avoid';
  /** Content of the note */
  content: string;
}

/**
 * Reference to a code file
 */
export interface CodeReference {
  /** Path to the file */
  filePath: string;
  /** Description of the file or changes */
  description: string;
  /** Timestamp when the reference was created */
  timestamp: string;
}

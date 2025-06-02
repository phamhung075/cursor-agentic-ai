import { AgentConfig, AgentType, PermissionLevel } from './types';

/**
 * Default configurations for each agent type
 */
export const DEFAULT_CONFIGURATIONS: Record<AgentType, AgentConfig> = {
  [AgentType.RULE_INTERPRETER]: {
    id: 'rule-interpreter',
    type: AgentType.RULE_INTERPRETER,
    permissionLevel: PermissionLevel.READ_ONLY,
    capabilities: [
      'parse-rule-files',
      'validate-rule-compliance',
      'suggest-rule-based-improvements'
    ],
    triggers: [
      {
        type: 'file-pattern',
        pattern: '**/*.{ts,js,tsx,jsx,md,mdc}',
        priority: 3
      },
      {
        type: 'command',
        pattern: 'check-rules',
        priority: 1
      }
    ]
  },

  [AgentType.CONTEXT_MANAGER]: {
    id: 'context-manager',
    type: AgentType.CONTEXT_MANAGER,
    permissionLevel: PermissionLevel.CONTEXT_UPDATE,
    capabilities: [
      'create-context-files',
      'update-context-metadata',
      'track-tool-calls',
      'manage-sessions',
      'record-decisions'
    ],
    triggers: [
      {
        type: 'event',
        pattern: 'session-start',
        priority: 1
      },
      {
        type: 'event',
        pattern: 'tool-call-complete',
        priority: 2
      },
      {
        type: 'schedule',
        pattern: '*/5 * * * *', // Every 5 minutes
        priority: 5
      }
    ]
  },

  [AgentType.TASK_MANAGER]: {
    id: 'task-manager',
    type: AgentType.TASK_MANAGER,
    permissionLevel: PermissionLevel.CONTEXT_UPDATE,
    capabilities: [
      'read-task-files',
      'update-task-status',
      'expand-tasks',
      'manage-dependencies',
      'suggest-next-tasks'
    ],
    triggers: [
      {
        type: 'command',
        pattern: 'next-task',
        priority: 1
      },
      {
        type: 'event',
        pattern: 'task-status-change',
        priority: 2
      },
      {
        type: 'event',
        pattern: 'session-start',
        priority: 3
      }
    ]
  },

  [AgentType.CODE_GENERATOR]: {
    id: 'code-generator',
    type: AgentType.CODE_GENERATOR,
    permissionLevel: PermissionLevel.CODE_MODIFICATION,
    capabilities: [
      'generate-boilerplate',
      'implement-interfaces',
      'create-unit-tests',
      'refactor-code',
      'optimize-performance'
    ],
    triggers: [
      {
        type: 'command',
        pattern: 'generate-code',
        priority: 1
      },
      {
        type: 'file-pattern',
        pattern: '**/interfaces/*.ts',
        priority: 3
      },
      {
        type: 'event',
        pattern: 'implement-request',
        priority: 2
      }
    ]
  },

  [AgentType.REVIEW]: {
    id: 'review',
    type: AgentType.REVIEW,
    permissionLevel: PermissionLevel.READ_ONLY,
    capabilities: [
      'lint-code',
      'review-changes',
      'suggest-improvements',
      'check-performance',
      'verify-security'
    ],
    triggers: [
      {
        type: 'command',
        pattern: 'review-code',
        priority: 1
      },
      {
        type: 'event',
        pattern: 'pre-commit',
        priority: 2
      },
      {
        type: 'event',
        pattern: 'file-saved',
        priority: 3
      }
    ]
  }
};

/**
 * Creates a new agent configuration with default values
 * @param agentType Type of agent to create configuration for
 * @param id Optional custom ID for the agent
 * @returns A new agent configuration with default values
 */
export function createDefaultConfig(agentType: AgentType, id?: string): AgentConfig {
  const defaultConfig = DEFAULT_CONFIGURATIONS[agentType];

  return {
    ...defaultConfig,
    id: id || defaultConfig.id
  };
}

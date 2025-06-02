import { ContextFile, ContextStatus, ContextSession, TechnicalDecision, ProblemSolution, ContinuationNote } from '../../common/types';

/**
 * Provides standard templates for context files
 */
export class ContextTemplates {
  /**
   * Creates a basic context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file
   */
  public static createBasicTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();

    return {
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
          actions: ['Started analysis of task requirements'],
          filesCreated: [],
          filesModified: [],
          commands: [],
          decisions: []
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
      ]
    };
  }

  /**
   * Creates a development context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for development tasks
   */
  public static createDevelopmentTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      nextSteps: [
        'Understand existing codebase structure',
        'Identify required components/modules',
        'Plan implementation approach',
        'Implement core functionality',
        'Add tests for validation',
        'Document implementation details'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Maintain code style consistency with existing codebase'
        },
        {
          type: 'remember',
          content: 'Consider performance implications of implementation choices'
        },
        {
          type: 'avoid',
          content: 'Do not introduce unnecessary dependencies'
        }
      ]
    };
  }

  /**
   * Creates a bug fix context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for bug fix tasks
   */
  public static createBugFixTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      status: {
        phase: 'Analysis',
        progress: '0% - Starting bug investigation',
        nextAction: 'Reproduce the issue and identify root cause'
      },
      nextSteps: [
        'Reproduce the reported issue',
        'Identify the root cause',
        'Develop a fix strategy',
        'Implement and test the fix',
        'Ensure no regressions'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Find the root cause, not just symptoms'
        },
        {
          type: 'remember',
          content: 'Document the underlying issue for future reference'
        },
        {
          type: 'avoid',
          content: 'Quick fixes that might introduce new issues'
        }
      ]
    };
  }

  /**
   * Creates a research context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for research tasks
   */
  public static createResearchTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      status: {
        phase: 'Analysis',
        progress: '0% - Initiating research',
        nextAction: 'Define research questions and investigation approach'
      },
      nextSteps: [
        'Define key research questions',
        'Identify information sources',
        'Evaluate alternatives',
        'Document findings',
        'Provide recommendations'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Address the specific research questions'
        },
        {
          type: 'remember',
          content: 'Provide evidence for conclusions'
        },
        {
          type: 'avoid',
          content: 'Unverified assumptions'
        }
      ]
    };
  }

  /**
   * Creates a testing context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for testing tasks
   */
  public static createTestingTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      status: {
        phase: 'Analysis',
        progress: '0% - Planning test approach',
        nextAction: 'Identify test cases and coverage goals'
      },
      nextSteps: [
        'Understand functionality to be tested',
        'Define test cases and coverage goals',
        'Implement test suite',
        'Run tests and document results',
        'Fix failing tests or report issues'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Achieve high test coverage for critical paths'
        },
        {
          type: 'remember',
          content: 'Include edge cases and error handling tests'
        },
        {
          type: 'avoid',
          content: 'Brittle tests that depend on implementation details'
        }
      ]
    };
  }

  /**
   * Creates a documentation context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for documentation tasks
   */
  public static createDocumentationTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      status: {
        phase: 'Analysis',
        progress: '0% - Planning documentation',
        nextAction: 'Outline documentation structure and requirements'
      },
      nextSteps: [
        'Identify documentation requirements',
        'Gather necessary information',
        'Create documentation outline',
        'Write documentation',
        'Review and refine'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Clear, concise explanations with examples'
        },
        {
          type: 'remember',
          content: 'Target audience and their level of expertise'
        },
        {
          type: 'avoid',
          content: 'Overly technical jargon without explanation'
        }
      ]
    };
  }

  /**
   * Creates a refactoring context file template
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @returns Template context file for refactoring tasks
   */
  public static createRefactoringTemplate(taskId: string, taskTitle: string): ContextFile {
    const timestamp = new Date().toISOString();
    const basicTemplate = this.createBasicTemplate(taskId, taskTitle);

    return {
      ...basicTemplate,
      status: {
        phase: 'Analysis',
        progress: '0% - Understanding code to refactor',
        nextAction: 'Analyze current implementation and identify improvement areas'
      },
      nextSteps: [
        'Understand current implementation',
        'Identify issues and improvement opportunities',
        'Plan refactoring approach',
        'Implement refactoring in stages',
        'Verify no functionality changes',
        'Document improvements'
      ],
      continuationNotes: [
        {
          type: 'focus',
          content: 'Maintain behavior while improving code quality'
        },
        {
          type: 'remember',
          content: 'Refactor in small, testable increments'
        },
        {
          type: 'avoid',
          content: 'Changing functionality during refactoring'
        }
      ]
    };
  }

  /**
   * Formats a context file as markdown according to the template spec
   * @param context Context file to format
   * @returns Formatted markdown content
   */
  public static formatContextToMarkdown(context: ContextFile): string {
    let content = `# Context for Task ${context.taskId} - ${context.taskTitle}\n`;
    content += `**Last Updated:** ${context.lastUpdated}\n`;
    content += `**Session:** ${context.session}\n`;
    content += `**Tool Calls Used:** ${context.toolCallsUsed}/25\n\n`;

    // Current Status
    content += `## Current Status\n`;
    content += `- **Phase:** ${context.status.phase}\n`;
    content += `- **Progress:** ${context.status.progress}\n`;
    content += `- **Next Action:** ${context.status.nextAction}\n\n`;

    // What I Did
    content += `## What I Did\n`;
    for (const session of context.sessions) {
      content += `### Session ${session.number} - ${session.timestamp}\n`;

      for (const action of session.actions) {
        content += `- ${action}\n`;
      }

      content += '\n';
    }

    // Code Created/Modified
    content += `## Code Created/Modified\n`;

    if (context.sessions.some(session => session.filesCreated.length > 0)) {
      content += `**Files Created:**\n`;

      for (const session of context.sessions) {
        for (const file of session.filesCreated) {
          content += `- \`${file.path}\` - ${file.description}\n`;
        }
      }

      content += '\n';
    }

    if (context.sessions.some(session => session.filesModified.length > 0)) {
      content += `**Files Modified:**\n`;

      for (const session of context.sessions) {
        for (const file of session.filesModified) {
          content += `- \`${file.path}\` - ${file.description}\n`;
        }
      }

      content += '\n';
    }

    // Technical Decisions
    if (context.technicalDecisions.length > 0) {
      content += `## Technical Decisions Made\n`;

      for (const decision of context.technicalDecisions) {
        content += `- **${decision.category}:** ${decision.description}\n`;
        content += `  - **Reasoning:** ${decision.reasoning}\n`;
      }

      content += '\n';
    }

    // Problems and Solutions
    if (context.problems.length > 0) {
      content += `## Problems Encountered & Solutions\n`;

      for (const problem of context.problems) {
        content += `- **Problem:** ${problem.problem}\n`;
        content += `  - **Solution:** ${problem.solution}\n`;
        content += `  - **Impact:** ${problem.impact}\n`;
      }

      content += '\n';
    }

    // Next Steps
    if (context.nextSteps.length > 0) {
      content += `## Next Steps Priority\n`;

      context.nextSteps.forEach((step, index) => {
        content += `${index + 1}. ${step}\n`;
      });

      content += '\n';
    }

    // Continuation Notes
    if (context.continuationNotes.length > 0) {
      content += `## Notes for Continuation\n`;

      for (const note of context.continuationNotes) {
        content += `- **${note.type === 'focus' ? 'Current Focus' : note.type === 'remember' ? 'Context to Remember' : 'Avoid'}:** ${note.content}\n`;
      }
    }

    return content;
  }

  /**
   * Parses a markdown context file to ContextFile object
   * @param markdown Markdown content to parse
   * @param taskId ID of the task
   * @returns Parsed context file object
   */
  public static parseMarkdownToContext(markdown: string, taskId: string): ContextFile {
    // Extract basic metadata
    const titleMatch = markdown.match(/^# Context for Task .+ - (.+)$/m);
    const taskTitle = titleMatch ? titleMatch[1] : 'Unknown Task';

    const lastUpdatedMatch = markdown.match(/\*\*Last Updated:\*\* (.+)$/m);
    const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toISOString();

    const sessionMatch = markdown.match(/\*\*Session:\*\* (\d+)$/m);
    const session = sessionMatch ? parseInt(sessionMatch[1], 10) : 1;

    const toolCallsMatch = markdown.match(/\*\*Tool Calls Used:\*\* (\d+)\/\d+$/m);
    const toolCallsUsed = toolCallsMatch ? parseInt(toolCallsMatch[1], 10) : 0;

    // Extract status
    const phaseMatch = markdown.match(/\*\*Phase:\*\* (.+)$/m);
    const progressMatch = markdown.match(/\*\*Progress:\*\* (.+)$/m);
    const nextActionMatch = markdown.match(/\*\*Next Action:\*\* (.+)$/m);

    const status: ContextStatus = {
      phase: (phaseMatch ? phaseMatch[1] : 'Analysis') as any,
      progress: progressMatch ? progressMatch[1] : '0% - Not started',
      nextAction: nextActionMatch ? nextActionMatch[1] : 'Begin task analysis'
    };

    // Parse session data
    const sessions: ContextSession[] = [];
    const sessionRegex = /### Session (\d+) - (.+?)\n([\s\S]*?)(?=###|$)/g;
    let sessionMatchResult;

    while ((sessionMatchResult = sessionRegex.exec(markdown)) !== null) {
      const sessionNumber = parseInt(sessionMatchResult[1], 10);
      const sessionTimestamp = sessionMatchResult[2];
      const sessionContent = sessionMatchResult[3].trim();

      // Parse actions
      const actions = sessionContent
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2));

      sessions.push({
        number: sessionNumber,
        timestamp: sessionTimestamp,
        actions,
        filesCreated: [],
        filesModified: [],
        commands: [],
        decisions: []
      });
    }

    // If no sessions were found, create a default one
    if (sessions.length === 0) {
      sessions.push({
        number: 1,
        timestamp: lastUpdated,
        actions: ['Session data not found'],
        filesCreated: [],
        filesModified: [],
        commands: [],
        decisions: []
      });
    }

    // Parse technical decisions (simple version)
    const technicalDecisions: TechnicalDecision[] = [];
    const decisionsMatch = markdown.match(/## Technical Decisions Made\n([\s\S]*?)(?=##|$)/);
    if (decisionsMatch) {
      const decisionsContent = decisionsMatch[1];
      const decisionRegex = /- \*\*(.+?):\*\* (.+?)\n\s+- \*\*Reasoning:\*\* (.+?)(?=\n-|\n\n|$)/g;
      let decisionMatch;

      while ((decisionMatch = decisionRegex.exec(decisionsContent)) !== null) {
        technicalDecisions.push({
          category: decisionMatch[1],
          description: decisionMatch[2],
          reasoning: decisionMatch[3]
        });
      }
    }

    // Parse problems and solutions (simple version)
    const problems: ProblemSolution[] = [];
    const problemsMatch = markdown.match(/## Problems Encountered & Solutions\n([\s\S]*?)(?=##|$)/);
    if (problemsMatch) {
      const problemsContent = problemsMatch[1];
      const problemRegex = /- \*\*Problem:\*\* (.+?)\n\s+- \*\*Solution:\*\* (.+?)\n\s+- \*\*Impact:\*\* (.+?)(?=\n-|\n\n|$)/g;
      let problemMatch;

      while ((problemMatch = problemRegex.exec(problemsContent)) !== null) {
        problems.push({
          problem: problemMatch[1],
          solution: problemMatch[2],
          impact: problemMatch[3]
        });
      }
    }

    // Parse next steps
    const nextSteps: string[] = [];
    const nextStepsMatch = markdown.match(/## Next Steps Priority\n([\s\S]*?)(?=##|$)/);
    if (nextStepsMatch) {
      const nextStepsContent = nextStepsMatch[1].trim();
      const stepLines = nextStepsContent.split('\n');
      for (const line of stepLines) {
        const stepMatch = line.match(/\d+\.\s+(.+)/);
        if (stepMatch) {
          nextSteps.push(stepMatch[1]);
        }
      }
    }

    // Parse continuation notes
    const continuationNotes: ContinuationNote[] = [];
    const notesMatch = markdown.match(/## Notes for Continuation\n([\s\S]*?)(?=##|$)/);
    if (notesMatch) {
      const notesContent = notesMatch[1].trim();
      const noteRegex = /- \*\*(Current Focus|Context to Remember|Avoid):\*\* (.+?)(?=\n-|\n\n|$)/g;
      let noteMatch;

      while ((noteMatch = noteRegex.exec(notesContent)) !== null) {
        const typeMap: Record<string, ContinuationNote['type']> = {
          'Current Focus': 'focus',
          'Context to Remember': 'remember',
          'Avoid': 'avoid'
        };

        continuationNotes.push({
          type: typeMap[noteMatch[1]],
          content: noteMatch[2]
        });
      }
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
      continuationNotes
    };
  }
}

// Export example templates
export const EXAMPLE_TEMPLATES = {
  development: './examples/development-context.md',
  bugfix: './examples/bugfix-context.md'
};

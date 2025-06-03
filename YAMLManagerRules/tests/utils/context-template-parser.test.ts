/**
 * Tests for Context Template Parser
 */

import * as fs from 'fs';
import * as path from 'path';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';
import contextTemplateParser from '../../utils/context-template-parser';
import { createMockModule, typedMockFn } from '../../utils/test-utils';
import { ContextData } from '../../models/context-data';

// Define types for the required fs functions
type ReadFileSyncFn = typeof fs.readFileSync;
type ExistsSyncFn = typeof fs.existsSync;
type WriteFileSyncFn = typeof fs.writeFileSync;
type MkdirSyncFn = typeof fs.mkdirSync;

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Mock path.resolve
jest.mock('path', () => {
  const originalModule = jest.requireActual('path');
  return createMockModule(originalModule, {
    resolve: jest.fn().mockImplementation((...args: string[]) => args.join('/'))
  });
});

describe('Context Template Parser', () => {
  // Sample template data
  const yamlTemplate = `---
metadata:
  task_id: ""
  title: ""
  last_updated: ""
current_status:
  phase: ""
  progress_percentage: 0
`;

  const jsonTemplate = `{
  "metadata": {
    "task_id": "",
    "title": "",
    "last_updated": ""
  },
  "current_status": {
    "phase": "",
    "progress_percentage": 0
  }
}`;

  const markdownTemplate = `# Context for Task [TASK_ID] - [TASK_TITLE]
**Last Updated:** [TIMESTAMP]
**Session:** [SESSION_NUMBER]
**Tool Calls Used:** [USED]/[LIMIT]

## Current Status
* **Phase:** [Analysis/Planning/Implementation/Testing/Complete]
* **Progress:** [PERCENTAGE]% - [BRIEF_SUMMARY]
* **Next Action:** [NEXT_ACTION]
`;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock<ReturnType<ReadFileSyncFn>, Parameters<ReadFileSyncFn>>)
      .mockImplementation((filePath: string | number | Buffer | URL, options?: any) => {
        const pathStr = filePath.toString();
        if (pathStr.includes('.yaml')) return yamlTemplate;
        if (pathStr.includes('.json')) return jsonTemplate;
        if (pathStr.includes('.md') || pathStr.includes('.markdown')) return markdownTemplate;
        return '';
      });
  });

  describe('readTemplate', () => {
    test('should read YAML template file correctly', () => {
      const result = contextTemplateParser.readTemplate('yaml', './templates');
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('context-template.yaml'), 'utf-8');
      expect(result).toBe(yamlTemplate);
    });

    test('should read JSON template file correctly', () => {
      const result = contextTemplateParser.readTemplate('json', './templates');
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('context-template.json'), 'utf-8');
      expect(result).toBe(jsonTemplate);
    });

    test('should read Markdown template file correctly', () => {
      const result = contextTemplateParser.readTemplate('markdown', './templates');
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('context-template.markdown'), 'utf-8');
      expect(result).toBe(markdownTemplate);
    });

    test('should throw error if template file not found', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => contextTemplateParser.readTemplate('yaml', './templates')).toThrow('Template file not found');
    });
  });

  describe('parseTemplate', () => {
    test('should parse YAML template with data correctly', () => {
      const data: Partial<ContextData> = {
        metadata: {
          task_id: '123',
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      // Mock yaml.load and yaml.dump
      const mockYaml = require('js-yaml');
      mockYaml.load = jest.fn().mockReturnValue({
        metadata: { task_id: '', title: '', last_updated: '' },
        current_status: { phase: '', progress_percentage: 0 }
      });
      mockYaml.dump = jest.fn().mockReturnValue('yaml content');

      const result = contextTemplateParser.parseTemplate(yamlTemplate, data, 'yaml');

      expect(mockYaml.load).toHaveBeenCalledWith(yamlTemplate);
      expect(mockYaml.dump).toHaveBeenCalled();
      expect(result).toBe('yaml content');
    });

    test('should parse JSON template with data correctly', () => {
      const data: Partial<ContextData> = {
        metadata: {
          task_id: '123',
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      const result = contextTemplateParser.parseTemplate(jsonTemplate, data, 'json');

      // Verify the result contains the merged data
      const parsedResult = JSON.parse(result);
      expect(parsedResult.metadata.task_id).toBe('123');
      expect(parsedResult.metadata.title).toBe('Test Task');
      expect(parsedResult.current_status.phase).toBe('Implementation');
      expect(parsedResult.current_status.progress_percentage).toBe(50);
    });

    test('should parse Markdown template with data correctly', () => {
      const data: Partial<ContextData> = {
        metadata: {
          task_id: '123',
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      const result = contextTemplateParser.parseTemplate(markdownTemplate, data, 'markdown');

      // Verify the result contains the placeholders replaced with data
      expect(result).toContain('# Context for Task 123 - Test Task');
      expect(result).toContain('**Last Updated:** 2025-06-02T12:00:00Z');
      expect(result).toContain('**Session:** 1');
      expect(result).toContain('**Tool Calls Used:** 5/25');
      expect(result).toContain('* **Phase:** Implementation');
      expect(result).toContain('* **Progress:** 50% - Halfway done');
      expect(result).toContain('* **Next Action:** Finish implementation');
    });

    test('should throw error for unsupported template format', () => {
      expect(() => contextTemplateParser.parseTemplate('', {}, 'txt' as any)).toThrow('Unsupported template format');
    });
  });

  describe('generateContextFile', () => {
    test('should generate context file with YAML format', () => {
      const data: Partial<ContextData> = {
        metadata: {
          task_id: '123',
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      const result = contextTemplateParser.generateContextFile(data, { format: 'yaml', outputPath: './contexts' });

      expect(fs.existsSync).toHaveBeenCalledWith('./contexts');
      expect(fs.mkdirSync).not.toHaveBeenCalled(); // Directory exists, so mkdir not called
      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('context_123.yaml'), expect.any(String), 'utf-8');
      expect(result).toContain('context_123.yaml');
    });

    test('should create directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const data: Partial<ContextData> = {
        metadata: {
          task_id: '123',
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      contextTemplateParser.generateContextFile(data, { outputPath: './new-contexts' });

      expect(fs.existsSync).toHaveBeenCalledWith('./new-contexts');
      expect(fs.mkdirSync).toHaveBeenCalledWith('./new-contexts', { recursive: true });
    });
  });

  describe('updateContextFile', () => {
    test('should generate new file if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const data: Partial<ContextData> = {
        metadata: {
          title: 'Test Task',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      const result = contextTemplateParser.updateContextFile('123', data);

      // Should call generateContextFile
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toContain('context_123');
    });

    test('should update existing YAML file', () => {
      const existingContent = `---
metadata:
  task_id: "123"
  title: "Old Title"
current_status:
  phase: "Analysis"
  progress_percentage: 20
`;

      (fs.readFileSync as jest.Mock).mockReturnValue(existingContent);

      const data: Partial<ContextData> = {
        metadata: {
          title: 'New Title',
          last_updated: '2025-06-02T12:00:00Z',
          session: 1,
          tool_calls_used: 5,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        }
      };

      const result = contextTemplateParser.updateContextFile('123', data, { format: 'yaml' });

      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('context_123.yaml'), 'utf-8');
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toContain('context_123.yaml');
    });

    test('should update existing Markdown file', () => {
      const existingContent = `# Context for Task 123 - Old Title
**Last Updated:** 2025-06-01T12:00:00Z
**Session:** 1
**Tool Calls Used:** 3/25

## Current Status
* **Phase:** Analysis
* **Progress:** 20% - Started
* **Next Action:** Continue planning
`;

      (fs.readFileSync as jest.Mock).mockReturnValue(existingContent);

      const data: Partial<ContextData> = {
        metadata: {
          title: 'New Title',
          last_updated: '2025-06-02T12:00:00Z',
          session: 2,
          tool_calls_used: 8,
          tool_calls_limit: 25
        },
        current_status: {
          phase: 'Implementation',
          progress_percentage: 50,
          progress_summary: 'Halfway done',
          next_action: 'Finish implementation'
        },
        session_history: [
          {
            timestamp: '2025-06-02T12:00:00Z',
            session_number: 2,
            actions: [
              {
                description: 'Created test files',
                type: 'file_created',
                details: 'Test details'
              }
            ]
          }
        ]
      };

      const result = contextTemplateParser.updateContextFile('123', data, { format: 'markdown' });

      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('context_123.markdown'), 'utf-8');
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Verify the writtenContent contains updated metadata and status
      const writtenContent = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
      expect(writtenContent).toContain('**Last Updated:** 2025-06-02T12:00:00Z');
      expect(writtenContent).toContain('**Session:** 2');
      expect(writtenContent).toContain('**Tool Calls Used:** 8/25');
      expect(writtenContent).toContain('* **Phase:** Implementation');
      expect(writtenContent).toContain('* **Progress:** 50% - Halfway done');
      expect(writtenContent).toContain('* **Next Action:** Finish implementation');
      expect(writtenContent).toContain('### Session 2 -');
      expect(writtenContent).toContain('- Created test files');

      expect(result).toContain('context_123.markdown');
    });
  });
});

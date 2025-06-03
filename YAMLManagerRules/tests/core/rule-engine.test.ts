/**
 * Tests for Rule Engine
 */

import * as fs from 'fs';
import * as path from 'path';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';
import { RuleEngine } from '../../core/rule-engine';
import { Rule } from '../../models/rule-schema';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn()
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  resolve: jest.fn().mockImplementation((...args) => args.join('/'))
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../core/rule-parser', () => ({
  parseRuleFile: jest.fn(),
  loadRulesFromDirectory: jest.fn(),
  saveRuleToFile: jest.fn()
}));

jest.mock('../../core/rule-interpreter', () => ({
  findMatchingRules: jest.fn(),
  generateConfiguration: jest.fn()
}));

import { parseRuleFile, loadRulesFromDirectory, saveRuleToFile } from '../../core/rule-parser';
import { findMatchingRules, generateConfiguration } from '../../core/rule-interpreter';

describe('RuleEngine', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue(['rule1.yaml', 'rule2.yml', 'not-a-rule.txt']);
    (loadRulesFromDirectory as jest.Mock).mockReturnValue([
      { metadata: { id: 'rule1' } },
      { metadata: { id: 'rule2' } }
    ]);
    (parseRuleFile as jest.Mock).mockReturnValue({ metadata: { id: 'rule1' } });
    (findMatchingRules as jest.Mock).mockReturnValue([
      { rule: { metadata: { id: 'rule1' } }, matchScore: 0.8 }
    ]);
    (generateConfiguration as jest.Mock).mockReturnValue({ agent_prompt: 'test prompt' });
    (saveRuleToFile as jest.Mock).mockReturnValue(true);
  });

  test('should initialize with default options', () => {
    const engine = new RuleEngine();
    expect(engine).toBeDefined();
    expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
  });

  test('should load all rules from directory', () => {
    const engine = new RuleEngine({ rulesDir: './test-rules' });
    const rules = engine.loadAllRules();

    expect(loadRulesFromDirectory).toHaveBeenCalledWith('./test-rules', expect.any(Object));
    expect(rules).toHaveLength(2);
  });

  test('should get rule by ID from cache if available', () => {
    const engine = new RuleEngine({ rulesDir: './test-rules' });

    // First call should load from file
    const rule1 = engine.getRule('rule1');
    expect(parseRuleFile).toHaveBeenCalled();
    expect(rule1).toEqual({ metadata: { id: 'rule1' } });

    // Reset mock to verify it's not called again
    jest.clearAllMocks();

    // Second call should use cache
    const rule1Again = engine.getRule('rule1');
    expect(parseRuleFile).not.toHaveBeenCalled();
    expect(rule1Again).toEqual({ metadata: { id: 'rule1' } });
  });

  test('should find rules that match the given context', () => {
    const engine = new RuleEngine();
    const context = { projectPath: '/test', technologies: ['typescript'] };

    const rules = engine.findRules(context);

    expect(loadRulesFromDirectory).toHaveBeenCalled();
    expect(findMatchingRules).toHaveBeenCalledWith(
      expect.any(Array),
      context,
      expect.any(Object)
    );
    expect(rules).toHaveLength(1);
    expect(rules[0].metadata.id).toBe('rule1');
  });

  test('should generate configuration for the given context', () => {
    const engine = new RuleEngine();
    const context = { projectPath: '/test', technologies: ['typescript'] };

    const config = engine.generateConfig(context);

    expect(loadRulesFromDirectory).toHaveBeenCalled();
    expect(generateConfiguration).toHaveBeenCalledWith(
      expect.any(Array),
      context,
      expect.any(Object)
    );
    expect(config).toEqual({ agent_prompt: 'test prompt' });
  });

  test('should save configuration to the output directory', () => {
    const engine = new RuleEngine({ outputDir: './test-output' });
    const config = { agent_prompt: 'test prompt' };

    const result = engine.saveConfig(config, 'test-config.json');

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('test-output/test-config.json'),
      expect.any(String),
      'utf8'
    );
    expect(result).toBe(true);
  });

  test('should add a new rule to the rules directory', () => {
    const engine = new RuleEngine({ rulesDir: './test-rules' });
    const rule: Rule = {
      metadata: { id: 'new-rule', name: 'New Rule' },
      conditions: { technologies: ['typescript'] },
      cursor_rules: { agent_prompt: 'test prompt' }
    };

    const result = engine.addRule(rule);

    expect(saveRuleToFile).toHaveBeenCalledWith(
      rule,
      expect.stringContaining('new-rule.yaml'),
      expect.any(Object)
    );
    expect(result).toBe(true);
  });

  test('should clear the rule cache', () => {
    const engine = new RuleEngine();

    // Load a rule to populate cache
    engine.getRule('rule1');

    // Clear cache and try again
    engine.clearCache();
    jest.clearAllMocks();

    // Should load from file again
    engine.getRule('rule1');
    expect(parseRuleFile).toHaveBeenCalled();
  });

  test('should handle file system errors gracefully', () => {
    (loadRulesFromDirectory as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    const engine = new RuleEngine({ strict: false });
    const rules = engine.loadAllRules();

    expect(rules).toEqual([]);
  });

  test('should throw errors in strict mode', () => {
    (loadRulesFromDirectory as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    const engine = new RuleEngine({ strict: true });

    expect(() => {
      engine.loadAllRules();
    }).toThrow();
  });
});

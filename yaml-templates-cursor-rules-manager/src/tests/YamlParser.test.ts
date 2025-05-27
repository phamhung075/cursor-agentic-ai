import { YamlParser, SchemaOptions } from '../core/YamlParser';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

describe('YamlParser', () => {
  const testDir = resolve(__dirname, '../../test-tmp');
  
  beforeAll(() => {
    // Create test directory if it doesn't exist
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });
  
  describe('parseString', () => {
    test('should parse a valid YAML string', () => {
      const yamlString = `
        name: test
        description: Test configuration
        version: 1.0.0
        items:
          - item1
          - item2
      `;
      
      const result = YamlParser.parseString(yamlString);
      
      expect(result).toEqual({
        name: 'test',
        description: 'Test configuration',
        version: '1.0.0',
        items: ['item1', 'item2']
      });
    });
    
    test('should throw an error for invalid YAML', () => {
      const invalidYaml = `
        name: test
        description: Test configuration
        version: 1.0.0
        items:
          - item1
          - item2
          invalid: # This is missing a value which will cause a parsing error
      `;
      
      expect(() => YamlParser.parseString(invalidYaml)).toThrow();
    });
  });
  
  describe('validate', () => {
    test('should validate a valid object against a schema', () => {
      const data = {
        name: 'test',
        description: 'Test configuration',
        version: '1.0.0',
        items: ['item1', 'item2']
      };
      
      const schema: SchemaOptions = {
        required: ['name', 'items'],
        type: {
          name: 'string',
          description: 'string',
          version: 'string',
          items: ['object']
        }
      };
      
      expect(YamlParser.validate(data, schema)).toBe(true);
    });
    
    test('should throw an error for missing required fields', () => {
      const data = {
        description: 'Test configuration',
        version: '1.0.0',
        items: ['item1', 'item2']
      };
      
      const schema: SchemaOptions = {
        required: ['name', 'items'],
        type: {
          name: 'string',
          description: 'string',
          version: 'string',
          items: ['object']
        }
      };
      
      expect(() => YamlParser.validate(data, schema)).toThrow();
    });
    
    test('should throw an error for invalid field types', () => {
      const data = {
        name: 'test',
        description: 'Test configuration',
        version: 123, // Should be a string
        items: ['item1', 'item2']
      };
      
      const schema: SchemaOptions = {
        required: ['name', 'items'],
        type: {
          name: 'string',
          description: 'string',
          version: 'string',
          items: ['object']
        }
      };
      
      expect(() => YamlParser.validate(data, schema)).toThrow();
    });
    
    test('should validate array items', () => {
      const data = {
        name: 'test',
        items: [
          { id: 1, value: 'item1' },
          { id: 2, value: 'item2' }
        ]
      };
      
      const schema: SchemaOptions = {
        required: ['name', 'items'],
        type: {
          name: 'string',
          items: ['object']
        },
        items: {
          items: {
            properties: {
              id: {
                type: {
                  '*': 'number'
                }
              },
              value: {
                type: {
                  '*': 'string'
                }
              }
            }
          }
        }
      };
      
      expect(YamlParser.validate(data, schema)).toBe(true);
    });
  });
  
  describe('parseFileWithReferences', () => {
    test('should parse a file with references', () => {
      // Create a test file with references
      const mainYaml = `
        name: main
        description: Main configuration
        version: 1.0.0
        ref: $ref(common-description)
        fileContent: $path(nested/content.txt)
      `;
      
      const contentText = 'This is some content from a file';
      
      const mainFilePath = join(testDir, 'main.yaml');
      const nestedDir = join(testDir, 'nested');
      const contentFilePath = join(nestedDir, 'content.txt');
      
      // Create directories and files
      if (!existsSync(nestedDir)) {
        mkdirSync(nestedDir, { recursive: true });
      }
      
      writeFileSync(mainFilePath, mainYaml, 'utf8');
      writeFileSync(contentFilePath, contentText, 'utf8');
      
      // Parse the file with references
      const result = YamlParser.parseFileWithReferences(mainFilePath);
      
      // Check that references were collected
      expect(result.references.has('common-description')).toBe(true);
      expect(result.references.has('nested/content.txt')).toBe(true);
      expect(result.references.get('nested/content.txt')).toBe(contentText);
      
      // Check the parsed data
      expect(result.data).toHaveProperty('name', 'main');
      expect(result.data).toHaveProperty('ref', '$ref:common-description');
      expect(result.data).toHaveProperty('fileContent', '$path:nested/content.txt');
    });
  });
  
  describe('resolveReferences', () => {
    test('should resolve references in an object', () => {
      const obj = {
        name: 'test',
        description: '$ref:common-description',
        content: '$path:content.txt',
        nested: {
          value: '$ref:nested-value'
        },
        items: [
          '$ref:item1',
          '$ref:item2'
        ]
      };
      
      const references = new Map<string, any>([
        ['common-description', 'This is a common description'],
        ['content.txt', 'This is content from a file'],
        ['nested-value', 'This is a nested value'],
        ['item1', 'Item 1 value'],
        ['item2', 'Item 2 value']
      ]);
      
      const resolved = YamlParser.resolveReferences(obj, references);
      
      expect(resolved).toEqual({
        name: 'test',
        description: 'This is a common description',
        content: 'This is content from a file',
        nested: {
          value: 'This is a nested value'
        },
        items: [
          'Item 1 value',
          'Item 2 value'
        ]
      });
    });
  });
  
  describe('toYaml', () => {
    test('should convert an object to YAML string', () => {
      const obj = {
        name: 'test',
        description: 'Test configuration',
        version: '1.0.0',
        items: ['item1', 'item2']
      };
      
      const yamlString = YamlParser.toYaml(obj);
      
      // Parse the YAML string back to an object to verify
      const parsed = YamlParser.parseString(yamlString);
      
      expect(parsed).toEqual(obj);
    });
  });
}); 
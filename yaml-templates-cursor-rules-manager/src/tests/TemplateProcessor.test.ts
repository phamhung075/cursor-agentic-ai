import { TemplateProcessor, RenderOptions } from '../core/TemplateProcessor';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

describe('TemplateProcessor', () => {
  const testDir = resolve(__dirname, '../../test-tmp');
  const templateDir = join(testDir, 'templates');
  const partialsDir = join(testDir, 'partials');
  
  // Create processor instance
  let processor: TemplateProcessor;
  
  beforeAll(() => {
    // Create test directories
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    
    if (!existsSync(templateDir)) {
      mkdirSync(templateDir, { recursive: true });
    }
    
    if (!existsSync(partialsDir)) {
      mkdirSync(partialsDir, { recursive: true });
    }
    
    // Create test templates
    writeFileSync(
      join(templateDir, 'test.hbs'),
      'Hello, {{name}}!',
      'utf8'
    );
    
    writeFileSync(
      join(partialsDir, 'greeting.hbs'),
      'Welcome to {{place}}!',
      'utf8'
    );
    
    // Create processor
    processor = new TemplateProcessor(templateDir);
    
    // Load partials for tests
    processor.loadPartialsFromDirectory(partialsDir);
  });
  
  afterAll(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });
  
  describe('loadTemplate', () => {
    test('should load a template from a file', () => {
      const filePath = join(templateDir, 'test.hbs');
      processor.loadTemplate('test-template', filePath);
      
      expect(processor.hasTemplate('test-template')).toBe(true);
    });
    
    test('should throw an error for non-existent file', () => {
      const filePath = join(templateDir, 'non-existent.hbs');
      
      expect(() => processor.loadTemplate('invalid', filePath)).toThrow();
    });
  });
  
  describe('loadTemplateFromString', () => {
    test('should load a template from a string', () => {
      const template = 'Hello, {{name}}!';
      processor.loadTemplateFromString('string-template', template);
      
      expect(processor.hasTemplate('string-template')).toBe(true);
    });
    
    test('should handle templates with namespaces', () => {
      const template = 'Test: {{value}}';
      processor.loadTemplateFromString('namespaced', template, { namespace: 'test' });
      
      expect(processor.hasTemplate('test/namespaced')).toBe(true);
    });
  });
  
  describe('render', () => {
    test('should render a template with data', () => {
      const template = 'Hello, {{name}}!';
      processor.loadTemplateFromString('render-test', template);
      
      const result = processor.render('render-test', { name: 'World' });
      
      expect(result).toBe('Hello, World!');
    });
    
    test('should render with a specified template', () => {
      const template1 = 'Template 1: {{value}}';
      const template2 = 'Template 2: {{value}}';
      
      processor.loadTemplateFromString('template1', template1);
      processor.loadTemplateFromString('template2', template2);
      
      const options: RenderOptions = {
        template: 'template2'
      };
      
      const result = processor.render('template1', { value: 'test' }, options);
      
      expect(result).toBe('Template 2: test');
    });
    
    test('should fall back to default template if specified one does not exist', () => {
      const defaultTemplate = 'Default: {{value}}';
      processor.loadTemplateFromString('default', defaultTemplate);
      processor.setDefaultTemplate('default');
      
      const options: RenderOptions = {
        template: 'non-existent'
      };
      
      const result = processor.render('non-existent', { value: 'test' }, options);
      
      expect(result).toBe('Default: test');
    });
  });
  
  describe('partials', () => {
    test('should register and use a partial', () => {
      processor.registerPartial('custom-partial', 'Partial: {{text}}');
      
      const template = 'Main {{> custom-partial}}';
      processor.loadTemplateFromString('with-partial', template);
      
      const result = processor.render('with-partial', { text: 'content' });
      
      expect(result).toBe('Main Partial: content');
    });
    
    test('should register multiple partials', () => {
      const partials = {
        'partial1': 'P1: {{a}}',
        'partial2': 'P2: {{b}}'
      };
      
      processor.registerPartials(partials);
      
      const template = '{{> partial1}} and {{> partial2}}';
      processor.loadTemplateFromString('multi-partial', template);
      
      const result = processor.render('multi-partial', { a: 'A', b: 'B' });
      
      expect(result).toBe('P1: A and P2: B');
    });
    
    test('should load partials from directory', () => {
      // Create a test template that uses the greeting partial
      const template = 'Hello! {{> greeting}}';
      processor.loadTemplateFromString('with-file-partial', template);
      
      const result = processor.render('with-file-partial', { place: 'Earth' });
      
      expect(result).toBe('Hello! Welcome to Earth!');
    });
    
    test('should use temporary partials for a single render', () => {
      const template = 'Main {{> temp-partial}}';
      processor.loadTemplateFromString('temp-partial-test', template);
      
      const options: RenderOptions = {
        partials: {
          'temp-partial': 'Temporary: {{value}}'
        }
      };
      
      const result = processor.render('temp-partial-test', { value: 'value' }, options);
      
      expect(result).toBe('Main Temporary: value');
      
      // The partial should not be registered permanently
      // Instead of expecting the render to fail, check if the partial exists
      expect(processor.hasPartial('temp-partial')).toBe(false);
    });
  });
  
  describe('static renderString', () => {
    test('should render a template string directly', () => {
      const template = 'Static {{value}}';
      const result = TemplateProcessor.renderString(template, { value: 'test' });
      
      expect(result).toBe('Static test');
    });
    
    test('should use provided helpers and partials', () => {
      const template = '{{helper}} {{> staticPartial}}';
      
      const options: RenderOptions = {
        helpers: {
          helper: () => 'Helper result'
        },
        partials: {
          staticPartial: 'Partial content: {{value}}'
        }
      };
      
      const result = TemplateProcessor.renderString(template, { value: 'test' }, options);
      
      expect(result).toBe('Helper result Partial content: test');
    });
  });
}); 
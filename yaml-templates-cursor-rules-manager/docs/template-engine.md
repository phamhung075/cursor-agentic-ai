# Handlebars Template Engine Integration

The Handlebars Template Engine Integration is a core component of the YAML Templates Cursor Rules Manager, responsible for transforming YAML configurations into MDC files using customizable templates.

## Features

- **Template Management**: Load and manage templates from files or strings
- **Partial Support**: Use template partials for reusable components
- **Custom Helpers**: Extended Handlebars with MDC-specific formatting helpers
- **Conditional Rendering**: Advanced conditional and comparison helpers
- **Dynamic Paths**: Automatic directory creation and path resolution
- **Template Inheritance**: Support for template overrides and fallbacks

## Template Structure

Templates are Handlebars (.hbs) files that define how YAML configurations are rendered into MDC files. The system supports:

1. **Full Templates**: Complete MDC file templates
2. **Partials**: Reusable template components
3. **Template Overrides**: Project-specific customizations

## Using Templates

Templates can be used in several ways:

```typescript
import { TemplateProcessor } from './core/TemplateProcessor';

// Create processor with template directory
const processor = new TemplateProcessor('path/to/templates');

// Load a template
processor.loadTemplate('rule', 'path/to/template.hbs');

// Register a partial
processor.registerPartial('header', '# {{title}}');

// Render a template
const result = processor.render('rule', {
  title: 'My Rule',
  description: 'This is a rule'
});

// Render to file
processor.renderToFile('rule', data, 'output/rule.mdc');
```

## Custom Helpers

The template engine includes many custom helpers specifically designed for MDC file generation:

### MDC-specific Formatting

- `mdBold`: Format text as markdown bold (`**text**`)
- `mdItalic`: Format text as markdown italic (`*text*`)
- `mdCode`: Format text as inline code (`` `code` ``)
- `mdCodeBlock`: Format text as a code block with language
- `mdLink`: Create a markdown link
- `mdcLink`: Create an MDC-specific link
- `mdList`: Create a markdown bullet list
- `mdNumberedList`: Create a markdown numbered list

### Structural Helpers

- `mdcHeader`: Generate an MDC header with frontmatter
- `mdcSection`: Create a properly formatted MDC section
- `mdcCodeExample`: Create a code example with "DO" and "DON'T" sections

### String Formatting

- `titleCase`: Convert string to Title Case
- `camelCase`: Convert string to camelCase
- `kebabCase`: Convert string to kebab-case
- `snakeCase`: Convert string to snake_case

### Conditional Logic

- Comparison: `eq`, `neq`, `lt`, `gt`, `lte`, `gte`
- Logical: `and`, `or`, `not`
- Type checking: `isString`, `isArray`, `isObject`, `isNumber`, `isBoolean`

### Collection Manipulation

- `json`: Stringify an object as JSON
- `get`: Get a property from an object
- `keys`, `values`, `entries`: Work with object properties
- `join`: Join array items with a separator
- `concat`: Concatenate multiple strings

## Template Partials

Partials provide a way to create reusable template components. The system includes several built-in partials:

- `header.hbs`: Standard MDC header with frontmatter
- `section.hbs`: Section formatting with proper markdown structure
- `code-example.hbs`: Code examples with "DO" and "DON'T" sections
- `footer.hbs`: Standard MDC footer with generation information

## Example Templates

### Basic MDC Template

```handlebars
---
description: {{rule.description}}
globs: {{#each rule.globs}}{{#unless @first}}, {{/unless}}{{this}}{{/each}}
---

# {{name}}

{{rule.description}}

{{#each rule.content as |content sectionName|}}
## {{titleCase sectionName}}

{{#each content as |item|}}
- {{item}}
{{/each}}
{{/each}}
```

### Template with Partials

```handlebars
{{> header}}

{{#if rule.content}}
  {{#each rule.content as |content sectionName|}}
    {{> section sectionName=sectionName content=content}}
  {{/each}}
{{/if}}

{{#if rule.examples}}
  {{#each rule.examples as |example|}}
    {{> code-example example}}
  {{/each}}
{{/if}}

{{> footer}}
```

## Template Inheritance

Templates can be extended or overridden using the configuration system. Each rule can specify which template to use, and templates can use partials that can be overridden at different levels (organization, team, project).

## Integration with YAML Configuration

The template engine is fully integrated with the YAML configuration system:

1. YAML files define the content structure
2. Templates define how that content is rendered
3. The synchronization system ensures changes are propagated

This separation of concerns allows for maximum flexibility and customization. 
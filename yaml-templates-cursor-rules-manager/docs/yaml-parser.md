# YAML Configuration Parser

The YAML Configuration Parser is a core component of the YAML Templates Cursor Rules Manager. It provides advanced parsing, validation, and reference handling capabilities for YAML configuration files.

## Features

- **Schema Validation**: Validate YAML files against defined schemas with detailed error reporting
- **Reference Resolution**: Support for references between configuration files and external content
- **Inheritance Support**: Enable configuration inheritance through the `extends` field
- **Type Checking**: Comprehensive type validation for configuration values
- **Custom Validators**: Define custom validation functions for complex validation requirements

## Usage

### Parsing YAML Files

```typescript
import { YamlParser } from '../core/YamlParser';

// Parse a YAML file
const config = YamlParser.parseFile<ConfigFile>('path/to/config.yaml');

// Parse a YAML string
const yamlString = `
name: example
description: Example configuration
version: 1.0.0
`;
const config = YamlParser.parseString(yamlString);
```

### Schema Validation

```typescript
import { YamlParser, SchemaOptions } from '../core/YamlParser';

// Define a schema
const schema: SchemaOptions = {
  required: ['name', 'version'],
  type: {
    name: 'string',
    description: 'string',
    version: 'string',
    rules: 'object'
  },
  properties: {
    rules: {
      // Nested schema for rules
    }
  }
};

// Validate a configuration against the schema
try {
  YamlParser.validate(config, schema);
  console.log('Configuration is valid');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Reference Handling

The parser supports two types of references:

1. **Internal References** using `$ref(key)` syntax
2. **External File References** using `$path(file/path)` syntax

```yaml
# Example with references
name: main-config
description: Main configuration
sharedStyles: $ref(common-styles)
externalContent: $path(content/external.txt)
```

To parse and resolve references:

```typescript
import { YamlParser } from '../core/YamlParser';

// Parse with reference resolution
const result = YamlParser.parseFileWithReferences('path/to/config.yaml');

// Access parsed data and references
const { data, references } = result;

// Resolve references in the data
const resolvedData = YamlParser.resolveReferences(data, references);
```

## Configuration Inheritance

The ConfigManager uses the YAML Parser to implement configuration inheritance:

```yaml
# parent.yaml
name: parent
rules:
  rule1:
    description: Rule 1
    content: Rule 1 content

# child.yaml
name: child
extends:
  - parent
rules:
  rule2:
    description: Rule 2
    content: Rule 2 content
```

When loaded through the ConfigManager, the child configuration will inherit all rules from the parent, allowing for the creation of hierarchical configurations.

## Schema Options

The `SchemaOptions` interface supports the following validation options:

- `required`: Array of required field names
- `type`: Record mapping field names to expected types
- `validate`: Custom validation functions for specific fields
- `properties`: Nested schema options for object properties
- `items`: Schema options for array items
- `minItems` / `maxItems`: Constraints for array length
- `pattern`: RegExp patterns for string validation
- `enum`: Allowed values for specific fields

## Error Handling

Validation errors provide detailed information about the failure:

```
Validation failed:
root.name: Missing required field
root.rules.rule1.description: Should be of type string, got number
root.templates[0]: Should match pattern: /^[a-z0-9-]+$/
```

This detailed error reporting helps identify and fix configuration issues quickly. 
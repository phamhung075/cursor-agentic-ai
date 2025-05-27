# YAML Templates Cursor Rules Manager

A YAML-based configuration management system with inheritance support for managing Cursor rules and templates.

## Features

- **Configuration Inheritance System**: Support for organization, team, and project-level configurations with inheritance
- **Conflict Resolution**: Automatic detection and resolution of conflicts between configuration levels
- **Reference Resolution**: Cross-references between different configurations
- **Validation Layer**: Schema validation for configurations
- **Override Mechanisms**: Explicit property overriding with special syntax

## Installation

```bash
npm install yaml-templates-cursor-rules-manager
```

## Usage

```typescript
import { 
  ConfigurationInheritanceSystem, 
  ConfigLevel, 
  MergeStrategy 
} from 'yaml-templates-cursor-rules-manager';

// Initialize the system
const configSystem = new ConfigurationInheritanceSystem('./configs');
configSystem.initialize();

// Process a configuration with inheritance
const processedConfig = configSystem.processConfiguration('my-project-config');
if (processedConfig) {
  console.log('Processed configuration:', processedConfig);
}
```

## Configuration Structure

Configurations are defined in YAML files with the following structure:

```yaml
name: my-project-config
level: project
extends:
  - team-config
  - organization-config

# Custom content
rules:
  my-rule:
    description: "My custom rule"
    globs: ["src/**/*.ts"]
    alwaysApply: true
```

## Inheritance Model

The system supports three levels of configuration with increasing specificity:

1. **Organization**: Base-level configurations
2. **Team**: Team-specific configurations that inherit from organization
3. **Project**: Project-specific configurations that inherit from team and organization

The inheritance order is as follows:
- Project overrides Team
- Team overrides Organization

## Override Directives

You can use special syntax to control how values are merged:

```yaml
array_property:
  strategy: append
  value: 
    - new item 1
    - new item 2
```

Supported strategies:
- `replace`: Completely replace the inherited value
- `extend`: Add to the existing value (for arrays/objects)
- `merge`: Recursively merge objects
- `prepend`: Add to the beginning (for arrays)
- `append`: Add to the end (for arrays)

## Cross-References

Reference other configurations using the syntax:

```yaml
# Reference another configuration
referenced_value: ${config:other-config.path.to.property}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

## License

MIT 
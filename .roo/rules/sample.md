---
description:
globs:
alwaysApply: false
---
# Sample Rule

This is a sample rule used for benchmark testing. It applies to TypeScript files outside of node_modules and dist directories.

## Best Practices

- Keep functions small and focused
- Use TypeScript types
- Follow consistent naming conventions

## Examples

```typescript
// ✅ DO: Use strong typing
function processUser(user: User): void {
  // ...
}

// ❌ DON'T: Use any
function processUser(user: any): void {
  // ...
}
```

---
description: 
globs: 
alwaysApply: false
---
# JavaScript Best Practices

This rule covers JavaScript best practices in the codebase.

## Conventions

- Use arrow functions for callbacks
- Prefer const over let where possible
- Use destructuring for objects and arrays
- Handle promises properly

## Examples

```javascript
// ✅ DO: Use arrow functions
array.map(item => transformItem(item));

// ❌ DON'T: Use function expressions
array.map(function(item) {
  return transformItem(item);
});
```

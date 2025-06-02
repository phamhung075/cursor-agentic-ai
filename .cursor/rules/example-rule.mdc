---
description:
globs:
alwaysApply: false
---
# TypeScript Coding Standards

This rule defines best practices for TypeScript code in our project.

## Type Safety

- Always use explicit types for function parameters and return types
- Avoid using `any` type whenever possible
- Use interfaces for object shapes rather than inline types
- Prefer union types over inheritance when possible

## Examples

```typescript
// ✅ DO: Use explicit return types
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ DON'T: Use implicit types
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Error Handling

- Use try/catch blocks for async operations
- Return error objects rather than throwing exceptions in utility functions
- Always include error handling for promises

## Component Organization

- Keep components small and focused on a single responsibility
- Extract complex logic into custom hooks
- Use TypeScript interfaces for props

/**
 * Testing utilities for creating type-safe mocks
 */

import { jest } from '@jest/globals';

/**
 * Creates a type-safe mock of a module
 * @param originalModule The actual module to mock
 * @param overrides The mock implementations to override
 */
export function createMockModule<T extends object>(
  originalModule: T,
  overrides: Partial<{[K in keyof T]: jest.Mock}>
): T {
  const result: Partial<T> = {};

  // Add all original properties
  for (const key in originalModule) {
    if (Object.prototype.hasOwnProperty.call(originalModule, key)) {
      result[key] = originalModule[key];
    }
  }

  // Override with mocks
  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      result[key] = overrides[key] as any;
    }
  }

  return result as T;
}

/**
 * Helper to type mock function arguments
 */
export function typedMockFn<T extends (...args: any[]) => any>(): jest.Mock<ReturnType<T>, Parameters<T>> {
  return jest.fn() as jest.Mock<ReturnType<T>, Parameters<T>>;
}

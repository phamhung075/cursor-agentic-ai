/**
 * Testing Framework Module
 * 
 * Comprehensive testing framework for the intelligent task management system
 * including unit tests, integration tests, performance testing, and coverage tracking.
 */

// Core testing components
export { TestRunner } from './TestRunner';
export { MockServiceRegistry } from './MockServiceRegistry';
export { TestDataRegistry } from './TestDataRegistry';
export { AssertionRegistry } from './AssertionRegistry';
export { TestLogger } from './TestLogger';
export { PerformanceTracker } from './PerformanceTracker';
export { CoverageCollector } from './CoverageCollector';

// Re-export testing types
export * from '../../types/TestingTypes'; 
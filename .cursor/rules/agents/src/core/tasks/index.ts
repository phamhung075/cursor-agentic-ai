/**
 * Task Management Module
 * 
 * Core task hierarchy and management system for AI-driven nested task organization.
 */

export { TaskHierarchyEngine } from './TaskHierarchyEngine';
export { TaskManager } from './TaskManager';
export { AITaskDecomposer } from './AITaskDecomposer';
export { AITaskService } from './AITaskService';
export { DynamicPriorityManager } from './DynamicPriorityManager';
export { PriorityService } from './PriorityService';

// Re-export types for convenience
export * from '../../types/TaskTypes'; 
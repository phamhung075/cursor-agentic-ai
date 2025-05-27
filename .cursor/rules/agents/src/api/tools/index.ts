/**
 * Tools Module Index
 * 
 * Exports all tools-related interfaces, classes, and implementations
 */

// Export interfaces
export * from './ITool';

// Export base classes
export { BaseTool } from './BaseTool';

// Export tool manager
export { ToolManager } from './ToolManager';

// Export individual tools
export { CreateTaskTool } from './CreateTaskTool';
export { GetTaskTool } from './GetTaskTool';
export { ListTasksTool } from './ListTasksTool';
export { UpdateTaskTool } from './UpdateTaskTool';
export { DeleteTaskTool } from './DeleteTaskTool';
export { BulkUpdateTaskTool } from './BulkUpdateTaskTool';
export { TaskHierarchyTool } from './TaskHierarchyTool';
export { DecomposeTaskTool } from './DecomposeTaskTool';
export { TaskmasterSyncTool } from './TaskmasterSyncTool';
// Additional tools will be added here as they are implemented 

export {
  BaseTool,
  ITool,
  ToolManager,
  
  // Task-related tools
  CreateTaskTool,
  GetTaskTool,
  ListTasksTool,
  UpdateTaskTool,
  DeleteTaskTool,
  BulkUpdateTaskTool,
  TaskHierarchyTool,
  DecomposeTaskTool,
  TaskmasterSyncTool
}; 
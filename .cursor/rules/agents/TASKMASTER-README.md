# Taskmaster Synchronization

This module provides bidirectional synchronization between the server's task management system and Taskmaster, establishing Taskmaster as the source of truth for task data.

## Components

### 1. TaskmasterSyncTool

A tool for synchronizing tasks between the server and Taskmaster. It provides three sync operations:

- **syncFromTaskmaster**: Imports tasks from Taskmaster into the server
- **syncToTaskmaster**: Exports tasks from the server to Taskmaster
- **bidirectionalSync**: Synchronizes in both directions with conflict resolution

Key features:
- Comprehensive status and priority mapping between systems
- Smart conflict resolution based on update timestamps
- Support for forcing Taskmaster as the source of truth
- Sync lock mechanism to prevent concurrent syncs

### 2. TaskmasterSyncService

An automatic synchronization service that periodically syncs tasks between the server and Taskmaster. Features include:

- File system watching for Taskmaster task file changes
- Configurable sync interval
- Event broadcasting for task updates
- Error handling and retry logic

### 3. SSEServer Integration

The SSEServer has been updated to initialize and use the TaskmasterSyncService, ensuring that:

- Taskmaster sync service is properly started with the server
- Task events are broadcasted to connected clients when synced from Taskmaster
- SynchronizationService is used to handle events from Taskmaster

## Testing

A test script is provided to verify the synchronization functionality:

1. Run `node test-sync.js` to create sample tasks in Taskmaster format
2. Run `node ./dist/test-taskmaster-sync.js` to test the sync functionality 
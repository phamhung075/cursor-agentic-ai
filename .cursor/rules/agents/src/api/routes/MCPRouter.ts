import { Router } from 'express';
import { MCPController } from '../controllers/MCPController';

/**
 * MCP Router Configuration
 */
interface MCPRouterConfig {
  mcpController: MCPController;
}

/**
 * Create MCP Router
 * 
 * Creates and configures the MCP router with all SSE and MCP endpoints.
 */
export function createMCPRouter(config: MCPRouterConfig): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      sessionCount: config.mcpController.getSessionCount?.() || 0,
      protocolVersion: '2024-11-05',
      mcpCompliant: true
    });
  });

  // Main SSE endpoint - MCP Inspector connects here first
  router.get('/sse', config.mcpController.handleSSEConnection.bind(config.mcpController));

  // JSON-RPC message endpoint - receives MCP protocol messages
  router.post('/sse/messages', config.mcpController.handleJSONRPCMessage.bind(config.mcpController));

  // Alternative message endpoint (some implementations use /message)
  router.post('/message', config.mcpController.handleJSONRPCMessage.bind(config.mcpController));

  // Debug endpoint for testing
  router.post('/debug/trigger', config.mcpController.handleDebugTrigger.bind(config.mcpController));

  return router;
} 
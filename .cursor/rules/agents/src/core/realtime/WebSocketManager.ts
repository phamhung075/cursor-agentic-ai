import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  WebSocketConnection,
  WebSocketMessage,
  Subscription,
  SubscriptionChannel,
  UserPresence,
  RealTimeEvent,
  BroadcastOptions,
  RealTimeConfig
} from '../../types/RealTimeTypes';

/**
 * WebSocket Manager
 * 
 * Manages WebSocket connections, subscriptions, and real-time broadcasting
 * for the intelligent task management system.
 */
export class WebSocketManager {
  private io: SocketIOServer;
  private connections: Map<string, WebSocketConnection> = new Map();
  private subscriptions: Map<string, Subscription[]> = new Map();
  private userPresence: Map<string, UserPresence> = new Map();
  private config: RealTimeConfig;
  private isRunning: boolean = false;
  private presenceInterval: NodeJS.Timeout | null = null;

  constructor(io: SocketIOServer, config: RealTimeConfig) {
    this.io = io;
    this.config = config;
    this.setupSocketHandlers();
  }

  /**
   * Start the WebSocket manager
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startPresenceTracking();

    console.log('🔌 WebSocket Manager started');
  }

  /**
   * Stop the WebSocket manager
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.stopPresenceTracking();

    // Disconnect all clients
    for (const [connectionId, connection] of this.connections) {
      connection.socket.disconnect(true);
    }

    this.connections.clear();
    this.subscriptions.clear();
    this.userPresence.clear();

    console.log('🔌 WebSocket Manager stopped');
  }

  /**
   * Broadcast event to connected clients
   */
  public async broadcast(event: RealTimeEvent, options?: BroadcastOptions): Promise<void> {
    if (!this.isRunning) return;

    const message: WebSocketMessage = {
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      messageId: uuidv4(),
      acknowledgment: false
    };

    // Determine target connections
    const targetConnections = this.getTargetConnections(options);

    // Broadcast to target connections
    for (const connection of targetConnections) {
      try {
        // Check if connection is subscribed to relevant channel
        if (options?.channel && !this.isSubscribedToChannel(connection.id, options.channel)) {
          continue;
        }

        connection.socket.emit('realtime_event', message);
        connection.lastActivity = new Date();

      } catch (error) {
        console.error(`Error broadcasting to connection ${connection.id}:`, error);
        // Remove dead connection
        this.removeConnection(connection.id);
      }
    }
  }

  /**
   * Subscribe connection to channel
   */
  public async subscribe(
    connectionId: string, 
    channel: SubscriptionChannel, 
    filters?: Record<string, any>
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const subscription: Subscription = {
      id: uuidv4(),
      connectionId,
      channel,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Add filters if provided
    if (filters) {
      subscription.filters = filters;
    }

    // Add to subscriptions
    if (!this.subscriptions.has(connectionId)) {
      this.subscriptions.set(connectionId, []);
    }
    this.subscriptions.get(connectionId)!.push(subscription);

    // Add to connection subscriptions
    connection.subscriptions.add(channel);

    // Join socket room for efficient broadcasting
    connection.socket.join(channel);

    console.log(`Connection ${connectionId} subscribed to ${channel}`);
  }

  /**
   * Unsubscribe connection from channel
   */
  public async unsubscribe(connectionId: string, channel: SubscriptionChannel): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from subscriptions
    const subscriptions = this.subscriptions.get(connectionId) || [];
    const filteredSubscriptions = subscriptions.filter(sub => sub.channel !== channel);
    this.subscriptions.set(connectionId, filteredSubscriptions);

    // Remove from connection subscriptions
    connection.subscriptions.delete(channel);

    // Leave socket room
    connection.socket.leave(channel);

    console.log(`Connection ${connectionId} unsubscribed from ${channel}`);
  }

  /**
   * Get subscriptions for connection
   */
  public getSubscriptions(connectionId: string): Subscription[] {
    return this.subscriptions.get(connectionId) || [];
  }

  /**
   * Get all active connections
   */
  public getConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection count
   */
  public getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get user presence information
   */
  public getUserPresence(): UserPresence[] {
    return Array.from(this.userPresence.values());
  }

  /**
   * Update user presence
   */
  public updateUserPresence(userId: string, updates: Partial<UserPresence>): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      Object.assign(presence, updates, { lastActivity: new Date().toISOString() });
      
      // Broadcast presence update
      this.broadcast({
        id: uuidv4(),
        type: 'user_joined',
        timestamp: new Date().toISOString(),
        source: 'websocket_manager',
        payload: { user: presence }
      });
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const connectionId = uuidv4();
    const sessionId = (socket.handshake as any).sessionID || uuidv4();
    
    const connection: WebSocketConnection = {
      id: connectionId,
      socket,
      sessionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      metadata: {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      }
    };

    this.connections.set(connectionId, connection);

    console.log(`🔌 New WebSocket connection: ${connectionId}`);

    // Send welcome message
    socket.emit('connected', {
      connectionId,
      sessionId,
      timestamp: new Date().toISOString(),
      message: 'Connected to AAI Real-time System'
    });

    // Setup connection event handlers
    this.setupConnectionHandlers(socket, connection);
  }

  /**
   * Setup handlers for individual connection
   */
  private setupConnectionHandlers(socket: Socket, connection: WebSocketConnection): void {
    // Handle authentication
    socket.on('authenticate', (data) => {
      this.handleAuthentication(connection, data);
    });

    // Handle subscription requests
    socket.on('subscribe', (data) => {
      this.handleSubscription(connection, data);
    });

    // Handle unsubscription requests
    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(connection, data);
    });

    // Handle presence updates
    socket.on('presence_update', (data) => {
      this.handlePresenceUpdate(connection, data);
    });

    // Handle ping for connection health
    socket.on('ping', () => {
      connection.lastActivity = new Date();
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(connection, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for connection ${connection.id}:`, error);
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(connection: WebSocketConnection, data: any): void {
    try {
      // Basic authentication - in production, validate JWT token
      const { userId, token } = data;
      
      if (userId) {
        connection.userId = userId;
        
        // Create or update user presence
        const presence: UserPresence = {
          userId,
          sessionId: connection.sessionId,
          username: data.username,
          status: 'online',
          lastActivity: new Date().toISOString(),
          metadata: data.metadata
        };
        
        this.userPresence.set(userId, presence);
        
        // Broadcast user joined event
        this.broadcast({
          id: uuidv4(),
          type: 'user_joined',
          timestamp: new Date().toISOString(),
          source: 'websocket_manager',
          userId,
          payload: { user: presence }
        });

        connection.socket.emit('authenticated', { 
          success: true, 
          userId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      connection.socket.emit('authentication_error', { 
        error: 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle subscription request
   */
  private handleSubscription(connection: WebSocketConnection, data: any): void {
    try {
      const { channel, filters } = data;
      this.subscribe(connection.id, channel, filters);
      
      connection.socket.emit('subscribed', { 
        channel, 
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      connection.socket.emit('subscription_error', { 
        error: error instanceof Error ? error.message : 'Subscription failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscription(connection: WebSocketConnection, data: any): void {
    try {
      const { channel } = data;
      this.unsubscribe(connection.id, channel);
      
      connection.socket.emit('unsubscribed', { 
        channel, 
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      connection.socket.emit('unsubscription_error', { 
        error: error instanceof Error ? error.message : 'Unsubscription failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(connection: WebSocketConnection, data: any): void {
    if (connection.userId) {
      this.updateUserPresence(connection.userId, data);
    }
  }

  /**
   * Handle connection disconnection
   */
  private handleDisconnection(connection: WebSocketConnection, reason: string): void {
    console.log(`🔌 Connection ${connection.id} disconnected: ${reason}`);

    // Remove user presence if this was their only connection
    if (connection.userId) {
      const userConnections = Array.from(this.connections.values())
        .filter(conn => conn.userId === connection.userId && conn.id !== connection.id);
      
      if (userConnections.length === 0) {
        const presence = this.userPresence.get(connection.userId);
        if (presence) {
          // Broadcast user left event
          this.broadcast({
            id: uuidv4(),
            type: 'user_left',
            timestamp: new Date().toISOString(),
            source: 'websocket_manager',
            userId: connection.userId,
            payload: {
              userId: connection.userId,
              sessionId: connection.sessionId,
              duration: Date.now() - connection.connectedAt.getTime()
            }
          });
          
          this.userPresence.delete(connection.userId);
        }
      }
    }

    this.removeConnection(connection.id);
  }

  /**
   * Remove connection
   */
  private removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    this.subscriptions.delete(connectionId);
  }

  /**
   * Get target connections for broadcasting
   */
  private getTargetConnections(options?: BroadcastOptions): WebSocketConnection[] {
    let connections = Array.from(this.connections.values());

    if (options?.targetUsers) {
      connections = connections.filter(conn => 
        conn.userId && options.targetUsers!.includes(conn.userId)
      );
    }

    if (options?.targetSessions) {
      connections = connections.filter(conn => 
        options.targetSessions!.includes(conn.sessionId)
      );
    }

    if (options?.excludeUser) {
      connections = connections.filter(conn => conn.userId !== options.excludeUser);
    }

    if (options?.excludeSession) {
      connections = connections.filter(conn => conn.sessionId !== options.excludeSession);
    }

    return connections;
  }

  /**
   * Check if connection is subscribed to channel
   */
  private isSubscribedToChannel(connectionId: string, channel: SubscriptionChannel): boolean {
    const connection = this.connections.get(connectionId);
    return connection ? connection.subscriptions.has(channel) : false;
  }

  /**
   * Start presence tracking
   */
  private startPresenceTracking(): void {
    if (!this.config.presence.enabled || this.presenceInterval) return;

    this.presenceInterval = setInterval(() => {
      this.updatePresenceStatus();
    }, this.config.presence.heartbeatInterval || 30000);
  }

  /**
   * Stop presence tracking
   */
  private stopPresenceTracking(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  /**
   * Update presence status for all users
   */
  private updatePresenceStatus(): void {
    const now = Date.now();
    const timeout = this.config.presence.timeoutThreshold || 60000;

    for (const [userId, presence] of this.userPresence) {
      const lastActivity = new Date(presence.lastActivity).getTime();
      
      if (now - lastActivity > timeout) {
        // Mark user as away
        if (presence.status !== 'away') {
          presence.status = 'away';
          presence.lastActivity = new Date().toISOString();
          
          this.broadcast({
            id: uuidv4(),
            type: 'user_joined',
            timestamp: new Date().toISOString(),
            source: 'websocket_manager',
            userId,
            payload: { user: presence }
          });
        }
      }
    }
  }
} 
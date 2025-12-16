/**
 * WebSocket utilities for real-time communication with Django Channels
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketEventHandlers {
  [eventType: string]: (data: any) => void;
}

export interface WebSocketOptions {
  token?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export class BlogWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private debug: boolean;
  private isConnected: boolean = false;
  private subscriptions: Set<string> = new Set();

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.token = options.token || null;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.debug = options.debug || false;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Build WebSocket URL with token if available
        let wsUrl = this.url;
        if (this.token) {
          const separator = wsUrl.includes('?') ? '&' : '?';
          wsUrl += `${separator}token=${this.token}`;
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = (event) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.log('WebSocket connected');
          
          // Subscribe to previously subscribed events
          if (this.subscriptions.size > 0) {
            this.subscribe(Array.from(this.subscriptions));
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            this.log('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.log('WebSocket disconnected:', event.code, event.reason);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.log('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventTypes: string[]): void {
    eventTypes.forEach(eventType => this.subscriptions.add(eventType));
    
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        events: eventTypes
      });
    }
  }

  /**
   * Unsubscribe from specific event types
   */
  unsubscribe(eventTypes: string[]): void {
    eventTypes.forEach(eventType => this.subscriptions.delete(eventType));
    
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        events: eventTypes
      });
    }
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (data: any) => void): void {
    this.eventHandlers[eventType] = handler;
  }

  /**
   * Remove event handler
   */
  off(eventType: string): void {
    delete this.eventHandlers[eventType];
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.token = token;
    // Reconnect with new token if currently connected
    if (this.isConnected) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    this.log('Received message:', data);

    // Handle system messages
    switch (data.type) {
      case 'connection_established':
        this.log('Connection established:', data);
        break;
      case 'pong':
        this.log('Received pong');
        break;
      case 'subscription_confirmed':
        this.log('Subscription confirmed:', data.subscribed_events);
        break;
      case 'unsubscription_confirmed':
        this.log('Unsubscription confirmed:', data.remaining_events);
        break;
      case 'error':
        this.log('Server error:', data.message);
        break;
      default:
        // Handle custom event types
        if (this.eventHandlers[data.type]) {
          this.eventHandlers[data.type](data);
        }
        break;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.log('Max reconnection attempts reached');
        }
      });
    }, this.reconnectInterval);
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[BlogWebSocket]', ...args);
    }
  }
}

export class NotificationWebSocket extends BlogWebSocket {
  private userId: string;

  constructor(userId: string, options: WebSocketOptions = {}) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-domain.com/ws/notifications/' 
      : 'ws://localhost:8000/ws/notifications/';
    
    super(`${baseUrl}${userId}/`, options);
    this.userId = userId;
  }

  /**
   * Mark notifications as read
   */
  markNotificationsRead(notificationIds: string[]): void {
    this.send({
      type: 'mark_read',
      notification_ids: notificationIds
    });
  }
}

/**
 * WebSocket manager for handling multiple connections
 */
export class WebSocketManager {
  private connections: Map<string, BlogWebSocket> = new Map();
  private token: string | null = null;

  /**
   * Set authentication token for all connections
   */
  setToken(token: string): void {
    this.token = token;
    this.connections.forEach(ws => ws.updateToken(token));
  }

  /**
   * Create or get blog WebSocket connection
   */
  getBlogWebSocket(options: WebSocketOptions = {}): BlogWebSocket {
    const key = 'blog';
    
    if (!this.connections.has(key)) {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/ws/blog/' 
        : 'ws://localhost:8000/ws/blog/';
      
      const ws = new BlogWebSocket(baseUrl, {
        ...options,
        token: this.token || options.token
      });
      
      this.connections.set(key, ws);
    }
    
    return this.connections.get(key)!;
  }

  /**
   * Create or get notification WebSocket connection
   */
  getNotificationWebSocket(userId: string, options: WebSocketOptions = {}): NotificationWebSocket {
    const key = `notifications_${userId}`;
    
    if (!this.connections.has(key)) {
      const ws = new NotificationWebSocket(userId, {
        ...options,
        token: this.token || options.token
      });
      
      this.connections.set(key, ws);
    }
    
    return this.connections.get(key) as NotificationWebSocket;
  }

  /**
   * Connect all WebSocket connections
   */
  async connectAll(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(ws => ws.connect());
    await Promise.all(promises);
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll(): void {
    this.connections.forEach(ws => ws.disconnect());
    this.connections.clear();
  }

  /**
   * Get connection status for all connections
   */
  getConnectionStatuses(): Record<string, boolean> {
    const statuses: Record<string, boolean> = {};
    this.connections.forEach((ws, key) => {
      statuses[key] = ws.getConnectionStatus();
    });
    return statuses;
  }
}

// Global WebSocket manager instance
export const wsManager = new WebSocketManager();

// Convenience functions
export const getBlogWebSocket = (options?: WebSocketOptions) => 
  wsManager.getBlogWebSocket(options);

export const getNotificationWebSocket = (userId: string, options?: WebSocketOptions) => 
  wsManager.getNotificationWebSocket(userId, options);

export const setWebSocketToken = (token: string) => 
  wsManager.setToken(token);

export const connectAllWebSockets = () => 
  wsManager.connectAll();

export const disconnectAllWebSockets = () => 
  wsManager.disconnectAll();
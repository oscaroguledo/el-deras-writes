/**
 * React hooks for WebSocket functionality
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BlogWebSocket, NotificationWebSocket, WebSocketMessage, WebSocketOptions } from '../utils/websocket';
import { useAuth } from './useAuth';

export interface UseWebSocketOptions extends WebSocketOptions {
  autoConnect?: boolean;
  subscriptions?: string[];
}

export interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  error: string | null;
}

/**
 * Hook for managing blog WebSocket connection
 */
export const useBlogWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token } = useAuth();
  const wsRef = useRef<BlogWebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    error: null
  });

  const { autoConnect = true, subscriptions = [], ...wsOptions } = options;

  // Initialize WebSocket connection
  useEffect(() => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-domain.com/ws/blog/' 
      : 'ws://localhost:8000/ws/blog/';

    wsRef.current = new BlogWebSocket(baseUrl, {
      ...wsOptions,
      token: token || undefined,
      debug: process.env.NODE_ENV === 'development'
    });

    // Set up event handlers
    wsRef.current.on('connection_established', (data) => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    wsRef.current.on('error', (data) => {
      setState(prev => ({ ...prev, error: data.message }));
    });

    // Generic message handler
    const handleMessage = (data: WebSocketMessage) => {
      setState(prev => ({ ...prev, lastMessage: data }));
    };

    // Set up handlers for all message types
    const messageTypes = [
      'article_created', 'article_updated', 'comment_created', 
      'user_authenticated', 'admin_action', 'content_moderated'
    ];
    
    messageTypes.forEach(type => {
      wsRef.current?.on(type, handleMessage);
    });

    // Auto-connect if enabled
    if (autoConnect) {
      wsRef.current.connect().catch(error => {
        setState(prev => ({ ...prev, error: error.message }));
      });
    }

    // Subscribe to events if specified
    if (subscriptions.length > 0) {
      wsRef.current.subscribe(subscriptions);
    }

    return () => {
      wsRef.current?.disconnect();
    };
  }, [token, autoConnect, JSON.stringify(subscriptions)]);

  // Update token when it changes
  useEffect(() => {
    if (wsRef.current && token) {
      wsRef.current.updateToken(token);
    }
  }, [token]);

  const connect = useCallback(async () => {
    if (wsRef.current) {
      try {
        await wsRef.current.connect();
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      } catch (error) {
        setState(prev => ({ ...prev, error: (error as Error).message }));
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    wsRef.current?.send(message);
  }, []);

  const subscribe = useCallback((eventTypes: string[]) => {
    wsRef.current?.subscribe(eventTypes);
  }, []);

  const unsubscribe = useCallback((eventTypes: string[]) => {
    wsRef.current?.unsubscribe(eventTypes);
  }, []);

  const on = useCallback((eventType: string, handler: (data: any) => void) => {
    wsRef.current?.on(eventType, handler);
  }, []);

  const off = useCallback((eventType: string) => {
    wsRef.current?.off(eventType);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    on,
    off
  };
};

/**
 * Hook for managing notification WebSocket connection
 */
export const useNotificationWebSocket = (userId?: string, options: UseWebSocketOptions = {}) => {
  const { token } = useAuth();
  const wsRef = useRef<NotificationWebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    error: null
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const { autoConnect = true, ...wsOptions } = options;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    wsRef.current = new NotificationWebSocket(userId, {
      ...wsOptions,
      token: token || undefined,
      debug: process.env.NODE_ENV === 'development'
    });

    // Set up event handlers
    wsRef.current.on('connection_established', (data) => {
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    wsRef.current.on('unread_count', (data) => {
      setUnreadCount(data.count);
    });

    wsRef.current.on('notification', (data) => {
      setState(prev => ({ ...prev, lastMessage: data }));
      setUnreadCount(prev => prev + 1);
    });

    wsRef.current.on('notifications_marked_read', (data) => {
      setUnreadCount(prev => Math.max(0, prev - data.count));
    });

    wsRef.current.on('error', (data) => {
      setState(prev => ({ ...prev, error: data.message }));
    });

    // Auto-connect if enabled
    if (autoConnect) {
      wsRef.current.connect().catch(error => {
        setState(prev => ({ ...prev, error: error.message }));
      });
    }

    return () => {
      wsRef.current?.disconnect();
    };
  }, [userId, token, autoConnect]);

  const markNotificationsRead = useCallback((notificationIds: string[]) => {
    wsRef.current?.markNotificationsRead(notificationIds);
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current) {
      try {
        await wsRef.current.connect();
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      } catch (error) {
        setState(prev => ({ ...prev, error: (error as Error).message }));
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  return {
    ...state,
    unreadCount,
    connect,
    disconnect,
    markNotificationsRead
  };
};

/**
 * Hook for handling real-time article updates
 */
export const useRealTimeArticles = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { on, off } = useBlogWebSocket({
    subscriptions: ['article_created', 'article_updated']
  });

  useEffect(() => {
    const handleArticleCreated = (data: any) => {
      setArticles(prev => [data.article, ...prev]);
      setLastUpdate(new Date());
    };

    const handleArticleUpdated = (data: any) => {
      setArticles(prev => 
        prev.map(article => 
          article.id === data.article.id ? { ...article, ...data.article } : article
        )
      );
      setLastUpdate(new Date());
    };

    on('article_created', handleArticleCreated);
    on('article_updated', handleArticleUpdated);

    return () => {
      off('article_created');
      off('article_updated');
    };
  }, [on, off]);

  const updateArticles = useCallback((newArticles: any[]) => {
    setArticles(newArticles);
  }, []);

  return {
    articles,
    lastUpdate,
    updateArticles
  };
};

/**
 * Hook for handling real-time comment updates
 */
export const useRealTimeComments = (articleId?: string) => {
  const [comments, setComments] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { on, off } = useBlogWebSocket({
    subscriptions: ['comment_created']
  });

  useEffect(() => {
    const handleCommentCreated = (data: any) => {
      // Only update if comment is for the current article
      if (!articleId || data.article_id === articleId) {
        setComments(prev => [...prev, data.comment]);
        setLastUpdate(new Date());
      }
    };

    on('comment_created', handleCommentCreated);

    return () => {
      off('comment_created');
    };
  }, [articleId, on, off]);

  const updateComments = useCallback((newComments: any[]) => {
    setComments(newComments);
  }, []);

  return {
    comments,
    lastUpdate,
    updateComments
  };
};

/**
 * Hook for handling admin real-time updates
 */
export const useAdminRealTime = () => {
  const [adminUpdates, setAdminUpdates] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { on, off } = useBlogWebSocket({
    subscriptions: ['admin_action', 'content_moderated']
  });

  useEffect(() => {
    const handleAdminAction = (data: any) => {
      setAdminUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
      setLastUpdate(new Date());
    };

    const handleContentModerated = (data: any) => {
      setAdminUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
      setLastUpdate(new Date());
    };

    on('admin_action', handleAdminAction);
    on('content_moderated', handleContentModerated);

    return () => {
      off('admin_action');
      off('content_moderated');
    };
  }, [on, off]);

  return {
    adminUpdates,
    lastUpdate
  };
};
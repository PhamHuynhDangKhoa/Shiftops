import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { RealtimeEvent, NotificationRealtimePayload, WebSocketConnectionStatus } from '../lib/types';

interface WebSocketContextType {
  status: WebSocketConnectionStatus;
  lastEvent: RealtimeEvent | null;
  subscribeToBranch: (branchId: string) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<WebSocketConnectionStatus>('DISCONNECTED');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const clientRef = useRef<Client | null>(null);
  const userSubRef = useRef<StompSubscription | null>(null);
  const branchSubsRef = useRef<Map<string, StompSubscription>>(new Map());

  // Invalidate affected queries based on operational event
  const handleOperationalEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);

    switch (event.eventType) {
      case 'STAFF_CHECKED_IN':
      case 'STAFF_CHECKED_OUT':
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['branch-attendance'] });
        queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['my-shifts-attendance'] });
        break;

      case 'TASK_COMPLETED':
      case 'TASK_STATUS_CHANGED':
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['handovers'] });
        queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
        break;

      case 'ISSUE_STATUS_CHANGED':
        queryClient.invalidateQueries({ queryKey: ['issues'] });
        queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
        queryClient.invalidateQueries({ queryKey: ['my-issues'] });
        queryClient.invalidateQueries({ queryKey: ['handovers'] });
        queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
        break;

      case 'HANDOVER_SUBMITTED':
      case 'HANDOVER_ACKNOWLEDGED':
        queryClient.invalidateQueries({ queryKey: ['handovers'] });
        queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
        queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
        break;

      case 'ANNOUNCEMENT_PUBLISHED':
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        break;

      default:
        break;
    }
  }, [queryClient]);

  const desiredBranchesRef = useRef<Set<string>>(new Set());

  const setupBranchSubscription = useCallback((branchId: string, client: Client) => {
    if (!client.connected || !branchId || branchSubsRef.current.has(branchId)) {
      return;
    }

    try {
      const sub = client.subscribe(`/topic/branches/${branchId}/operations`, (msg) => {
        try {
          const event: RealtimeEvent = JSON.parse(msg.body);
          handleOperationalEvent(event);
        } catch (e) {
          console.error('Failed to parse operational event', e);
        }
      });
      branchSubsRef.current.set(branchId, sub);
    } catch (e) {
      console.warn('Could not subscribe to branch operations', e);
    }
  }, [handleOperationalEvent]);

  // Subscribe to branch topic helper
  const subscribeToBranch = useCallback((branchId: string) => {
    if (!branchId) return () => {};

    desiredBranchesRef.current.add(branchId);
    const client = clientRef.current;
    if (client && client.connected) {
      setupBranchSubscription(branchId, client);
    }

    return () => {
      desiredBranchesRef.current.delete(branchId);
      const sub = branchSubsRef.current.get(branchId);
      if (sub) {
        try {
          sub.unsubscribe();
        } catch {
          // ignore
        }
        branchSubsRef.current.delete(branchId);
      }
    };
  }, [setupBranchSubscription]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setStatus('DISCONNECTED');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${wsProtocol}//${window.location.host}/api/ws`;

    const client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // Suppress verbose debug logs in production
      },
      onConnect: () => {
        setStatus('CONNECTED');

        // Subscribe to private notifications queue
        try {
          userSubRef.current = client.subscribe('/user/queue/notifications', (msg) => {
            try {
              const event: RealtimeEvent<NotificationRealtimePayload> = JSON.parse(msg.body);
              setLastEvent(event as unknown as RealtimeEvent);

              if (event.eventType === 'NOTIFICATION_CREATED' && event.payload) {
                // Update unread count immediately in cache
                if (typeof event.payload.unreadCount === 'number') {
                  queryClient.setQueryData(['notifications', 'unread-count'], {
                    count: event.payload.unreadCount,
                  });
                }
                // Invalidate notification inbox query
                queryClient.invalidateQueries({ queryKey: ['notifications'] });

                // Also invalidate related domain query depending on notification reference type
                if (event.payload.notification?.referenceType === 'TASK') {
                  queryClient.invalidateQueries({ queryKey: ['tasks'] });
                  queryClient.invalidateQueries({ queryKey: ['branch-tasks'] });
                  queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
                } else if (event.payload.notification?.referenceType === 'ISSUE') {
                  queryClient.invalidateQueries({ queryKey: ['issues'] });
                  queryClient.invalidateQueries({ queryKey: ['branch-issues'] });
                  queryClient.invalidateQueries({ queryKey: ['my-issues'] });
                } else if (event.payload.notification?.referenceType === 'HANDOVER') {
                  queryClient.invalidateQueries({ queryKey: ['handovers'] });
                  queryClient.invalidateQueries({ queryKey: ['latest-handover'] });
                  queryClient.invalidateQueries({ queryKey: ['branch-handovers-history'] });
                } else if (event.payload.notification?.referenceType === 'SHIFT') {
                  queryClient.invalidateQueries({ queryKey: ['shifts'] });
                  queryClient.invalidateQueries({ queryKey: ['my-shifts-attendance'] });
                } else if (event.payload.notification?.referenceType === 'ANNOUNCEMENT') {
                  queryClient.invalidateQueries({ queryKey: ['announcements'] });
                }
              }
            } catch (err) {
              console.error('Error handling user notification', err);
            }
          });
        } catch (err) {
          console.error('Failed to subscribe to user notifications', err);
        }

        // Auto-subscribe managers/owners to their primary branch topic
        if (user && (user.role === 'OWNER' || user.role === 'MANAGER') && user.primaryBranchId) {
          desiredBranchesRef.current.add(user.primaryBranchId);
        }

        // Subscribe to all desired branches
        desiredBranchesRef.current.forEach((branchId) => {
          setupBranchSubscription(branchId, client);
        });
      },
      onDisconnect: () => {
        setStatus('DISCONNECTED');
        userSubRef.current = null;
        branchSubsRef.current.clear();
      },
      onWebSocketClose: () => {
        setStatus('RECONNECTING');
      },
      onStompError: (frame) => {
        console.warn('STOMP Broker error:', frame.headers['message']);
        setStatus('DISCONNECTED');
      },
    });

    client.activate();
    clientRef.current = client;

    const branchSubs = branchSubsRef.current;
    return () => {
      client.deactivate();
      clientRef.current = null;
      userSubRef.current = null;
      branchSubs.clear();
      setStatus('DISCONNECTED');
    };
  }, [isAuthenticated, token, user, queryClient, setupBranchSubscription]);

  return (
    <WebSocketContext.Provider value={{ status, lastEvent, subscribeToBranch }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

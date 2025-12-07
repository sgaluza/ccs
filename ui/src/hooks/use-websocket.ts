/**
 * WebSocket Hook (Phase 04)
 *
 * Manages WebSocket connection, auto-reconnect, and React Query invalidation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WSMessage {
  type: string;
  path?: string;
  timestamp?: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    const ws = new WebSocket(`ws://${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttempts.current = 0;
      console.log('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch {
        console.log('[WS] Invalid message');
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;

      // Attempt reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      console.log('[WS] Connection error');
    };
  }, []);

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('[WS] Server acknowledged connection');
        break;

      case 'config-changed':
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        queryClient.invalidateQueries({ queryKey: ['cliproxy'] });
        toast.info('Configuration updated externally');
        break;

      case 'settings-changed':
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        toast.info('Settings file updated');
        break;

      case 'profiles-changed':
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        toast.info('Accounts updated');
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log(`[WS] Unknown message: ${message.type}`);
    }
  };

  const disconnect = useCallback(() => {
    reconnectAttempts.current = maxReconnectAttempts; // Prevent reconnect
    wsRef.current?.close();
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { status, connect, disconnect };
}

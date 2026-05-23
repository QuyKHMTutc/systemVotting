import { useEffect } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

export interface AdminModerationCountEvent {
  type: 'COUNT_UPDATED';
  pendingPolls: number;
  flaggedComments: number;
  total: number;
}

export type AdminModerationEvent = AdminModerationCountEvent;

interface UseAdminModerationWebSocketOptions {
  onEvent: (event: AdminModerationEvent) => void;
}

/**
 * Hook subscribe vào /topic/admin/moderation — nhận count updates real-time cho AdminPanel.
 * Topic public nhưng chỉ dùng trong AdminPanel (admin đã đăng nhập).
 */
export const useAdminModerationWebSocket = ({ onEvent }: UseAdminModerationWebSocketOptions) => {
  const client = useGlobalWebSocket();

  useEffect(() => {
    if (!client) return;

    const sub = client.subscribe('/topic/admin/moderation', (message) => {
      try {
        const event: AdminModerationEvent = JSON.parse(message.body);
        onEvent(event);
      } catch (e) {
        console.error('[WS] Failed to parse admin moderation event:', e);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [client, onEvent]);
};

import { useEffect } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

export type ModerationEventType = 'POLL_APPROVED' | 'POLL_REJECTED' | 'COMMENT_APPROVED' | 'COMMENT_BLOCKED';

export interface ModerationEvent {
  type: ModerationEventType;
  // Poll events
  pollId?: number;
  title?: string;
  reason?: string;
  // Comment events
  commentId?: number;
  content?: string;
}

interface UseModerationWebSocketOptions {
  onEvent: (event: ModerationEvent) => void;
}

/**
 * Hook subscribe vào /user/queue/moderation — nhận event khi admin duyệt/từ chối nội dung của user.
 * Chỉ hoạt động khi user đã đăng nhập (private queue).
 */
export const useModerationWebSocket = ({ onEvent }: UseModerationWebSocketOptions) => {
  const client = useGlobalWebSocket();

  useEffect(() => {
    if (!client) return;

    const sub = client.subscribe('/user/queue/moderation', (message) => {
      try {
        const event: ModerationEvent = JSON.parse(message.body);
        onEvent(event);
      } catch (e) {
        console.error('[WS] Failed to parse moderation event:', e);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [client, onEvent]);
};

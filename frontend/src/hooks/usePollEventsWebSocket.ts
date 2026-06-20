import { useEffect } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

export type PollEventPayload =
  | { type: 'CREATED'; poll: any }
  | { type: 'DELETED'; pollId: number }
  | { type: 'VOTED'; pollId: number; userId?: number; totalVotes?: number; totalPollVotes?: number; options: { optionId: number; text: string; voteCount: number; audienceCount?: number; judgeCount?: number; judgeWeight?: number }[] }
  | { type: 'COMMENT_ADDED'; pollId: number; commentCount?: number }
  | { type: 'COMMENT_DELETED'; pollId: number; commentId: number; commentCount?: number };

interface PollEventsWebSocketOptions {
  onEvent: (payload: PollEventPayload) => void;
}

export const usePollEventsWebSocket = ({ onEvent }: PollEventsWebSocketOptions) => {
  const client = useGlobalWebSocket();

  useEffect(() => {
    if (!client) return;

    const subscription = client.subscribe('/topic/polls/events', (message) => {
      try {
        const payload: PollEventPayload = JSON.parse(message.body);
        onEvent(payload);
      } catch (e) {
        console.error('[WS] Failed to parse global poll event:', e);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, onEvent]);
};

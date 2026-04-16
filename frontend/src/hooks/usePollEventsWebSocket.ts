import { useEffect } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

export type PollEventPayload = 
  | { type: 'CREATED'; poll: any }
  | { type: 'DELETED'; pollId: number }
  | { type: 'VOTED'; pollId: number; options: { optionId: number; text: string; voteCount: number }[] }
  | { type: 'COMMENT_ADDED'; pollId: number };

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

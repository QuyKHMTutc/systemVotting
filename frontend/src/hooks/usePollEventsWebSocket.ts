import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.PROD
  ? 'wss://systemvotting.onrender.com/ws'
  : 'ws://localhost:8080/ws';

export type PollEventPayload = 
  | { type: 'CREATED'; poll: any }
  | { type: 'DELETED'; pollId: number }
  | { type: 'VOTED'; pollId: number; options: { optionId: number; text: string; voteCount: number }[] };

interface PollEventsWebSocketOptions {
  onEvent: (payload: PollEventPayload) => void;
}

export const usePollEventsWebSocket = ({ onEvent }: PollEventsWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected to Global Polls Events');

        client.subscribe('/topic/polls/events', (message) => {
          try {
            const payload: PollEventPayload = JSON.parse(message.body);
            onEvent(payload);
          } catch (e) {
            console.error('[WS] Failed to parse global poll event:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('[WS] WebSocket error:', event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [onEvent]);
};

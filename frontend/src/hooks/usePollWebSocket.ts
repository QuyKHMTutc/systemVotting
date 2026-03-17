import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.PROD
  ? 'wss://systemvotting.onrender.com/ws'
  : 'ws://localhost:8080/ws';

interface VoteUpdatePayload {
  pollId: number;
  options: { optionId: number; text: string; voteCount: number }[];
}

interface PollWebSocketOptions {
  pollId: number | undefined;
  onVoteUpdate: (payload: VoteUpdatePayload) => void;
  onNewComment: (comment: any) => void;
}

export const usePollWebSocket = ({ pollId, onVoteUpdate, onNewComment }: PollWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const token = localStorage.getItem('accessToken');

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected to WebSocket');

        // Subscribe to real-time vote updates for this poll
        client.subscribe(`/topic/polls/${pollId}/votes`, (message) => {
          try {
            const payload: VoteUpdatePayload = JSON.parse(message.body);
            onVoteUpdate(payload);
          } catch (e) {
            console.error('[WS] Failed to parse vote update:', e);
          }
        });

        // Subscribe to real-time new comments for this poll
        client.subscribe(`/topic/polls/${pollId}/comments`, (message) => {
          try {
            const comment = JSON.parse(message.body);
            onNewComment(comment);
          } catch (e) {
            console.error('[WS] Failed to parse comment update:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame);
      },
      onWebSocketError: (event) => {
        console.error('[WS] WebSocket error:', event);
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected from WebSocket');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);
};

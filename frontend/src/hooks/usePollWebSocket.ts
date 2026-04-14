import { useEffect } from 'react';
import { useGlobalWebSocket } from '../contexts/WebSocketContext';

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
  const client = useGlobalWebSocket();

  useEffect(() => {
    if (!pollId || !client) return;

    // Subscribe to real-time vote updates for this poll
    const voteSub = client.subscribe(`/topic/polls/${pollId}/votes`, (message) => {
      try {
        const payload: VoteUpdatePayload = JSON.parse(message.body);
        onVoteUpdate(payload);
      } catch (e) {
        console.error('[WS] Failed to parse vote update:', e);
      }
    });

    // Subscribe to real-time new comments for this poll
    const commentSub = client.subscribe(`/topic/polls/${pollId}/comments`, (message) => {
      try {
        const comment = JSON.parse(message.body);
        onNewComment(comment);
      } catch (e) {
        console.error('[WS] Failed to parse comment update:', e);
      }
    });

    return () => {
      voteSub.unsubscribe();
      commentSub.unsubscribe();
    };
  }, [pollId, client, onVoteUpdate, onNewComment]);
};

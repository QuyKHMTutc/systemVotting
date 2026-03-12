import { useState } from 'react';
import type { Comment } from '../../services/comment.service';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  onReplySubmit: (parentId: number, content: string, isAnonymous: boolean) => void;
}

export default function CommentList({ comments, onReplySubmit }: CommentListProps) {
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  const toggleReply = (commentId: number, forceOpen?: boolean) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: forceOpen !== undefined ? forceOpen : !prev[commentId],
    }));
  };

  if (!comments?.length) {
    return (
      <div className="text-center py-12 text-white/50 rounded-xl border border-dashed border-white/10">
        No comments yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-white/5">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReplySubmit={onReplySubmit}
          expandedReplies={expandedReplies}
          toggleReply={toggleReply}
        />
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Comment } from '../../services/comment.service';
import CommentItem from './CommentItem';
import { useTranslation } from 'react-i18next';

interface CommentListProps {
  comments: Comment[];
  onReplySubmit: (parentId: number, content: string, isAnonymous: boolean) => void;
  identityLocked?: boolean;
  lockedIsAnonymous?: boolean;
  highlightCommentId?: number | null;
}

export default function CommentList({ comments, onReplySubmit, identityLocked, lockedIsAnonymous, highlightCommentId }: CommentListProps) {
  const { t } = useTranslation();
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (highlightCommentId && comments.length > 0) {
      // Find if this comment is a reply, and if so, expand its parent
      const parent = comments.find(c => c.replies && c.replies.some(r => r.id === highlightCommentId));
      if (parent) {
        setExpandedReplies(prev => ({ ...prev, [parent.id]: true }));
      }
    }
  }, [highlightCommentId, comments]);

  const toggleReply = (commentId: number, forceOpen?: boolean) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: forceOpen !== undefined ? forceOpen : !prev[commentId],
    }));
  };

  if (!comments?.length) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-white/50 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
        {t('pollDetail.noCommentsBeFirst')}
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-slate-200 dark:divide-white/5">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReplySubmit={onReplySubmit}
          expandedReplies={expandedReplies}
          toggleReply={toggleReply}
          identityLocked={identityLocked}
          lockedIsAnonymous={lockedIsAnonymous}
          highlightCommentId={highlightCommentId}
        />
      ))}
    </div>
  );
}

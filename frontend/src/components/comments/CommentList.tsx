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
  judgeIds?: number[];
  onDelete?: (commentId: number) => void;
  isActive?: boolean;
}

export default function CommentList({ comments, onReplySubmit, identityLocked, lockedIsAnonymous, highlightCommentId, judgeIds, onDelete, isActive = true }: CommentListProps) {
  const { t } = useTranslation();
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (highlightCommentId && comments.length > 0) {
      const pathToTarget: number[] = [];
      
      const findPath = (list: Comment[], targetId: number, currentPath: number[]): boolean => {
        for (const c of list) {
          if (c.id === targetId) return true;
          if (c.replies && c.replies.length > 0) {
            currentPath.push(c.id);
            if (findPath(c.replies, targetId, currentPath)) {
              return true;
            }
            currentPath.pop();
          }
        }
        return false;
      };

      if (findPath(comments, highlightCommentId, pathToTarget)) {
        setExpandedReplies(prev => {
          const newExpanded = { ...prev };
          pathToTarget.forEach(id => {
            newExpanded[id] = true;
          });
          return newExpanded;
        });
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
          judgeIds={judgeIds}
          onDelete={onDelete}
          isActive={isActive}
        />
      ))}
    </div>
  );
}

import { useState } from 'react';
import type { Comment } from '../../services/comment.service';
import { CornerDownRight, ThumbsUp } from 'lucide-react';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  onReplySubmit: (parentId: number, content: string, isAnonymous: boolean) => void;
  expandedReplies: Record<number, boolean>;
  toggleReply: (commentId: number, forceOpen?: boolean) => void;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function CommentItem({
  comment,
  onReplySubmit,
  expandedReplies,
  toggleReply,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const showReplies = expandedReplies[comment.id] ?? false;
  const isReply = comment.parentId != null;
  const timeAgo = getRelativeTime(comment.createdAt);

  const handleReplyClick = () => setIsReplying(!isReplying);
  const handleLikeClick = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <div className="flex gap-3 py-4 group hover:bg-white/[0.02] rounded-xl -mx-2 px-2 transition-colors">
      {/* Avatar */}
      <div className="shrink-0">
        {comment.avatarUrl ? (
          <img
            src={comment.avatarUrl}
            alt={comment.username}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/10">
            {comment.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Username + time */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm">{comment.username}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/50 text-xs">{timeAgo}</span>
        </div>

        {/* Content */}
        <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {comment.content.split(' ').map((word, i) =>
            word.startsWith('@') ? (
              <span key={i} className="text-indigo-400 font-medium">
                {word}{' '}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              liked ? 'text-indigo-400' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount > 0 ? likeCount : 'Like'}
          </button>
          <button
            onClick={handleReplyClick}
            className="text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
          >
            Reply
          </button>
          {comment.voteStatus !== 'Chưa vote' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              {comment.voteStatus}
            </span>
          )}
        </div>

        {/* Reply form */}
        {isReplying && (
          <div className="mt-3">
            <CommentInput
              onSubmit={(content, isAnonymous) => {
                const final = isReply && !content.startsWith(`@${comment.username}`)
                  ? `@${comment.username} ${content}`
                  : content;
                onReplySubmit(comment.id, final, isAnonymous);
                setIsReplying(false);
                toggleReply(comment.id, true);
              }}
              placeholder={`Reply to ${comment.username}...`}
              username="You"
              isReply
              autoFocus
            />
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-0">
            {showReplies ? (
              <>
                {comment.replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    onReplySubmit={onReplySubmit}
                    expandedReplies={expandedReplies}
                    toggleReply={toggleReply}
                  />
                ))}
                <button
                  onClick={() => toggleReply(comment.id, false)}
                  className="flex items-center gap-2 mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  <CornerDownRight className="w-4 h-4" />
                  Hide replies
                </button>
              </>
            ) : (
              <button
                onClick={() => toggleReply(comment.id, true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                <CornerDownRight className="w-4 h-4" />
                View {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

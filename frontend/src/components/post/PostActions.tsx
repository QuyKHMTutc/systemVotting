import { MessageSquare, Share2 } from 'lucide-react';

interface PostActionsProps {
  commentsCount: number;
  sharesCount?: number;
  onCommentClick: () => void;
  onShareClick: () => void;
  hasCopied?: boolean;
}

export default function PostActions({
  commentsCount,
  onCommentClick,
  onShareClick,
  hasCopied = false,
}: PostActionsProps) {
  return (
    <div className="border-t border-white/10">
      <div className="flex">
        <button
          onClick={onCommentClick}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
        >
          <MessageSquare className="w-5 h-5" />
          {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
        </button>
        <button
          onClick={onShareClick}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm relative"
        >
          <Share2 className="w-5 h-5" />
          Share
          {hasCopied && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 animate-fade-in-up whitespace-nowrap">
              Link copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

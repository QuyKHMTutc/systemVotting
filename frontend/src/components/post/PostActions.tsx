import { MessageSquare, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="border-t border-slate-200 dark:border-white/10">
      <div className="flex">
        <button
          onClick={onCommentClick}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium text-sm"
        >
          <MessageSquare className="w-5 h-5" />
          {commentsCount} {t('pollDetail.comments')}
        </button>
        <button
          onClick={onShareClick}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-4 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium text-sm relative"
        >
          <Share2 className="w-5 h-5" />
          {t('pollDetail.share')}
          {hasCopied && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 dark:border-white/20 animate-fade-in-up whitespace-nowrap">
              {t('pollDetail.linkCopied')}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

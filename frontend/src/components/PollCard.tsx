import { Link } from 'react-router-dom';
import type { Poll } from '../services/poll.service';
import { Share2, Check, Users, MessageCircle, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';
import { timeAgo, endsIn } from '../utils/date';
import { getTagPillClass } from '../utils/tagPills';
import { useTranslation } from 'react-i18next';

export interface PollCardProps {
  poll: Poll;
  hasVoted?: boolean;
  commentCount?: number;
  onDelete?: (pollId: number) => void;
  showDeleteButton?: boolean;
}

export const PollCard = ({
  poll,
  hasVoted = false,
  commentCount,
  onDelete,
  showDeleteButton = false,
}: PollCardProps) => {
  const { t } = useTranslation();
  const resolvedCommentCount = commentCount ?? poll.commentCount ?? 0;
  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount ?? 0), 0);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/poll/${poll.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(poll.id);
  };

  return (
    <Link
      to={`/poll/${poll.id}`}
      className="block h-full group"
    >
      <div className="glass-panel card-hover-effect rounded-2xl flex flex-col h-full border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 relative overflow-hidden transition-colors bg-white/50 dark:bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-500/8 dark:via-transparent dark:to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col flex-grow">
          {/* Header: status badge + tags */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isActive ? t('pollDetail.active') : t('pollDetail.ended')}
              </span>
              {poll.judgeWeight > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                   ⚖️ {t('pollDetail.weighted')}
                </span>
              )}
              {poll.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getTagPillClass(tag)} transition-transform hover:scale-105`}
                >
                  #{tag}
                </span>
              ))}
              {poll.tags && poll.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-slate-600 dark:text-white/50">+{poll.tags.length - 3}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showDeleteButton && onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-slate-500 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleShare}
                className="p-2 text-slate-500 dark:text-white/40 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all focus:outline-none"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
            {poll.title}
          </h2>

          {/* Creator row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-slate-200 dark:ring-white/20 shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
              {poll.creator.avatarUrl ? (
                <img
                  src={poll.creator.avatarUrl.startsWith('http') || poll.creator.avatarUrl.startsWith('blob') ? poll.creator.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${poll.creator.avatarUrl}`}
                  alt={poll.creator.username}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${poll.creator.username}` }}
                />
              ) : (
                poll.creator.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-slate-800 dark:text-white/90 font-medium text-sm truncate">{poll.creator.username}</span>
              <span className="text-slate-500 dark:text-white/50 text-xs">{timeAgo(poll.createdAt)}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-white/60 mb-5 py-3 border-y border-slate-200 dark:border-white/5">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400/80" />
              <span className="text-slate-900 dark:text-white font-semibold">{totalVotes}</span> {t('pollDetail.voters')}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400/80" />
              <span className="text-slate-900 dark:text-white font-semibold">{resolvedCommentCount}</span> {t('pollDetail.comments')}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400/80" />
              <span className="text-slate-900 dark:text-white font-semibold">{poll.options.length}</span> {t('pollDetail.options')}
            </span>
          </div>

          {/* Ends in / Ended */}
          <div className="flex items-center gap-2 mb-5 text-xs">
            <Clock className="w-4 h-4 text-slate-500 dark:text-white/40" />
            <span className={isActive ? 'text-indigo-600 dark:text-indigo-300/90' : 'text-slate-600 dark:text-white/50'}>{endsIn(poll.endTime)}</span>
          </div>

          {/* CTA Button */}
          <div className="mt-auto pt-2">
            <span
              className={`block text-center w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                !isActive
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 border border-slate-200 dark:border-white/10'
                  : hasVoted
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'btn-primary text-white border-0 hover:opacity-95 group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]'
              }`}
            >
              {!isActive ? t('pollDetail.viewResults') : hasVoted ? t('pollDetail.viewResults') : t('pollDetail.voteNow')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

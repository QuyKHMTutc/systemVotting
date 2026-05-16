import { Link } from 'react-router-dom';
import type { Poll } from '../../services/poll.service';
import { Users, MessageCircle, Share2, Check, Lock, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { timeAgo } from '../../utils/date';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

function formatCompact(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export interface ExplorePollCardProps {
  poll: Poll;
  hasVoted?: boolean;
  commentCount?: number;
  onDelete?: (pollId: number) => void;
  showDeleteButton?: boolean;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Công nghệ': { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-500/30' },
  'Technology': { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-500/30' },
  'Giải trí': { bg: 'bg-pink-100 dark:bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-500/30' },
  'Entertainment': { bg: 'bg-pink-100 dark:bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-500/30' },
  'Thể thao': { bg: 'bg-green-100 dark:bg-green-500/15', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-500/30' },
  'Sports': { bg: 'bg-green-100 dark:bg-green-500/15', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-500/30' },
  'Học tập': { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30' },
  'Education': { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30' },
  'Kinh doanh': { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-500/30' },
  'Business': { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-500/30' },
  'Gaming': { bg: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-500/30' },
};

function getCategoryStyle(name?: string) {
  if (!name) return { bg: 'bg-slate-100 dark:bg-white/8', text: 'text-slate-600 dark:text-white/60', border: 'border-slate-200 dark:border-white/10' };
  return CATEGORY_COLORS[name] ?? { bg: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-500/30' };
}

// Bar colors cycling
const BAR_COLORS = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
];

export function ExplorePollCard({ poll, hasVoted = false, commentCount, onDelete, showDeleteButton = false }: ExplorePollCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCreator = !!user && Number(user.id) === Number(poll.creator.id);
  const resolvedCommentCount = commentCount ?? poll.commentCount ?? 0;
  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); onDelete?.(poll.id);
  };

  const categoryStyle = getCategoryStyle(poll.category?.name);
  // Show top 3 options (most voted first)
  const sortedOptions = [...poll.options].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));
  const displayOptions = sortedOptions.slice(0, 4);

  return (
    <Link to={`/poll/${poll.id}`} className="block group">
      <div className="
        rounded-2xl flex flex-col h-full
        bg-white dark:bg-[#13112a]
        border border-slate-200/80 dark:border-white/8
        shadow-sm dark:shadow-none
        hover:shadow-lg hover:shadow-violet-200/40 dark:hover:shadow-[0_8px_32px_-8px_rgba(123,47,247,0.3)]
        hover:border-violet-300/60 dark:hover:border-violet-500/30
        hover:-translate-y-0.5
        transition-all duration-200
        overflow-hidden
      ">
        {/* Card header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            {poll.category && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {poll.category.icon && <span className="text-xs">{poll.category.icon}</span>}
                {poll.category.name}
              </span>
            )}
            {/* Time */}
            <span className="text-[11px] text-slate-400 dark:text-white/35 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
              {timeAgo(poll.createdAt)}
            </span>
            {/* Private badge */}
            {poll.visibility === 'PRIVATE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                <Lock className="w-2.5 h-2.5" /> Riêng tư
              </span>
            )}
          </div>

          {/* Actions menu */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white dark:bg-[#1c1a35] border border-slate-200 dark:border-white/10 shadow-xl py-1"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép!' : 'Chia sẻ'}
                </button>
                {showDeleteButton && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title + Description */}
        <div className="px-4 pb-3">
          <h3 className="text-slate-900 dark:text-white font-bold text-[14px] leading-snug mb-1.5 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors">
            {poll.title}
          </h3>
          {poll.description?.trim() && (
            <p className="text-slate-500 dark:text-white/40 text-[12px] leading-relaxed line-clamp-2">
              {poll.description}
            </p>
          )}
        </div>

        {/* Options with progress bars */}
        <div className="px-4 pb-3 space-y-2 flex-1">
          {displayOptions.map((option, idx) => {
            const pct = totalVotes > 0 ? Math.round(((option.voteCount ?? 0) / totalVotes) * 100) : 0;
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];
            return (
              <div key={option.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] text-slate-700 dark:text-white/70 truncate max-w-[75%] font-medium">{option.text}</span>
                  <span className="text-[11px] text-slate-400 dark:text-white/40 font-semibold shrink-0 ml-2">{pct}% <span className="text-slate-300 dark:text-white/25 font-normal">({formatCompact(option.voteCount ?? 0)})</span></span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {poll.options.length > 4 && (
            <p className="text-[11px] text-slate-400 dark:text-white/30 pt-0.5">+{poll.options.length - 4} lựa chọn khác</p>
          )}
        </div>

        {/* Footer: vote/comment + creator */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/6 flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-white/40">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-700 dark:text-white/65 font-semibold">{formatCompact(totalVotes)}</span>
              <span className="text-slate-400 dark:text-white/30">lượt vote</span>
            </span>
            <span className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-white/40">
              <MessageCircle className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-slate-700 dark:text-white/65 font-semibold">{resolvedCommentCount}</span>
              <span className="text-slate-400 dark:text-white/30">bình luận</span>
            </span>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0 ring-1 ring-white dark:ring-white/10">
              {poll.creator.avatarUrl ? (
                <img
                  src={poll.creator.avatarUrl.startsWith('http')
                    ? poll.creator.avatarUrl
                    : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${poll.creator.avatarUrl}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${poll.creator.username}`; }}
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-white text-[9px] font-bold">
                  {poll.creator.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 truncate max-w-[80px]">{poll.creator.username}</span>
            <button
              className="ml-1 text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/40 transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status bar at very bottom */}
        {isActive && (
          <div className="h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-60" />
        )}
      </div>
    </Link>
  );
}

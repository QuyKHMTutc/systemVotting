import { Link } from 'react-router-dom';
import type { Poll } from '../../services/poll.service';
import { Users, MessageCircle, BarChart3, Share2, Check, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { timeAgo } from '../../utils/date';
import { getTagPillClass } from '../../utils/tagPills';
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

// Vivid cover gradients — always dark (they're image-like banners)
function getCoverGradient(id: number): string {
  const covers = [
    'from-violet-600 via-indigo-700 to-slate-900',
    'from-rose-600 via-pink-700 to-slate-900',
    'from-cyan-600 via-teal-700 to-slate-900',
    'from-amber-500 via-orange-700 to-slate-900',
    'from-emerald-600 via-green-700 to-slate-900',
    'from-fuchsia-600 via-purple-700 to-slate-900',
  ];
  return covers[id % covers.length];
}

export function ExplorePollCard({ poll, hasVoted = false, commentCount, onDelete, showDeleteButton = false }: ExplorePollCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCreator = !!user && Number(user.id) === Number(poll.creator.id);
  const resolvedCommentCount = commentCount ?? poll.commentCount ?? 0;
  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); onDelete?.(poll.id);
  };

  const coverGrad = getCoverGradient(poll.id);

  return (
    <Link to={`/poll/${poll.id}`} className="block group">
      <div className="
        rounded-2xl overflow-hidden flex flex-col h-full
        bg-white dark:bg-[#13112a]
        border border-slate-200/80 dark:border-white/8
        shadow-sm dark:shadow-none
        hover:shadow-lg hover:shadow-violet-200/60 dark:hover:shadow-[0_8px_40px_-10px_rgba(123,47,247,0.35)]
        hover:border-violet-300 dark:hover:border-violet-500/40
        hover:-translate-y-1
        transition-all duration-300
      ">

        {/* Cover — always dark gradient (like a photo) */}
        <div className={`relative h-36 bg-gradient-to-br ${coverGrad} overflow-hidden shrink-0`}>
          {/* Subtle mesh */}
          <div className="absolute inset-0 opacity-15"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px)', backgroundSize: '24px 24px' }}
          />
          {/* Glow */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute top-2 left-2 w-16 h-16 rounded-full bg-white/5 blur-2xl" />

          {/* Top-right actions */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {showDeleteButton && onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/15 text-white/50 hover:text-red-400 hover:border-red-400/40 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/15 text-white/60 hover:text-violet-300 hover:border-violet-400/40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Bottom badges */}
          <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm ${
              isActive
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                : 'bg-rose-500/25 text-rose-200 border border-rose-400/40'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}`} />
              {isActive ? t('pollDetail.active') : t('pollDetail.ended')}
            </span>
            {poll.visibility === 'PRIVATE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm bg-violet-500/25 text-violet-200 border border-violet-400/40">
                <Lock className="w-2.5 h-2.5" /> Riêng tư
              </span>
            )}
            {poll.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border backdrop-blur-sm ${getTagPillClass(tag)}`}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          {/* Creator row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0 ring-2 ring-white dark:ring-white/10">
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
                <span className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                  {poll.creator.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-slate-800 dark:text-white/85 text-xs font-semibold leading-none truncate">
                {poll.creator.username}
              </p>
              <p className="text-slate-400 dark:text-white/35 text-[10px] mt-0.5">{timeAgo(poll.createdAt)}</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-slate-900 dark:text-white font-bold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-200 transition-colors">
            {poll.title}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[11px] mb-4 mt-auto">
            <span className="flex items-center gap-1 text-slate-500 dark:text-white/40">
              <Users className="w-3.5 h-3.5 text-violet-500/70 dark:text-violet-400/60" />
              <span className="text-slate-700 dark:text-white/70 font-semibold">{formatCompact(totalVotes)}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-white/40">
              <MessageCircle className="w-3.5 h-3.5 text-fuchsia-500/70 dark:text-fuchsia-400/60" />
              <span className="text-slate-700 dark:text-white/70 font-semibold">{resolvedCommentCount}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-white/40">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-500/70 dark:text-cyan-400/60" />
              <span className="text-slate-700 dark:text-white/70 font-semibold">{poll.options.length}</span>
              <span className="text-slate-400 dark:text-white/35">{t('pollDetail.options')}</span>
            </span>
          </div>

          {/* CTA button */}
          <Link
            to={`/poll/${poll.id}`}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isActive
                ? 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border border-slate-200 dark:border-white/8 hover:bg-slate-200 dark:hover:bg-white/8'
                : isCreator || hasVoted
                  ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/15'
                  : 'bg-gradient-to-r from-[#7B2FF7] to-[#F107A3] text-white shadow-md shadow-fuchsia-500/25 hover:opacity-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {!isActive || isCreator || hasVoted ? t('pollDetail.viewResults') : t('pollDetail.voteNow')} →
          </Link>
        </div>
      </div>
    </Link>
  );
}

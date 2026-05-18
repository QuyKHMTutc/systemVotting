import { Link } from 'react-router-dom';
import type { Poll } from '../../services/poll.service';
import {
  Users, MessageCircle, Share2, Check, Lock,
  Trash2, MoreVertical, Scale, Clock,
} from 'lucide-react';
import { useState } from 'react';
import { timeAgo } from '../../utils/date';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'Công nghệ': { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', accent: '#3b82f6' },
  'Technology': { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', accent: '#3b82f6' },
  'Giải trí': { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', accent: '#ec4899' },
  'Entertainment': { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', accent: '#ec4899' },
  'Thể thao': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', accent: '#10b981' },
  'Sports': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', accent: '#10b981' },
  'Học tập': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', accent: '#f59e0b' },
  'Education': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', accent: '#f59e0b' },
  'Kinh doanh': { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', accent: '#a855f7' },
  'Business': { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', accent: '#a855f7' },
  'Gaming': { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', accent: '#7c3aed' },
};

// Bar colors for options (cycling)
const BAR_COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#f97316'];

function getCategoryStyle(name?: string) {
  if (!name) return { bg: 'bg-slate-100 dark:bg-white/5', text: 'text-slate-500 dark:text-white/40', accent: '#6366f1' };
  return CATEGORY_COLORS[name] ?? { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', accent: '#7c3aed' };
}

function timeRemaining(endTime: string): string | null {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d >= 1) return `${d}d ${h}h`;
  if (h >= 1) return `${h}h`;
  return '< 1h';
}

export function ExplorePollCard({ poll, hasVoted = false, commentCount, onDelete, showDeleteButton = false }: ExplorePollCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isCreator = !!user && Number(user.id) === Number(poll.creator.id);
  const resolvedCommentCount = commentCount ?? poll.commentCount ?? 0;
  const isActive = new Date(poll.endTime) > new Date();
  const remaining = timeRemaining(poll.endTime);

  const hasWeightedVoting = (poll.judgeWeight ?? 0) > 0;
  const judgeWeight = poll.judgeWeight ?? 0;
  const audienceWeight = 100 - judgeWeight;

  const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
  const totalJudgeVotes = poll.options.reduce((s, o) => s + (o.judgeCount ?? 0), 0);
  const totalAudienceVotes = poll.options.reduce((s, o) => s + (o.audienceCount ?? 0), 0);

  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const getWeightedScore = (option: typeof poll.options[0]) => {
    if (!hasWeightedVoting) return option.voteCount ?? 0;
    const j = totalJudgeVotes > 0 ? ((option.judgeCount ?? 0) / totalJudgeVotes) * judgeWeight : 0;
    const a = totalAudienceVotes > 0 ? ((option.audienceCount ?? 0) / totalAudienceVotes) * audienceWeight : 0;
    return j + a;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/poll/${poll.id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); onDelete?.(poll.id);
  };

  const categoryStyle = getCategoryStyle(poll.category?.name);

  // Sort by score descending
  const sortedOptions = [...poll.options].sort((a, b) =>
    hasWeightedVoting ? getWeightedScore(b) - getWeightedScore(a) : (b.voteCount ?? 0) - (a.voteCount ?? 0)
  );

  const showResults = hasVoted || isCreator;

  // For progress bar width, use relative to winner (makes small % still visible)
  const maxRawScore = sortedOptions.length > 0
    ? (hasWeightedVoting ? getWeightedScore(sortedOptions[0]) : (sortedOptions[0].voteCount ?? 0))
    : 1;

  return (
    <Link to={`/poll/${poll.id}`} className="block group">
      <article className="
        flex gap-0 overflow-hidden
        bg-white dark:bg-[#13112a]
        border border-slate-200/60 dark:border-white/[0.07]
        rounded-2xl
        shadow-sm dark:shadow-none
        hover:shadow-md hover:shadow-slate-200/80 dark:hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.35)]
        hover:border-slate-300/70 dark:hover:border-white/[0.13]
        transition-all duration-200
      ">
        {/* Accent left bar */}
        <div className="w-[3px] shrink-0" style={{ background: `linear-gradient(to bottom, ${categoryStyle.accent}, ${categoryStyle.accent}88)` }} />

        {/* Card body */}
        <div className="flex-1 min-w-0 px-5 py-4">

          {/* ── Row 1: Meta bar ─────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap mb-3">

            {/* Creator avatar + name */}
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-white dark:ring-white/10"
                style={{ background: `linear-gradient(135deg, ${categoryStyle.accent}99, ${categoryStyle.accent}44)` }}>
                {poll.creator.avatarUrl ? (
                  <img
                    src={poll.creator.avatarUrl.startsWith('http')
                      ? poll.creator.avatarUrl
                      : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${poll.creator.avatarUrl}`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${poll.creator.username}`; }}
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-white text-[8px] font-bold">
                    {poll.creator.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-semibold text-slate-600 dark:text-white/60 hover:text-violet-600 dark:hover:text-violet-300 transition-colors">
                {poll.creator.username}
              </span>
            </div>

            <span className="text-slate-300 dark:text-white/15 text-[11px]">·</span>
            <span className="text-[11px] text-slate-400 dark:text-white/30">{timeAgo(poll.createdAt)}</span>

            {/* Category */}
            {poll.category && (
              <>
                <span className="text-slate-300 dark:text-white/15 text-[11px]">·</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${categoryStyle.bg} ${categoryStyle.text}`}>
                  {poll.category.icon && <span className="text-[10px]">{poll.category.icon}</span>}
                  {poll.category.name}
                </span>
              </>
            )}



            {/* Special badges */}
            {hasWeightedVoting && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <Scale className="w-3 h-3" />GK {judgeWeight}% · KG {audienceWeight}%
              </span>
            )}
            {poll.visibility === 'PRIVATE' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/35">
                <Lock className="w-3 h-3" />{t('pollDetail.privateLabel')}
              </span>
            )}

            {/* Status badge + Actions — pushed to right */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Status badge — chỉ hiện khi đang live */}
              {isActive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('pollDetail.active')}
                </span>
              )}

              {/* 3-dot menu */}
              <div className="relative">
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white dark:bg-[#1c1a35] border border-slate-100 dark:border-white/10 shadow-xl py-1"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <button onClick={handleShare} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      {copied ? t('pollDetail.linkCopied') : t('pollDetail.share')}
                    </button>
                    {showDeleteButton && onDelete && (
                      <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />{t('pollDetail.delete')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 2: Title ─────────────────────────────────── */}
          <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-snug mb-1.5 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-500 transition-all">
            {poll.title}
          </h3>

          {/* ── Row 3: Description (if exists) ───────────────── */}
          {poll.description?.trim() && (
            <p className="text-[13px] text-slate-500 dark:text-white/40 leading-relaxed mb-3 line-clamp-2">
              {poll.description}
            </p>
          )}

          {/* ── Row 4: Tags ──────────────────────────────────── */}
          {poll.tags && poll.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {poll.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[11px] text-slate-400 dark:text-white/35 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full font-medium border border-slate-200/70 dark:border-white/[0.06]">
                  #{tag}
                </span>
              ))}
              {poll.tags.length > 5 && (
                <span className="text-[11px] text-slate-400 dark:text-white/25 px-1">+{poll.tags.length - 5}</span>
              )}
            </div>
          )}

          {/* ── Row 5: All Poll Options ───────────────────────── */}
          <div className="space-y-1.5 mb-3">
            {sortedOptions.map((option, idx) => {
              let pct = 0;
              if (hasWeightedVoting) {
                pct = Math.round(getWeightedScore(option));
              } else {
                pct = totalVotes > 0 ? Math.round(((option.voteCount ?? 0) / totalVotes) * 100) : 0;
              }
              const rawScore = hasWeightedVoting ? getWeightedScore(option) : (option.voteCount ?? 0);
              const isWinner = showResults && rawScore === maxRawScore && rawScore > 0;
              const barColor = BAR_COLORS[idx % BAR_COLORS.length];
              // Width relative to winner for visual clarity
              const barWidth = showResults && maxRawScore > 0 ? Math.max((rawScore / maxRawScore) * 100, pct > 0 ? 2 : 0) : 0;

              return (
                <div key={option.id}>
                  {showResults ? (
                    /* Results view */
                    <div className="relative flex items-center gap-3 px-3 py-2 rounded-xl overflow-hidden" style={{
                      background: isWinner
                        ? `${barColor}12`
                        : 'transparent',
                      border: `1px solid ${isWinner ? barColor + '30' : 'transparent'}`
                    }}>
                      {/* Background fill bar */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700"
                        style={{ width: `${barWidth}%`, background: `${barColor}0e` }}
                      />
                      {/* Color dot */}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 relative z-10"
                        style={{ background: isWinner ? barColor : barColor + '55' }}
                      />
                      {/* Option text */}
                      <span className={`flex-1 min-w-0 text-[13px] truncate relative z-10 ${isWinner ? 'font-semibold text-slate-800 dark:text-white/90' : 'font-medium text-slate-600 dark:text-white/55'}`}>
                        {option.text}
                      </span>
                      {/* Pct */}
                      <span
                        className="shrink-0 text-[12px] font-bold tabular-nums relative z-10"
                        style={{ color: isWinner ? barColor : '#94a3b8' }}
                      >
                        {pct}%
                      </span>
                      {/* Vote count small */}
                      <span className="shrink-0 text-[11px] text-slate-300 dark:text-white/20 relative z-10 w-10 text-right tabular-nums">
                        {formatCompact(option.voteCount ?? 0)}
                      </span>
                    </div>
                  ) : (
                    /* Unvoted view */
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/20 hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-violet-50/40 dark:hover:bg-violet-500/[0.05] transition-all group/opt">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 dark:border-white/35 shrink-0 group-hover/opt:border-violet-400 dark:group-hover/opt:border-violet-500 transition-colors" />
                      <span className="text-[13px] text-slate-700 dark:text-white/65 font-medium">{option.text}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Row 6: Footer stats ──────────────────────────── */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.05] flex-wrap">
            <span className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-white/30">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-semibold text-slate-600 dark:text-white/55">{formatCompact(totalVotes)}</span>
              <span>{t('pollDetail.votesLabel')}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-white/30">
              <MessageCircle className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="font-semibold text-slate-600 dark:text-white/55">{formatCompact(resolvedCommentCount)}</span>
              <span>{t('pollDetail.commentsLabel')}</span>
            </span>

            {/* End time badge — pushed right */}
            <div className="ml-auto">
              {isActive && remaining ? (() => {
                const diff = new Date(poll.endTime).getTime() - Date.now();
                const isUrgent  = diff < 3_600_000;
                const isWarning = diff < 86_400_000;
                const isVi = i18n.language.startsWith('vi');
                const label = isVi ? 'Kết thúc sau' : 'Ends in';
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border ${
                    isUrgent
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                      : isWarning
                      ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  }`}>
                    <Clock className={`w-3 h-3 ${isUrgent ? 'animate-pulse' : ''}`} />
                    <span className="text-[10.5px] font-normal opacity-75">{label}</span>
                    <span className="font-bold">{remaining}</span>
                  </span>
                );
              })() : !isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/25">
                  {t('pollDetail.ended')}
                </span>
              ) : null}
            </div>
          </div>

        </div>
      </article>
    </Link>
  );
}

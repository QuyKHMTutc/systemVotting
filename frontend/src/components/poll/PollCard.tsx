import { Link } from 'react-router-dom';
import type { Poll } from '../../services/poll.service';
import { Share2, Check, Users, MessageCircle, BarChart3, Clock, Lock, MoreVertical, Trash2, Flag } from 'lucide-react';
import { useState } from 'react';
import { timeAgo, endsIn } from '../../utils/date';
import { getTagPillClass } from '../../utils/tagPills';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAnonymousCreatorName } from '../../utils/anonymous';
import { ReportModal } from '../report/ReportModal';
import { ReportTargetType } from '../../services/report.service';

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
  const { user } = useAuth();
  const isCreator = !!user && Number(user.id) === Number(poll.creator.id);
  const creatorName = poll.isAnonymous ? getAnonymousCreatorName(poll.id) : poll.creator.username;
  const creatorAvatar = poll.isAnonymous ? null : poll.creator.avatarUrl;
  const resolvedCommentCount = commentCount ?? poll.commentCount ?? 0;
  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount ?? 0), 0);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const hasCoverImage = !!poll.imageUrl;

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
    <Link to={`/poll/${poll.id}`} className="block h-full group">
      <div className="glass-panel card-hover-effect rounded-2xl flex flex-col h-full border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 relative overflow-hidden transition-colors bg-white/50 dark:bg-transparent">
        {/* Hover glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-500/8 dark:via-transparent dark:to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Cover Image Banner ────────────────────────────────── */}
        {hasCoverImage && (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7' }}>
            <img
              src={poll.imageUrl}
              alt={poll.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlay: dark at bottom so badges are readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

            {/* Status + badges overlaid on the image (bottom-left) */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md border ${
                isActive
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                  : 'bg-rose-500/25 text-rose-300 border-rose-400/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isActive ? t('pollDetail.active') : t('pollDetail.ended')}
              </span>
              {(poll.judgeWeight ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  ⚖️ {t('pollDetail.weighted')}
                </span>
              )}
              {poll.visibility === 'PRIVATE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-md bg-violet-500/20 text-violet-300 border border-violet-400/40">
                  <Lock className="w-3 h-3" /> Riêng tư
                </span>
              )}
            </div>

            {/* Actions menu — top-right over image */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                className="p-1.5 text-white/70 hover:text-white backdrop-blur-md bg-black/30 hover:bg-black/50 rounded-lg transition-colors focus:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-8 z-40 w-36 rounded-xl bg-white dark:bg-[#1c1a35] border border-slate-200 dark:border-white/10 shadow-xl py-1"
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
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReportModalOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {t('pollDetail.report', 'Báo cáo')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Card Body ─────────────────────────────────────────── */}
        <div className="relative z-10 p-5 flex flex-col flex-grow">

          {/* Actions Menu (only when NO cover image) */}
          {!hasCoverImage && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                className="p-1.5 text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-8 z-40 w-36 rounded-xl bg-white dark:bg-[#1c1a35] border border-slate-200 dark:border-white/10 shadow-xl py-1"
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
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReportModalOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {t('pollDetail.report', 'Báo cáo')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status + Tags (only shown when NO cover image) */}
          {!hasCoverImage && (
            <div className="flex flex-wrap items-center gap-2 mb-4 pr-6">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isActive ? t('pollDetail.active') : t('pollDetail.ended')}
              </span>
              {(poll.judgeWeight ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  ⚖️ {t('pollDetail.weighted')}
                </span>
              )}
              {poll.visibility === 'PRIVATE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                  <Lock className="w-3 h-3" /> Riêng tư
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
          )}

          {/* Tags row (under image, when cover image exists) */}
          {hasCoverImage && poll.tags && poll.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {poll.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getTagPillClass(tag)}`}
                >
                  #{tag}
                </span>
              ))}
              {poll.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-slate-500 dark:text-white/40">+{poll.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
            {poll.title}
          </h2>

          {/* Creator row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-slate-200 dark:ring-white/20 shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
              {creatorAvatar ? (
                <img
                  src={creatorAvatar.startsWith('http') || creatorAvatar.startsWith('blob') ? creatorAvatar : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${creatorAvatar}`}
                  alt={creatorName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${creatorName}` }}
                />
              ) : (
                creatorName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-slate-800 dark:text-white/90 font-medium text-sm truncate">{creatorName}</span>
              <span className="text-slate-500 dark:text-white/50 text-xs">{timeAgo(poll.createdAt)}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-white/60 mb-4 py-3 border-y border-slate-200 dark:border-white/5">
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
          <div className="flex items-center gap-2 mb-4 text-xs">
            <Clock className="w-4 h-4 text-slate-500 dark:text-white/40" />
            <span className={isActive ? 'text-indigo-600 dark:text-indigo-300/90' : 'text-slate-600 dark:text-white/50'}>{endsIn(poll.endTime)}</span>
          </div>

          {/* CTA Button */}
          <div className="mt-auto pt-1">
            <span className={`block text-center w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
              !isActive
                ? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 border border-slate-200 dark:border-white/10'
                : isCreator
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                  : hasVoted
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'btn-primary text-white border-0 hover:opacity-95 group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]'
            }`}>
              {!isActive
                ? t('pollDetail.viewResults')
                : isCreator
                  ? t('pollDetail.viewResults')
                  : hasVoted
                    ? t('pollDetail.viewResults')
                    : t('pollDetail.voteNow')}
            </span>
          </div>
        </div>
      </div>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType={ReportTargetType.POLL}
        targetId={poll.id}
      />
    </Link>
  );
};

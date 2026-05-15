import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash, Trophy, PenSquare } from 'lucide-react';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function creatorAvatarUrl(avatarUrl: string | undefined, username: string): string {
  if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob'))) return avatarUrl;
  if (avatarUrl && avatarUrl.trim()) {
    const base = import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080';
    return `${base}${avatarUrl}`;
  }
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;
}

interface TopCreator {
  id: number;
  username: string;
  avatarUrl?: string;
  votes: number;
}

interface PopularTag {
  display: string;
  count: number;
}

interface ExploreRightSidebarProps {
  topCreators: TopCreator[];
  popularTags: PopularTag[];
  onTagClick: (tag: string) => void;
}

const RANK_COLORS = ['text-amber-400', 'text-slate-400', 'text-orange-700', 'text-white/40', 'text-white/40'];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4', '5'];

export function ExploreRightSidebar({ topCreators, popularTags, onTagClick }: ExploreRightSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      {/* Top Creators */}
      <div className="bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('dashboard.topCreators')}</h3>
          </div>
          <button className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors">
            {t('dashboard.seeAll')}
          </button>
        </div>

        <div className="space-y-3">
          {topCreators.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-white/35 text-center py-4">{t('dashboard.topCreatorsEmpty')}</p>
          ) : (
            topCreators.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 group">
                <span className={`text-sm font-bold w-5 text-center shrink-0 ${RANK_COLORS[i] ?? 'text-slate-400 dark:text-white/30'}`}>
                  {RANK_ICONS[i] ?? i + 1}
                </span>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <img
                      src={creatorAvatarUrl(c.avatarUrl, c.username)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${c.username}`; }}
                    />
                  </div>
                  {i === 0 && (
                    <span className="absolute -top-1 -right-1 text-[10px]">👑</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {c.username}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/35">
                    {formatCompact(c.votes)} {t('dashboard.votesLabel')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">🔥 {t('dashboard.popularTags')}</h3>
        </div>

        <div className="space-y-1">
          {popularTags.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-white/35 text-center py-4">{t('dashboard.popularTagsEmpty')}</p>
          ) : (
            popularTags.map((tg) => (
              <button
                key={tg.display}
                type="button"
                onClick={() => onTagClick(tg.display)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-white/75 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                  <Hash className="w-3.5 h-3.5 text-violet-400/60" />
                  {tg.display}
                </span>
                <span className="text-xs text-slate-400 dark:text-white/35 font-medium">
                  {formatCompact(tg.count)} {t('dashboard.statsPolls')}
                </span>
              </button>
            ))
          )}
          <button className="w-full text-center text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium py-1.5 transition-colors">
            {t('dashboard.seeAll')} →
          </button>
        </div>
      </div>

      {/* Create Poll CTA */}
      <div className="rounded-2xl p-6 bg-[#1e1340] dark:bg-[#1e1340] border border-violet-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_100%,rgba(123,47,247,0.25),transparent)] pointer-events-none" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <PenSquare className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">{t('dashboard.createOwnPoll')}</h3>
          <p className="text-white/55 text-xs mb-4 leading-relaxed">{t('dashboard.createOwnPollDesc')}</p>
          <Link
            to="/create-poll"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#7B2FF7] to-[#F107A3] text-white font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-fuchsia-500/20"
          >
            {t('dashboard.createNow')} →
          </Link>
        </div>
      </div>
    </div>
  );
}

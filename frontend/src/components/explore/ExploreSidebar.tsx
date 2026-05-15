import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, TrendingUp, Sparkles, Flame, Clock, Crown as CrownIcon, Monitor, Gamepad2, Clapperboard, Dumbbell, BookOpen, Briefcase, ChevronDown } from 'lucide-react';

interface ExploreSidebarProps {
  filterTag: string;
  filterStatus: string;
  onResetExplore: () => void;
  onScrollToTrending: () => void;
  onScrollToPollGrid: () => void;
  onSetFilterStatus: (s: 'ALL' | 'ACTIVE' | 'ENDED') => void;
  onSetFilterTag: (tag: string) => void;
}

const CATEGORIES = [
  { tag: 'ALL', labelKey: 'dashboard.catAll', Icon: Compass },
  { tag: 'công nghệ', labelKey: 'dashboard.catTech', Icon: Monitor },
  { tag: 'giải trí', labelKey: 'dashboard.catEntertainment', Icon: Clapperboard },
  { tag: 'gaming', labelKey: 'dashboard.catGaming', Icon: Gamepad2 },
  { tag: 'thể thao', labelKey: 'dashboard.catSports', Icon: Dumbbell },
  { tag: 'học tập', labelKey: 'dashboard.catEducation', Icon: BookOpen },
  { tag: 'kinh doanh', labelKey: 'dashboard.catBusiness', Icon: Briefcase },
];

export function ExploreSidebar({
  filterTag,
  filterStatus,
  onResetExplore,
  onScrollToTrending,
  onScrollToPollGrid,
  onSetFilterStatus,
  onSetFilterTag,
}: ExploreSidebarProps) {
  const { t } = useTranslation();

  const navItems = [
    { label: t('navbar.explore'), Icon: Compass, onClick: onResetExplore, active: true },
    { label: t('dashboard.sidebarTrending'), Icon: TrendingUp, onClick: onScrollToTrending },
    { label: t('dashboard.sidebarNewest'), Icon: Sparkles, onClick: () => { onResetExplore(); setTimeout(onScrollToPollGrid, 100); } },
    { label: t('dashboard.sidebarOngoing'), Icon: Flame, onClick: () => onSetFilterStatus('ACTIVE') },
    { label: t('dashboard.sidebarEnded'), Icon: Clock, onClick: () => onSetFilterStatus('ENDED') },
  ];

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 rounded-2xl p-3">
        <nav className="space-y-0.5">
          {navItems.map(({ label, Icon, onClick }) => {
            const isActive = label === t('navbar.explore');
            return (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-violet-700 dark:text-violet-300 border border-violet-500/20'
                    : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-white/40'
                }`} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 rounded-2xl p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3 px-2">
          {t('dashboard.categoriesTitle')}
        </p>
        <div className="space-y-0.5">
          {CATEGORIES.map(({ tag, labelKey, Icon }) => {
            const active = tag === 'ALL' ? filterTag === 'ALL' : filterTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSetFilterTag(tag === 'ALL' ? 'ALL' : tag)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 font-semibold'
                    : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-white/35'}`} />
                {t(labelKey)}
              </button>
            );
          })}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 font-medium transition-all">
            <ChevronDown className="w-4 h-4 shrink-0 text-slate-300 dark:text-white/30" />
            {t('dashboard.seeMore')}
          </button>
        </div>
      </div>

      {/* Upgrade card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#7B2FF7] to-[#F107A3] text-white border border-white/10 shadow-lg shadow-fuchsia-500/20">
        <CrownIcon className="w-8 h-8 mb-3 opacity-90" />
        <p className="font-bold text-base leading-snug mb-1">{t('dashboard.upgradeCardTitle')}</p>
        <p className="text-white/70 text-xs mb-4">{t('dashboard.upgradeCardDesc') || 'Trải nghiệm đầy đủ tính năng và loại bỏ giới hạn.'}</p>
        <Link
          to="/profile"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 font-bold text-sm border border-white/20 transition-colors"
        >
          {t('dashboard.upgradeCardCta')} →
        </Link>
      </div>
    </div>
  );
}

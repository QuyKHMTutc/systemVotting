import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, TrendingUp, Sparkles, Flame, Clock, Crown as CrownIcon } from 'lucide-react';
import { categoryService, type Category } from '../../services/category.service';

interface ExploreSidebarProps {
    filterTag: string;
    filterCategory: string;
    filterStatus: string;
    onResetExplore: () => void;
    onScrollToTrending: () => void;
    onScrollToPollGrid: () => void;
    onSetFilterStatus: (s: 'ALL' | 'ACTIVE' | 'ENDED') => void;
    onSetFilterTag: (tag: string) => void;
    onSetFilterCategory: (slug: string) => void;
}

export function ExploreSidebar({
    filterTag,
    filterCategory,
    onResetExplore,
    onScrollToTrending,
    onScrollToPollGrid,
    onSetFilterStatus,
    onSetFilterTag,
    onSetFilterCategory,
}: ExploreSidebarProps) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        categoryService.getAllCategories().then(setCategories).catch(() => {});
    }, []);

    const navItems = [
        { label: t('navbar.explore'), Icon: Compass, onClick: onResetExplore },
        { label: t('dashboard.sidebarTrending'), Icon: TrendingUp, onClick: onScrollToTrending },
        { label: t('dashboard.sidebarNewest'), Icon: Sparkles, onClick: () => { onResetExplore(); setTimeout(onScrollToPollGrid, 100); } },
        { label: t('dashboard.sidebarOngoing'), Icon: Flame, onClick: () => onSetFilterStatus('ACTIVE') },
        { label: t('dashboard.sidebarEnded'), Icon: Clock, onClick: () => onSetFilterStatus('ENDED') },
    ];

    const isAllActive = !filterCategory && filterTag === 'ALL';

    return (
        <div className="space-y-6">
            {/* Nav */}
            <div className="bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 rounded-2xl p-3">
                <nav className="space-y-0.5">
                    {navItems.map(({ label, Icon, onClick }, idx) => {
                        const isActive = idx === 0;
                        return (
                            <button key={label} type="button" onClick={onClick}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 text-violet-700 dark:text-violet-300 border border-violet-500/20'
                                    : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-white/40'}`} />
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

                {/* ALL */}
                <button type="button" onClick={() => { onSetFilterCategory(''); onSetFilterTag('ALL'); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 ${isAllActive
                        ? 'bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5 font-medium'}`}>
                    <Compass className={`w-4 h-4 shrink-0 ${isAllActive ? 'text-violet-500' : 'text-slate-400 dark:text-white/35'}`} />
                    {t('dashboard.catAll')}
                </button>

                <div className="space-y-0.5">
                    {categories.length === 0
                        ? [...Array(8)].map((_, i) => <div key={i} className="h-9 mx-1 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse mb-0.5" />)
                        : categories.map(cat => {
                            const isActive = filterCategory === cat.slug;
                            return (
                                <button key={cat.id} type="button" onClick={() => onSetFilterCategory(cat.slug)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                                        ? 'bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold'
                                        : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5 font-medium'}`}>
                                    <span className="text-base leading-none w-4 text-center shrink-0">{cat.icon}</span>
                                    <span className="flex-1 text-left">{cat.name}</span>
                                    {cat.pollCount && cat.pollCount > 0 ? (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40'}`}>
                                            {cat.pollCount}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                </div>
            </div>

            {/* Upgrade card */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#7B2FF7] to-[#F107A3] text-white border border-white/10 shadow-lg shadow-fuchsia-500/20">
                <CrownIcon className="w-8 h-8 mb-3 opacity-90" />
                <p className="font-bold text-base leading-snug mb-1">{t('dashboard.upgradeCardTitle')}</p>
                <p className="text-white/70 text-xs mb-4">{t('dashboard.upgradeCardDesc')}</p>
                <Link to="/profile"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 font-bold text-sm border border-white/20 transition-colors">
                    {t('dashboard.upgradeCardCta')} →
                </Link>
            </div>
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import type { Poll, PollPageResponse } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { usePollEventsWebSocket, type PollEventPayload } from '../hooks/usePollEventsWebSocket';
import { useTranslation } from 'react-i18next';
import { TrendingHeroCarousel } from '../components/explore/TrendingHeroCarousel';
import { ExploreSidebar } from '../components/explore/ExploreSidebar';
import { ExploreRightSidebar } from '../components/explore/ExploreRightSidebar';
import { ExplorePollCard } from '../components/explore/ExplorePollCard';
import { Flame, Hash, Search } from 'lucide-react';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}


const Dashboard = () => {
  const { t } = useTranslation();
  const [pollPage, setPollPage] = useState<PollPageResponse | null>(null);
  const [trendingPolls, setTrendingPolls] = useState<Poll[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedPollIds, setVotedPollIds] = useState<number[]>([]);
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '0', 10);
  const filterStatus = (searchParams.get('filter') as 'ALL' | 'ACTIVE' | 'ENDED') || 'ALL';
  const filterTag = searchParams.get('tag') || 'ALL';
  const filterCategory = searchParams.get('category') || '';

  const setCurrentPage = (v: number | ((p: number) => number)) => {
    const next = typeof v === 'function' ? v(currentPage) : v;
    setSearchParams({ page: String(next), filter: filterStatus, tag: filterTag, ...(filterCategory ? { category: filterCategory } : {}) }, { replace: true });
  };
  const setFilterStatus = (s: 'ALL' | 'ACTIVE' | 'ENDED') =>
    setSearchParams({ page: '0', filter: s, tag: filterTag, ...(filterCategory ? { category: filterCategory } : {}) }, { replace: true });
  const setFilterTag = (tag: string) =>
    setSearchParams({ page: '0', filter: filterStatus, tag: tag || 'ALL' }, { replace: true });
  const setFilterCategory = (slug: string) =>
    setSearchParams({ page: '0', filter: filterStatus, tag: 'ALL', ...(slug ? { category: slug } : {}) }, { replace: true });
  const resetExplore = () => { setSearchQuery(''); setSearchParams({ page: '0', filter: 'ALL', tag: 'ALL' }, { replace: true }); };
  const scrollToPollGrid = () => document.getElementById('explore-polls-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToTrending = () => document.getElementById('explore-trending')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    setVotedPollIds(stored);
    if (user) {
      pollService.getMyVotedPolls(0, 500)
        .then((vp) => { const ids = vp.content.map((p) => p.id); setVotedPollIds(ids); localStorage.setItem('votedPolls', JSON.stringify(ids)); })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    pollService.getTrendingPolls(8)
      .then((list) => { if (!cancelled) setTrendingPolls(list); })
      .catch(() => { if (!cancelled) setTrendingPolls([]); })
      .finally(() => { if (!cancelled) setTrendingLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPolls(currentPage, searchQuery, filterTag, filterStatus, filterCategory), 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, filterTag, filterStatus, filterCategory]);

  const patchPoll = (list: Poll[], id: number, fn: (p: Poll) => Poll) => list.map((p) => (p.id === id ? fn(p) : p));

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    setTrendingPolls((prev) => {
      if (payload.type === 'CREATED') {
        if (payload.poll.visibility === 'PRIVATE') return prev;
        if (prev.some((p) => p.id === payload.poll.id)) return prev;
        return [payload.poll, ...prev].slice(0, 8);
      }
      if (payload.type === 'DELETED') return prev.filter((p) => p.id !== payload.pollId);
      if (payload.type === 'VOTED') return patchPoll(prev, payload.pollId, (p) => ({ ...p, options: p.options.map((o) => { const u = payload.options.find((x) => x.optionId === o.id); return u ? { ...o, voteCount: u.voteCount } : o; }) }));
      if (payload.type === 'COMMENT_ADDED') return patchPoll(prev, payload.pollId, (p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      return prev;
    });
    setPollPage((prev) => {
      if (!prev) return prev;
      let content = [...prev.content];
      let total = prev.totalElements;
      const matchFilter = (p: Poll) => {
        if (filterStatus !== 'ALL') { const active = new Date(p.endTime) > new Date(); if (filterStatus === 'ACTIVE' && !active) return false; if (filterStatus === 'ENDED' && active) return false; }
        if (filterTag !== 'ALL' && !p.tags.some((t) => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
        if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
        return true;
      };
      if (payload.type === 'CREATED') {
        if (payload.poll.visibility !== 'PRIVATE' && prev.currentPage === 0 && matchFilter(payload.poll) && !content.some((p) => p.id === payload.poll.id)) {
          content.unshift(payload.poll); content = content.slice(0, prev.pageSize); total += 1;
        }
      } else if (payload.type === 'DELETED') {
        const before = content.length; content = content.filter((p) => p.id !== payload.pollId); if (content.length < before) total = Math.max(0, total - 1);
      } else if (payload.type === 'VOTED') {
        content = patchPoll(content, payload.pollId, (p) => ({ ...p, options: p.options.map((o) => { const u = payload.options.find((x) => x.optionId === o.id); return u ? { ...o, voteCount: u.voteCount } : o; }) }));
      } else if (payload.type === 'COMMENT_ADDED') {
        content = patchPoll(content, payload.pollId, (p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      }
      return { ...prev, content, totalElements: total, totalPages: Math.max(1, Math.ceil(total / prev.pageSize)) };
    });
  }, [filterStatus, filterTag, searchQuery]);

  usePollEventsWebSocket({ onEvent: handlePollEvent });

  const fetchPolls = async (page: number, title: string, tag: string, status: string, category?: string) => {
    setLoading(true);
    try { const data = await pollService.getAllPolls(page, 6, title, tag, status, undefined, undefined, category); setPollPage(data); }
    catch { setError('Failed to load polls.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try { await pollService.deletePoll(id); setTrendingPolls((tp) => tp.filter((p) => p.id !== id)); fetchPolls(currentPage, searchQuery, filterTag, filterStatus, filterCategory); }
    catch (err: unknown) { const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined; alert(msg || 'Failed to delete'); }
  };

  const canDelete = (poll: Poll) => user?.role === 'ADMIN' || user?.id === poll.creator.id;

  const mergedPolls = useMemo(() => {
    const m = new Map<number, Poll>();
    trendingPolls.forEach((p) => m.set(p.id, p));
    pollPage?.content.forEach((p) => m.set(p.id, p));
    return Array.from(m.values());
  }, [trendingPolls, pollPage]);

  const topCreators = useMemo(() => {
    const scores = new Map<number, { username: string; avatarUrl?: string; votes: number }>();
    mergedPolls.forEach((p) => {
      const v = p.options.reduce((s, o) => s + (o.voteCount ?? 0), 0);
      const cur = scores.get(p.creator.id);
      if (!cur) scores.set(p.creator.id, { username: p.creator.username, avatarUrl: p.creator.avatarUrl, votes: v });
      else cur.votes += v;
    });
    return Array.from(scores.entries()).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.votes - a.votes).slice(0, 5);
  }, [mergedPolls]);

  const popularTags = useMemo(() => {
    const c = new Map<string, { display: string; count: number }>();
    mergedPolls.forEach((p) => (p.tags || []).forEach((tag) => { const k = tag.toLowerCase(); const prev = c.get(k); if (prev) prev.count += 1; else c.set(k, { display: tag, count: 1 }); }));
    return Array.from(c.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [mergedPolls]);

  const statsStrip = useMemo(() => {
    let votes = 0, comments = 0, active = 0;
    const now = Date.now();
    mergedPolls.forEach((p) => { votes += p.options.reduce((s, o) => s + (o.voteCount ?? 0), 0); comments += p.commentCount ?? 0; if (new Date(p.endTime).getTime() > now) active += 1; });
    return { votes, comments, active };
  }, [mergedPolls]);

  const totalPolls = pollPage?.totalElements ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0a18] transition-colors">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_280px] gap-6">

          {/* LEFT SIDEBAR */}
          <aside className="order-2 xl:order-1 hidden xl:block">
            <div className="sticky top-24">
              <ExploreSidebar
                filterTag={filterTag}
                filterCategory={filterCategory}
                filterStatus={filterStatus}
                onResetExplore={resetExplore}
                onScrollToTrending={scrollToTrending}
                onScrollToPollGrid={scrollToPollGrid}
                onSetFilterStatus={setFilterStatus}
                onSetFilterTag={setFilterTag}
                onSetFilterCategory={setFilterCategory}
              />
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="order-1 xl:order-2 min-w-0 space-y-6">
            {/* Hero trending */}
            <TrendingHeroCarousel polls={trendingPolls} loading={trendingLoading} />

            {/* Search & Filter bar */}
            <div className="bg-white dark:bg-[#13112a] rounded-2xl border border-slate-200 dark:border-white/8 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="text"
                    placeholder={t('dashboard.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                  />
                </div>
                {/* Tag filter */}
                <div className="relative flex-1 group">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30 group-focus-within:text-violet-500 dark:group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="text"
                    placeholder={t('dashboard.filterTags')}
                    value={filterTag === 'ALL' ? '' : filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all"
                  />
                </div>
                {/* Status filters */}
                <div className="flex gap-2 shrink-0">
                  {(['ALL', 'ACTIVE', 'ENDED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        filterStatus === s
                          ? 'bg-gradient-to-r from-[#7B2FF7] to-[#F107A3] text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/8 text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/80 hover:border-violet-400/40 dark:hover:border-violet-500/25'
                      }`}
                    >
                      {s === 'ALL' ? t('dashboard.filterAll') : s === 'ACTIVE' ? t('dashboard.filterActive') : t('dashboard.filterEnded')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section title */}
            <div id="explore-polls-grid" className="flex items-center justify-between scroll-mt-28">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('dashboard.exploreSectionTitle')}</h2>
                <span className="text-slate-400 dark:text-white/35 text-sm ml-1">{totalPolls > 0 ? `(${totalPolls})` : ''}</span>
              </div>
              <button type="button" onClick={resetExplore} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                {t('dashboard.seeAll')}
              </button>
            </div>

            {/* Poll grid */}
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              </div>
            ) : (pollPage?.content ?? []).length === 0 ? (
              <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-[#13112a]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <span className="text-3xl">🗳️</span>
                </div>
                <p className="text-slate-500 dark:text-white/50 text-base mb-1">{t('dashboard.noPolls')}</p>
                {filterCategory && (
                  <p className="text-xs text-slate-400 dark:text-white/30 mb-3">
                    {t('dashboard.noPollsInCategory')}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('ALL');
                    setFilterTag('ALL');
                    setFilterCategory('');
                  }}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
                >
                  {t('dashboard.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {(pollPage?.content ?? []).map((poll, idx) => (
                  <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <ExplorePollCard
                      poll={poll}
                      hasVoted={votedPollIds.includes(poll.id)}
                      commentCount={poll.commentCount}
                      onDelete={canDelete(poll) ? handleDelete : undefined}
                      showDeleteButton={canDelete(poll)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pollPage && pollPage.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3">
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={pollPage.currentPage === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-violet-400/40 dark:hover:border-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-slate-500 dark:text-white/50 text-sm">
                  <span className="text-slate-900 dark:text-white font-semibold">{pollPage.currentPage + 1}</span> / {pollPage.totalPages}
                </span>
                <button onClick={() => setCurrentPage((p) => Math.min(pollPage.totalPages - 1, p + 1))} disabled={pollPage.currentPage >= pollPage.totalPages - 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#13112a] border border-slate-200 dark:border-white/8 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-violet-400/40 dark:hover:border-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="order-3 hidden xl:block">
            <div className="sticky top-24">
              <ExploreRightSidebar
                topCreators={topCreators}
                popularTags={popularTags}
                onTagClick={setFilterTag}
                communityStats={{
                  totalPolls,
                  votes: statsStrip.votes,
                  comments: statsStrip.comments,
                  active: statsStrip.active,
                }}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

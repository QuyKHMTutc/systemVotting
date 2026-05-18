import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import { Flame, Hash, Menu, Search } from 'lucide-react';

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
  const [votedPollIds, setVotedPollIds] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const [page, setPage] = useState(0);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = (searchParams.get('filter') as 'ALL' | 'ACTIVE' | 'ENDED') || 'ALL';
  const filterTag = searchParams.get('tag') || 'ALL';
  const filterCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('q') || '';

  const setFilterStatus = (s: 'ALL' | 'ACTIVE' | 'ENDED') =>
    setSearchParams({ filter: s, tag: filterTag, ...(filterCategory ? { category: filterCategory } : {}), ...(searchQuery ? { q: searchQuery } : {}) }, { replace: true });
  const setFilterTag = (tag: string) =>
    setSearchParams({ filter: filterStatus, tag: tag || 'ALL', ...(searchQuery ? { q: searchQuery } : {}) }, { replace: true });
  const setFilterCategory = (slug: string) =>
    setSearchParams({ filter: filterStatus, tag: 'ALL', ...(slug ? { category: slug } : {}), ...(searchQuery ? { q: searchQuery } : {}) }, { replace: true });
  const resetExplore = () => { setSearchParams({ filter: 'ALL', tag: 'ALL' }, { replace: true }); };
  const scrollToPollGrid = () => document.getElementById('explore-polls-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToTrending = () => document.getElementById('explore-trending')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    setVotedPollIds(stored);
    if (user) {
      pollService.getMyVotedPolls(0, 500)
        .then((vp) => { const ids = vp.content.map((p) => p.id); setVotedPollIds(ids); localStorage.setItem('votedPolls', JSON.stringify(ids)); })
        .catch(() => { });
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

  // Reset and fetch page 0 when filters change
  useEffect(() => {
    setPage(0);
    const timer = setTimeout(() => {
      fetchPolls(0, searchQuery, filterTag, filterStatus, filterCategory, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterTag, filterStatus, filterCategory]);

  // Fetch page when page state increments (> 0)
  useEffect(() => {
    if (page > 0) {
      fetchPolls(page, searchQuery, filterTag, filterStatus, filterCategory, true);
    }
  }, [page]);

  const patchPoll = (list: Poll[], id: number, fn: (p: Poll) => Poll) => list.map((p) => (p.id === id ? fn(p) : p));

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    const matchFilter = (p: Poll) => {
      if (filterStatus !== 'ALL') { const active = new Date(p.endTime) > new Date(); if (filterStatus === 'ACTIVE' && !active) return false; if (filterStatus === 'ENDED' && active) return false; }
      if (filterTag !== 'ALL' && !p.tags.some((t) => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
      if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      return true;
    };

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

    setPolls((prev) => {
      let list = [...prev];
      if (payload.type === 'CREATED') {
        if (payload.poll.visibility !== 'PRIVATE' && matchFilter(payload.poll) && !list.some((p) => p.id === payload.poll.id)) {
          list.unshift(payload.poll);
        }
      } else if (payload.type === 'DELETED') {
        list = list.filter((p) => p.id !== payload.pollId);
      } else if (payload.type === 'VOTED') {
        list = patchPoll(list, payload.pollId, (p) => ({ ...p, options: p.options.map((o) => { const u = payload.options.find((x) => x.optionId === o.id); return u ? { ...o, voteCount: u.voteCount } : o; }) }));
      } else if (payload.type === 'COMMENT_ADDED') {
        list = patchPoll(list, payload.pollId, (p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      }
      return list;
    });

    setPollPage((prev) => {
      if (!prev) return prev;
      let content = [...prev.content];
      let total = prev.totalElements;
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

  const fetchPolls = async (pageToFetch: number, title: string, tag: string, status: string, category?: string, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
      // Thêm một chút độ trễ mô phỏng mạng để hiển thị UI loading rõ ràng hơn
      // do chạy local API phản hồi quá nhanh (dưới 10ms) khiến user không thấy loader
      await new Promise(resolve => setTimeout(resolve, 600));
    } else {
      setLoading(true);
    }
    try {
      const data = await pollService.getAllPolls(pageToFetch, 6, title, tag, status, undefined, undefined, category);
      setPollPage(data);
      setPolls(prev => isLoadMore ? [...prev, ...data.content] : data.content);
      setHasMore(data.currentPage + 1 < data.totalPages);
    }
    catch {
      setError('Failed to load polls.');
    }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await pollService.deletePoll(id);
      setTrendingPolls((tp) => tp.filter((p) => p.id !== id));
      setPolls((prev) => prev.filter((p) => p.id !== id));
    }
    catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      alert(msg || 'Failed to delete');
    }
  };

  // Intersection Observer for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const canDelete = (poll: Poll) => user?.role === 'ADMIN' || user?.id === poll.creator.id;

  const mergedPolls = useMemo(() => {
    const m = new Map<number, Poll>();
    trendingPolls.forEach((p) => m.set(p.id, p));
    polls.forEach((p) => m.set(p.id, p));
    return Array.from(m.values());
  }, [trendingPolls, polls]);

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
    <div className="h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0b0a18] transition-colors">
      <Navbar />

      <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar w-full">
        <div className="flex flex-col min-h-full max-w-[1700px] mx-auto px-4 xl:px-8 pb-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm shrink-0">{error}</div>}

          <div className="flex flex-1 w-full items-start">

            {/* LEFT SIDEBAR */}
            <aside className={`sticky top-2 pt-2 h-[calc(100vh-100px)] z-40 hidden xl:flex xl:flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-300 dark:border-white/20 ${sidebarOpen ? 'w-[240px] pr-4 mr-4' : 'w-0 pr-0 mr-6'}`}>
            {/* Collapse toggle (absolute on the right edge) */}
            <div className="absolute -right-4 top-2 z-20 group">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#13112a] border-2 border-slate-300 dark:border-white/30 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-400 dark:hover:border-violet-400/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <Menu className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? '' : ''}`} />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#1e1e2d] text-white text-xs font-semibold rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[70] pointer-events-none">
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-r-4 border-transparent border-r-[#1e1e2d]"></div>
                {sidebarOpen ? t('dashboard.collapseSidebar') : t('dashboard.openSidebar')}
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto overflow-x-hidden hover-scrollbar transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>
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
          <main className="flex-1 min-w-0 flex flex-col items-center pt-4">
            <div className="w-full max-w-5xl space-y-6 transition-all duration-300">
              {/* Hero trending */}
              <TrendingHeroCarousel polls={trendingPolls} loading={trendingLoading} />


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
              {loading && polls.length === 0 ? (
                <div className="flex justify-center items-center py-24">
                  <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                </div>
              ) : polls.length === 0 ? (
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
                    onClick={resetExplore}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
                  >
                    {t('dashboard.clearFilters')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    {polls.map((poll, idx) => (
                      <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
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

                  {/* Infinite Scroll Anchor */}
                  <div ref={loaderRef} className="py-8 flex justify-center items-center w-full">
                    {loadingMore && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                        <p className="text-xs text-slate-400 dark:text-white/30 font-medium">Đang tải thêm bình chọn...</p>
                      </div>
                    )}
                    {!hasMore && polls.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-white/20 font-medium mt-4">
                        Bạn đã xem hết tất cả bình chọn 🎉
                      </p>
                    )}
                  </div>
                </>
              )}

            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="sticky top-2 pt-2 h-[calc(100vh-100px)] hidden xl:flex xl:flex-col w-[296px] shrink-0 ml-2 pl-4 overflow-y-auto hover-scrollbar">
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
          </aside>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;

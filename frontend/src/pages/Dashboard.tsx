import { useEffect, useState } from 'react';
import { pollService } from '../services/poll.service';
import type { Poll, PollPageResponse } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PollCard } from '../components/PollCard';
import { usePollEventsWebSocket, type PollEventPayload } from '../hooks/usePollEventsWebSocket';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [pollPage, setPollPage] = useState<PollPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedPollIds, setVotedPollIds] = useState<number[]>([]);
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '0', 10);
  const filterStatus = (searchParams.get('filter') as 'ALL' | 'ACTIVE' | 'ENDED') || 'ALL';
  const filterTag = searchParams.get('tag') || 'ALL';

  const setCurrentPage = (valOrFn: number | ((prev: number) => number)) => {
    const next = typeof valOrFn === 'function' ? valOrFn(currentPage) : valOrFn;
    setSearchParams({ page: String(next), filter: filterStatus, tag: filterTag }, { replace: true });
  };

  const setFilterStatusConfig = (status: 'ALL' | 'ACTIVE' | 'ENDED') => {
    setSearchParams({ page: '0', filter: status, tag: filterTag }, { replace: true });
  };

  const setFilterTagValue = (tag: string) => {
    setSearchParams({ page: '0', filter: filterStatus, tag: tag || 'ALL' }, { replace: true });
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    setVotedPollIds(stored);
    if (user) {
      pollService.getMyVotedPolls().then((votedPolls) => {
        const votedIds = votedPolls.map((p) => p.id);
        setVotedPollIds(votedIds);
        localStorage.setItem('votedPolls', JSON.stringify(votedIds));
      }).catch(() => {});
    }
  // Dùng user?.id thay vì user object — tránh re-fetch mỗi lần plan/avatar update tạo object mới
  }, [user?.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPolls(currentPage, searchQuery, filterTag, filterStatus);
    }, 300);
    return () => clearTimeout(t);
  }, [currentPage, searchQuery, filterTag, filterStatus]);

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    setPollPage(prev => {
      if (!prev) return prev;
      let newContent = [...prev.content];

      if (payload.type === 'CREATED') {
        // Check current filter criteria simply: if not ALL, just let the standard polling/refresh pull it in naturally
        // To be safe, we just gently insert at the top if there's no duplicate
        if (!newContent.some(p => p.id === payload.poll.id)) {
          newContent.unshift(payload.poll);
        }
      } else if (payload.type === 'DELETED') {
        newContent = newContent.filter(p => p.id !== payload.pollId);
      } else if (payload.type === 'VOTED') {
        newContent = newContent.map(p => {
          if (p.id === payload.pollId) {
            return {
              ...p,
              options: p.options.map(opt => {
                const updated = payload.options.find(o => o.optionId === opt.id);
                return updated ? { ...opt, voteCount: updated.voteCount } : opt;
              })
            };
          }
          return p;
        });
      } else if (payload.type === 'COMMENT_ADDED') {
        newContent = newContent.map(p => {
          if (p.id === payload.pollId) {
            return { ...p, commentCount: (p.commentCount || 0) + 1 };
          }
          return p;
        });
      }

      return { ...prev, content: newContent };
    });
  }, []);

  usePollEventsWebSocket({ onEvent: handlePollEvent });

  const fetchPolls = async (page: number, title: string, tag: string, status: string) => {
    setLoading(true);
    try {
      const data = await pollService.getAllPolls(page, 6, title, tag, status);
      setPollPage(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to load polls. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await pollService.deletePoll(id);
      fetchPolls(currentPage, searchQuery, filterTag, filterStatus);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete poll');
    }
  };

  const canDelete = (poll: Poll) => user?.role === 'ADMIN' || user?.id === poll.creator.id;

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        {error && (
          <div className="glass-panel bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {/* Search & Filters */}
        <div className="glass-panel p-5 rounded-2xl mb-10 border border-slate-200 dark:border-white/10 transition-colors">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 group/input">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('dashboard.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-300 shadow-sm dark:shadow-none dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 dark:focus:bg-white/[0.06] transition-all duration-200"
                />
              </div>
              <div className="relative flex-1 group/input">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('dashboard.filterTags')}
                  value={filterTag === 'ALL' ? '' : filterTag}
                  onChange={(e) => setFilterTagValue(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/[0.04] border border-slate-300 shadow-sm dark:shadow-none dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 dark:focus:bg-white/[0.06] transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar shrink-0">
              {(['ALL', 'ACTIVE', 'ENDED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatusConfig(status)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                    filterStatus === status
                      ? 'bg-indigo-600 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white border-slate-300 shadow-sm dark:shadow-none dark:bg-white/[0.04] dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/20'
                  }`}
                >
                  {status === 'ALL' ? t('dashboard.filterAll') : status === 'ACTIVE' ? t('dashboard.filterActive') : t('dashboard.filterEnded')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Poll Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {(pollPage?.content ?? []).length === 0 ? (
              <div className="col-span-full glass-panel py-20 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/20 transition-colors">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 dark:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-white/60 text-lg mb-2 transition-colors">{t('dashboard.noPolls')}</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatusConfig('ALL');
                    setFilterTagValue('ALL');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {t('dashboard.clearFilters')}
                </button>
              </div>
            ) : (
              (pollPage?.content ?? []).map((poll, index) => (
                <div
                  key={poll.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <PollCard
                    poll={poll}
                    hasVoted={votedPollIds.includes(poll.id)}
                    commentCount={poll.commentCount}
                    onDelete={canDelete(poll) ? handleDelete : undefined}
                    showDeleteButton={canDelete(poll)}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pollPage && pollPage.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={pollPage.currentPage === 0}
              className="p-3 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-slate-600 dark:text-white/80 font-medium">
              Page <span className="text-slate-900 dark:text-white">{pollPage.currentPage + 1}</span> of {pollPage.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pollPage.totalPages - 1, p + 1))}
              disabled={pollPage.currentPage >= pollPage.totalPages - 1}
              className="p-3 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { pollService } from '../services/poll.service';
import type { PollPageResponse } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
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
        // Load voted polls from localStorage so we can reflect vote status on cards
        const stored = JSON.parse(localStorage.getItem('votedPolls') || '[]');
        setVotedPollIds(stored);
        
        // Also sync from backend since localStorage is cleared on logout
        if (user) {
            pollService.getMyVotedPolls().then((votedPolls) => {
                const votedIds = votedPolls.map(p => p.id);
                setVotedPollIds(votedIds);
                localStorage.setItem('votedPolls', JSON.stringify(votedIds));
            }).catch(err => console.error("Failed to sync voted polls", err));
        }
    }, [user]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPolls(currentPage, searchQuery, filterTag, filterStatus);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchQuery, filterTag, filterStatus]);

    const fetchPolls = async (page: number, title: string, tag: string, status: string) => {
        setLoading(true);
        try {
            const data = await pollService.getAllPolls(page, 6, title, tag, status); // 6 polls per page
            setPollPage(data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setError('Failed to load polls. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this poll?')) {
            try {
                await pollService.deletePoll(id);
                fetchPolls(currentPage, searchQuery, filterTag, filterStatus); // Refresh list
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to delete poll');
            }
        }
    };

    return (
        <div className="min-h-screen pb-12">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Active Polls</h1>
                        <p className="text-indigo-200/80">Discover and participate in ongoing community votes.</p>
                    </div>
                    <Link
                        to="/create-poll"
                        className="px-6 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] uppercase tracking-wider text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Poll
                    </Link>
                </div>

                {error && (
                    <div className="glass-panel bg-red-500/10 border-red-500/50 text-red-200 p-4 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {/* Search and Filter Controls */}
                <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between border-white/5">
                    <div className="flex w-full gap-4 flex-col md:flex-row">
                        <div className="relative w-full md:w-1/2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300/50" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>
                        <div className="relative w-full md:w-1/2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300/50" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Filter by Tag (e.g. Game)"
                                value={filterTag === 'ALL' ? '' : filterTag}
                                onChange={(e) => setFilterTagValue(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar shrink-0">
                        {(['ALL', 'ACTIVE', 'ENDED'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatusConfig(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${filterStatus === status ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10'}`}
                            >
                                {status === 'ALL' ? 'All Polls' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                            const pollsToDisplay = pollPage?.content || [];

                            if (pollsToDisplay.length === 0) {
                                return (
                                    <div className="col-span-full glass-panel py-16 text-center rounded-2xl border-dashed">
                                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-indigo-200/60 text-lg">No polls found matching your criteria.</p>
                                        <button onClick={() => { setSearchQuery(''); setFilterStatusConfig('ALL'); setFilterTagValue('ALL'); }} className="text-indigo-400 hover:text-indigo-300 mt-3 inline-block font-medium">Clear Filters</button>
                                    </div>
                                );
                            }

                            return pollsToDisplay.map((poll, index) => {
                                const isActive = new Date(poll.endTime) > new Date();
                                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

                                return (
                                    <div 
                                        key={poll.id} 
                                        className="glass-panel p-6 rounded-2xl transition-all duration-300 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] hover:-translate-y-1.5 relative overflow-hidden group flex flex-col h-full animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Decorative Gradient Background overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="relative z-10 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-2">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shadow-sm transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                        {isActive ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        {isActive ? 'Active' : 'Ended'}
                                                    </span>
                                                    {poll.tags && poll.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[50%]">
                                                            {poll.tags.slice(0, 3).map(tag => (
                                                                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border shadow-sm bg-indigo-500/10 text-indigo-300 border-indigo-500/20 truncate">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                            {poll.tags.length > 3 && (
                                                                <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-white/5 text-indigo-300/70 border border-white/10">
                                                                    +{poll.tags.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {(user?.role === 'ADMIN' || user?.id === poll.creator.id) && (
                                                    <button
                                                        onClick={() => handleDelete(poll.id)}
                                                        className="text-white/30 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5 opacity-0 group-hover:opacity-100"
                                                        title="Delete Poll"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <h2 className="text-2xl font-extrabold text-white mb-3 line-clamp-2 leading-tight">{poll.title}</h2>

                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-4 text-sm mt-1">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                                                        {poll.creator.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-indigo-200/60 text-[11px] leading-tight">Created by</span>
                                                        <span className="text-white/90 font-medium leading-tight">{poll.creator.username}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="flex justify-between items-center text-xs text-indigo-200/70 mb-5 py-3 border-y border-white/5">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-bold text-sm mb-0.5">{totalVotes}</span>
                                                        <span>Votes</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/10"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-bold text-sm mb-0.5">{poll.options.length}</span>
                                                        <span>Options</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/10"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-white font-medium mb-0.5">{new Date(poll.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        <span>Ends</span>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/poll/${poll.id}`}
                                                    className={`block text-center w-full py-3.5 px-4 rounded-xl transition-all font-bold uppercase tracking-wider text-xs ${
                                                        !isActive
                                                            ? 'bg-transparent text-white/50 border border-white/10 hover:bg-white/5 hover:text-white'
                                                            : votedPollIds.includes(poll.id)
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                            : 'bg-transparent border border-pink-500/50 text-pink-400 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 hover:border-transparent hover:text-white hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                                    }`}
                                                >
                                                    {!isActive ? 'View Results' : votedPollIds.includes(poll.id) ? 'View Results' : 'Vote Now'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && pollPage && pollPage.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={pollPage.number === 0}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                            aria-label="Previous Page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="text-indigo-200/80 font-medium">
                            <span className="text-white">Page {pollPage.number + 1}</span> of {pollPage.totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(pollPage.totalPages - 1, p + 1))}
                            disabled={pollPage.number >= pollPage.totalPages - 1}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                            aria-label="Next Page"
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

import { useEffect, useState } from 'react';
import { pollService } from '../services/poll.service';
import type { PollPageResponse } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const [pollPage, setPollPage] = useState<PollPageResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');
    const { user } = useAuth();

    useEffect(() => {
        fetchPolls(currentPage);
    }, [currentPage]);

    const fetchPolls = async (page: number) => {
        setLoading(true);
        try {
            const data = await pollService.getAllPolls(page, 6); // 9 polls per page fits a 3x3 grid
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
                fetchPolls(currentPage); // Refresh list
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
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
                    >
                        Create New Poll
                    </Link>
                </div>

                {error && (
                    <div className="glass-panel bg-red-500/10 border-red-500/50 text-red-200 p-4 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {/* Search and Filter Controls */}
                <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border-white/5">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300/50" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search polls by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        {(['ALL', 'ACTIVE', 'ENDED'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
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
                            const filteredPolls = pollPage?.content.filter(poll => {
                                const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase());
                                const isActive = new Date(poll.endTime) > new Date();
                                const matchesStatus = filterStatus === 'ALL'
                                    ? true
                                    : filterStatus === 'ACTIVE' ? isActive : !isActive;
                                return matchesSearch && matchesStatus;
                            }) || [];

                            if (filteredPolls.length === 0) {
                                return (
                                    <div className="col-span-full glass-panel py-16 text-center rounded-2xl border-dashed">
                                        <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-indigo-200/60 text-lg">No polls found matching your criteria.</p>
                                        <button onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }} className="text-indigo-400 hover:text-indigo-300 mt-3 inline-block font-medium">Clear Filters</button>
                                    </div>
                                );
                            }

                            return filteredPolls.map((poll) => {
                                const isActive = new Date(poll.endTime) > new Date();
                                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

                                return (
                                    <div key={poll.id} className="glass-panel p-6 rounded-2xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden group flex flex-col h-full">
                                        {/* Decorative Gradient Background overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="relative z-10 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${isActive ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                                                    {isActive ? '● Active' : '○ Ended'}
                                                </span>

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
                                                <div className="flex items-center gap-2 mb-4 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                                                        {poll.creator.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-indigo-200/60 text-xs">Created by</span>
                                                        <span className="text-white/90 font-medium leading-none">{poll.creator.username}</span>
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
                                                    className={`block text-center w-full py-3 px-4 rounded-xl transition-all font-medium ${isActive ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                                                >
                                                    {isActive ? 'Vote Now' : 'View Results'}
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

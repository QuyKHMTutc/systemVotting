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
    const { user } = useAuth();

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        try {
            const data = await pollService.getAllPolls(0, 10);
            setPollPage(data);
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
                fetchPolls(); // Refresh list
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

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pollPage?.content.map((poll) => {
                            const isActive = new Date(poll.endTime) > new Date();
                            return (
                                <div key={poll.id} className="glass-panel p-6 rounded-2xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden group">
                                    {/* Decorative Gradient Background overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isActive ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                                                {isActive ? 'Active' : 'Ended'}
                                            </span>

                                            {(user?.role === 'ADMIN' || user?.id === poll.creator.id) && (
                                                <button
                                                    onClick={() => handleDelete(poll.id)}
                                                    className="text-white/40 hover:text-red-400 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{poll.title}</h2>

                                        <div className="text-sm text-indigo-200/60 mb-6 space-y-1 mt-4">
                                            <p>Created by: <span className="text-indigo-200/90">{poll.creator.username}</span></p>
                                            <p>Ends: {new Date(poll.endTime).toLocaleDateString()}</p>
                                            <p>Options: {poll.options.length}</p>
                                        </div>

                                        <Link
                                            to={`/poll/${poll.id}`}
                                            className="block text-center w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors font-medium"
                                        >
                                            {isActive ? 'Vote Now' : 'View Results'}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}

                        {pollPage?.content.length === 0 && (
                            <div className="col-span-full glass-panel py-16 text-center rounded-2xl border-dashed">
                                <p className="text-indigo-200/60 text-lg">No polls are currently active.</p>
                                <Link to="/create-poll" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block font-medium">Be the first to create one!</Link>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

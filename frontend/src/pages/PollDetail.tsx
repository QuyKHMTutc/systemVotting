import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import api from '../services/api';
import Navbar from '../components/Navbar';

const PollDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchPoll(Number(id));
        }
    }, [id]);

    const fetchPoll = async (pollId: number) => {
        try {
            const data = await pollService.getPollById(pollId);
            setPoll(data);
        } catch (err: any) {
            setError('Failed to load poll details.');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (!selectedOption) return;
        setVoting(true);
        setError('');

        try {
            await api.post(`/votes/poll/${poll?.id}/option/${selectedOption}`);
            // Refresh poll data to get updated vote counts
            if (poll) {
                await fetchPoll(poll.id);
            }
            setSelectedOption(null); // Reset selection
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit vote. You might have already voted.');
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pb-12">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="min-h-screen pb-12">
                <Navbar />
                <div className="max-w-3xl mx-auto px-6 text-center text-white py-20 glass-panel rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4">Poll Not Found</h2>
                    <button onClick={() => navigate('/')} className="text-indigo-300 hover:text-indigo-200 underline">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    const isActive = new Date(poll.endTime) > new Date();
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return (
        <div className="min-h-screen pb-12">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6">
                <button
                    onClick={() => navigate('/')}
                    className="text-indigo-300 hover:text-indigo-100 mb-6 flex items-center transition-colors group text-sm"
                >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Dashboard
                </button>

                <div className="glass-panel p-8 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                        <div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isActive ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'} mb-4 inline-block`}>
                                {isActive ? 'Active' : 'Ended'}
                            </span>
                            <h1 className="text-3xl font-bold text-white mb-2">{poll.question}</h1>
                            <p className="text-indigo-200/60 text-sm">
                                Created by <span className="text-white">{poll.creatorUsername}</span> • Ends on {new Date(poll.endTime).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 mb-8">
                        {poll.options.map((option) => {
                            const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                            const isSelected = selectedOption === option.id;

                            return (
                                <div
                                    key={option.id}
                                    onClick={() => isActive ? setSelectedOption(option.id) : null}
                                    className={`relative overflow-hidden rounded-xl border transition-all duration-300 p-4 ${isActive ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default'} ${isSelected ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/10 bg-white/5'}`}
                                >
                                    {/* Progress Bar Background */}
                                    <div
                                        className="absolute inset-0 bg-white/10"
                                        style={{ width: `${percentage}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                    ></div>

                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {isActive && (
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-400' : 'border-white/30'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div>}
                                                </div>
                                            )}
                                            <span className="text-white font-medium text-lg">{option.content}</span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-white font-bold block">{percentage}%</span>
                                            <span className="text-indigo-200/60 text-xs">{option.voteCount} votes</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                        <div className="text-indigo-200/80">
                            Total Votes: <span className="text-white font-bold">{totalVotes}</span>
                        </div>

                        {isActive && (
                            <button
                                onClick={handleVote}
                                disabled={!selectedOption || voting}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {voting ? 'Submitting...' : 'Submit Vote'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PollDetail;

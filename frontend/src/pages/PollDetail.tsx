import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import confetti from 'canvas-confetti';
import { Share2, Check, X } from 'lucide-react';
import PostActions from '../components/post/PostActions';
import CommentList from '../components/comments/CommentList';
import CommentInput from '../components/comments/CommentInput';
import { commentService } from '../services/comment.service';
import type { Comment } from '../services/comment.service';

const COLORS = ['#818cf8', '#c084fc', '#f472b6', '#34d399', '#fbbf24', '#60a5fa'];

const PollDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    // Comment State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState('');

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (id) {
            // Check local storage for quick UI update
            const voted = JSON.parse(localStorage.getItem('votedPolls') || '[]');
            if (voted.includes(Number(id))) {
                setHasVoted(true);
            }
            // Verify with server for accuracy
            checkVoteStatus(Number(id));
            fetchPoll(Number(id));
            fetchComments(Number(id));
        }
    }, [id]);

    const fetchComments = async (pollId: number) => {
        setLoadingComments(true);
        try {
            const data = await commentService.getCommentsByPollId(pollId);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleCommentSubmit = async (content: string) => {
        if (!poll) return;
        setCommentError('');
        try {
            await commentService.createComment({ pollId: poll.id, content });
            fetchComments(poll.id);
        } catch (err: any) {
            setCommentError(err.response?.data?.message || 'Failed to post comment');
        }
    };

    const handleReplySubmit = async (parentId: number, content: string) => {
        if (!poll) return;
        try {
            await commentService.createComment({
                pollId: poll.id,
                parentId,
                content
            });
            fetchComments(poll.id);
        } catch (err: any) {
            console.error('Failed to post reply:', err);
        }
    };

    const checkVoteStatus = async (pollId: number) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return; // Not logged in
            
            const response = await api.get(`/votes/check?pollId=${pollId}`);
            if (response.data?.data?.hasVoted) {
                setHasVoted(true);
                if (response.data.data.optionId) {
                    setSelectedOption(response.data.data.optionId);
                }
            }
        } catch (err) {
            console.error('Failed to check vote status relative to the server', err);
        }
    };

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
            await api.post('/votes', {
                pollId: poll?.id,
                optionId: selectedOption
            });
            // Refresh poll data to get updated vote counts
            if (poll) {
                await fetchPoll(poll.id);
            }

            const voted = JSON.parse(localStorage.getItem('votedPolls') || '[]');
            if (poll?.id && !voted.includes(poll.id)) {
                voted.push(poll.id);
                localStorage.setItem('votedPolls', JSON.stringify(voted));
            }
            setHasVoted(true);
            
            // Trigger fireworks animation
            fireworkEffect();
            
            setSelectedOption(null); // Reset selection
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to submit vote. You might have already voted.';
            setError(errorMsg);
            if (err.response?.status === 400 || errorMsg.toLowerCase().includes('already voted')) {
                const voted = JSON.parse(localStorage.getItem('votedPolls') || '[]');
                if (poll?.id && !voted.includes(poll.id)) {
                    voted.push(poll.id);
                    localStorage.setItem('votedPolls', JSON.stringify(voted));
                }
                setHasVoted(true);
            }
        } finally {
            setVoting(false);
        }
    };

    const fireworkEffect = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
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
    const showResults = hasVoted || !isActive;

    const chartData = poll.options.map(opt => {
        const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
        return {
            name: opt.text.length > 15 ? opt.text.substring(0, 15) + '...' : opt.text,
            votes: opt.voteCount,
            percentage: percentage,
            fullText: opt.text
        };
    });

    // Custom Tooltip for the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e1e2f]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-white font-medium text-sm mb-1">{payload[0].payload.fullText}</p>
                    <p className="text-indigo-300 font-bold">{payload[0].value} votes ({payload[0].payload.percentage}%)</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen pb-12">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 relative">
                {/* Close button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -top-4 right-4 z-20 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:rotate-90"
                    title="Thoát"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="glass-panel p-8 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6 relative">
                        <div className="pr-12">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isActive ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'} mb-4 inline-block`}>
                                {isActive ? 'Active' : 'Ended'}
                            </span>
                            <h1 className="text-3xl font-bold text-white mb-2">{poll.title}</h1>
                            <p className="text-indigo-200/60 text-sm">
                                Created by <span className="text-white">{poll.creator.username}</span> • Ends on {new Date(poll.endTime).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={handleShare}
                            className="absolute top-0 right-0 p-2.5 bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white rounded-xl transition-all border border-white/10 flex items-center justify-center group"
                            title="Copy poll link"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            {copied && (
                                <span className="absolute -bottom-8 right-0 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 animate-fade-in-up">
                                    Link copied!
                                </span>
                            )}
                        </button>
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
                                    onClick={() => (isActive && !hasVoted) ? setSelectedOption(option.id) : null}
                                    className={`relative overflow-hidden rounded-xl border transition-all duration-300 p-4 ${(isActive && !hasVoted) ? 'cursor-pointer hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'cursor-default'} ${isSelected ? 'border-pink-500 bg-gradient-to-r from-pink-500/10 to-purple-500/10 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'border-white/10 bg-white/5'}`}
                                >
                                    {/* Progress Bar Background */}
                                    {showResults && (
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-r border-white/5 shadow-[inset_-2px_0_10px_rgba(255,255,255,0.05)]"
                                            style={{ width: `${percentage}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        ></div>
                                    )}

                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {isActive && !hasVoted && (
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]' : 'border-white/30'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full"></div>}
                                                </div>
                                            )}
                                            <span className="text-white font-medium text-lg">{option.text}</span>
                                        </div>

                                        <div className="text-right">
                                            {showResults && (
                                                <>
                                                    <span className="text-white font-bold block">{percentage}%</span>
                                                    <span className="text-indigo-200/60 text-xs">{option.voteCount} votes</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chart Visualization */}
                    {totalVotes > 0 && showResults && (
                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                Live Visualization
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <XAxis
                                            dataKey="name"
                                            stroke="#818cf8"
                                            tick={{ fill: '#a5b4fc', fontSize: 12 }}
                                            axisLine={{ stroke: '#4f46e5', opacity: 0.3 }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#818cf8"
                                            tick={{ fill: '#a5b4fc', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="votes" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                            {chartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                        <div className="text-indigo-200/80">
                            Total Votes: <span className="text-white font-bold">{showResults ? totalVotes : '?'}</span>
                        </div>

                        {isActive && !hasVoted && (
                            <button
                                onClick={handleVote}
                                disabled={!selectedOption || voting}
                                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                            >
                                {voting ? 'Submitting...' : 'Submit Vote'}
                            </button>
                        )}
                        {hasVoted && (
                            <div className="px-6 py-2.5 bg-green-500/10 text-green-400 font-medium rounded-xl border border-green-500/20 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                You already voted
                            </div>
                        )}
                    </div>

                    <PostActions 
                        commentsCount={comments.length}
                        onCommentClick={() => setShowComments(!showComments)}
                        onShareClick={handleShare}
                        hasCopied={copied}
                    />

                    {/* Inline Comment Section */}
                    {showComments && (
                        <div className="border-t border-white/10 animate-fade-in-up flex flex-col h-[500px] -mx-8 -mb-8 mt-2 bg-black/20 rounded-b-2xl">
                            
                            {/* Scrollable Comment List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative">
                                {loadingComments && comments.length === 0 ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center text-white/40 py-6 border border-dashed border-white/10 rounded-xl">
                                        No comments yet. Be the first to share your thoughts!
                                    </div>
                                ) : (
                                    <>
                                        {loadingComments && (
                                            <div className="absolute top-2 right-4 z-10">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                                            </div>
                                        )}
                                        <CommentList comments={comments} onReplySubmit={handleReplySubmit} />
                                    </>
                                )}
                            </div>
                            
                            {/* Sticky Comment Input */}
                            <div className="shrink-0 p-4 border-t border-white/10 bg-[#1a1a1a]/80 backdrop-blur-md rounded-b-2xl">
                                {commentError && <div className="text-red-400 text-sm mb-2 ml-12">{commentError}</div>}
                                <CommentInput onSubmit={handleCommentSubmit} placeholder="Write a comment..." />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PollDetail;

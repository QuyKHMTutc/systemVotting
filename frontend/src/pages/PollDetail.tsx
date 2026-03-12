import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Share2, Check, X } from 'lucide-react';
import PostActions from '../components/post/PostActions';
import CommentList from '../components/comments/CommentList';
import CommentInput from '../components/comments/CommentInput';
import { commentService } from '../services/comment.service';
import type { Comment } from '../services/comment.service';
import { timeAgo, endsIn } from '../utils/date';
import { getTagPillClass } from '../utils/tagPills';
import confetti from 'canvas-confetti';


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

  const [showComments, setShowComments] = useState(false);
  const [barAnimated, setBarAnimated] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState('');

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchComments = useCallback(async (pollId: number) => {
    setLoadingComments(true);
    try {
      const data = await commentService.getCommentsByPollId(pollId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleCommentSubmit = async (content: string, isAnonymous: boolean) => {
    if (!poll) return;
    setCommentError('');
    try {
      await commentService.createComment({ pollId: poll.id, content, isAnonymous });
      fetchComments(poll.id);
    } catch (err: any) {
      setCommentError(err.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleReplySubmit = async (parentId: number, content: string, isAnonymous: boolean) => {
    if (!poll) return;
    try {
      await commentService.createComment({ pollId: poll.id, parentId, content, isAnonymous });
      fetchComments(poll.id);
    } catch (err: any) {
      console.error('Failed to post reply:', err);
    }
  };

  const checkVoteStatus = async (pollId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await api.get(`/votes/check?pollId=${pollId}`);
      if (response.data?.data?.hasVoted) {
        setHasVoted(true);
        if (response.data.data.optionId) setSelectedOption(response.data.data.optionId);
      }
    } catch (err) {
      console.error('Failed to check vote status', err);
    }
  };

  const fetchPoll = useCallback(async (pollId: number) => {
    try {
      const data = await pollService.getPollById(pollId);
      setPoll(data);
    } catch {
      setError('Failed to load poll details.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fireworkEffect = () => {
    const duration = 2500;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 3,
        spread: 70,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 100);
  };

  const handleVote = async () => {
    if (!selectedOption) return;
    setVoting(true);
    setError('');
    try {
      await api.post('/votes', { pollId: poll?.id, optionId: selectedOption });
      if (poll) await fetchPoll(poll.id);
      const voted = JSON.parse(localStorage.getItem('votedPolls') || '[]');
      if (poll?.id && !voted.includes(poll.id)) {
        voted.push(poll.id);
        localStorage.setItem('votedPolls', JSON.stringify(voted));
      }
      setHasVoted(true);
      fireworkEffect();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit vote. You might have already voted.';
      setError(msg);
      if (err.response?.status === 400) {
        setHasVoted(true);
        if (poll) await fetchPoll(poll.id);
      }
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    if (id) {
      const voted = JSON.parse(localStorage.getItem('votedPolls') || '[]');
      if (voted.includes(Number(id))) setHasVoted(true);
      checkVoteStatus(Number(id));
      fetchPoll(Number(id));
      fetchComments(Number(id));
    }
  }, [id, fetchPoll, fetchComments]);

  useEffect(() => {
    if (hasVoted || (poll && new Date(poll.endTime) <= new Date())) {
      const t = setTimeout(() => setBarAnimated(true), 150);
      return () => clearTimeout(t);
    }
    setBarAnimated(false);
  }, [hasVoted, poll]);

  if (loading) {
    return (
      <div className="min-h-screen pb-12">
        <Navbar />
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen pb-12">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Poll not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  const showResults = hasVoted || !isActive;

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-2 right-0 z-20 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-all"
          title="Back"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 animate-modal-enter shadow-2xl shadow-black/30">
          {/* Header */}
          <div className="p-6 sm:p-8 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isActive ? 'Active' : 'Ended'}
              </span>
              {poll.tags?.map((tag) => (
                <span
                  key={tag}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getTagPillClass(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{poll.title}</h1>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/20 shadow-lg shadow-indigo-500/20">
                  {poll.creator.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-white/90 font-medium block">{poll.creator.username}</span>
                  <span className="text-white/50 text-sm">{timeAgo(poll.createdAt)} · {endsIn(poll.endTime)}</span>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all border border-white/10"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 sm:mx-8 mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Vote Options */}
          <div className="px-6 sm:px-8 py-6 space-y-3">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
              const isSelected = selectedOption === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => (isActive && !hasVoted) && setSelectedOption(option.id)}
                  className={`relative rounded-xl border-2 p-4 transition-all duration-300 ${
                    isActive && !hasVoted
                      ? 'cursor-pointer hover:border-indigo-400/40 hover:bg-white/[0.03]'
                      : 'cursor-default'
                  } ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  {showResults && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-lg bg-gradient-to-r from-indigo-500/15 to-purple-500/10 transition-all duration-700 ease-out"
                      style={{ width: barAnimated ? `${percentage}%` : '0%' }}
                    />
                  )}
                  <div className="relative z-10 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {isActive && !hasVoted && (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-white/30'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="text-white font-medium truncate">{option.text}</span>
                    </div>
                    {showResults && (
                      <div className="text-right shrink-0">
                        <span className="text-white font-bold block">{percentage}%</span>
                        <span className="text-white/50 text-xs">{option.voteCount} votes</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vote Button / Status */}
          <div className="px-6 sm:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-white/70 text-sm">
              Total votes: <span className="text-white font-semibold">{showResults ? totalVotes : '—'}</span>
            </div>
            {isActive && !hasVoted && (
              <button
                onClick={handleVote}
                disabled={!selectedOption || voting}
                className="w-full sm:w-auto px-8 py-3.5 btn-primary text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:!bg-gray-600 disabled:!shadow-none"
              >
                {voting ? 'Submitting...' : 'Submit Vote'}
              </button>
            )}
            {hasVoted && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Check className="w-5 h-5" />
                <span className="font-medium">You voted</span>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <PostActions
            commentsCount={comments.length}
            onCommentClick={() => setShowComments(!showComments)}
            onShareClick={handleShare}
            hasCopied={copied}
          />

          {/* Comments */}
          {showComments && (
            <div className="border-t border-white/10 flex flex-col bg-black/20">
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[480px] p-4 sm:p-6">
                {loadingComments && comments.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-white/50 py-8">No comments yet. Be the first!</p>
                ) : (
                  <CommentList comments={comments} onReplySubmit={handleReplySubmit} />
                )}
              </div>
              <div className="shrink-0 p-4 sm:p-6 border-t border-white/10">
                {commentError && <p className="text-red-400 text-sm mb-2">{commentError}</p>}
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

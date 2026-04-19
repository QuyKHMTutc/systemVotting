import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Check, X, Users, MessageCircle, BarChart3 } from 'lucide-react';
import PostActions from '../components/post/PostActions';
import CommentList from '../components/comments/CommentList';
import CommentInput from '../components/comments/CommentInput';
import { commentService } from '../services/comment.service';
import type { Comment } from '../services/comment.service';
import { timeAgo, endsIn } from '../utils/date';
import { getTagPillClass } from '../utils/tagPills';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { usePollWebSocket } from '../hooks/usePollWebSocket';
import { useTranslation } from 'react-i18next';
import PollLiveChartModal from '../components/poll/PollLiveChartModal';

const COMMENT_PAGE_SIZE = 20;

const PollDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const [liveVoteReceived, setLiveVoteReceived] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [totalAllComments, setTotalAllComments] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [isLiveChartOpen, setIsLiveChartOpen] = useState(false);
  
  const [identityLocked, setIdentityLocked] = useState(false);
  const [lockedIsAnonymous, setLockedIsAnonymous] = useState(false);
  
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('commentId') ? Number(searchParams.get('commentId')) : null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchComments = useCallback(async (pollId: number) => {
    setLoadingComments(true);
    try {
      const data = await commentService.getCommentsByPollId(pollId, 0, COMMENT_PAGE_SIZE);
      setComments(data.page.content);
      setCommentPage(0);
      setTotalAllComments(data.totalAllComments);
      setHasMoreComments(data.page.currentPage + 1 < data.page.totalPages);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const loadMoreComments = async () => {
    if (!id || !hasMoreComments || loadingComments) return;
    setLoadingComments(true);
    try {
      const next = commentPage + 1;
      const data = await commentService.getCommentsByPollId(Number(id), next, COMMENT_PAGE_SIZE);
      setComments((prev) => [...prev, ...data.page.content]);
      setCommentPage(next);
      setHasMoreComments(data.page.currentPage + 1 < data.page.totalPages);
      setTotalAllComments(data.totalAllComments);
    } catch (err) {
      console.error('Failed to load more comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchIdentityStatus = useCallback(async (pollId: number) => {
    try {
      const data = await commentService.getIdentityStatus(pollId);
      if (data && data.hasCommented) {
        setIdentityLocked(true);
        setLockedIsAnonymous(data.isAnonymous || false);
      }
    } catch (err) {
      console.error('Failed to fetch identity status', err);
    }
  }, []);

  // --- Real-time WebSocket integration ---
  const handleWsVoteUpdate = useCallback((payload: { pollId: number; options: { optionId: number; text: string; voteCount: number }[] }) => {
    // Show live results to everyone when a vote comes in via WebSocket
    setLiveVoteReceived(true);
    setPoll(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options.map(opt => {
          const updated = payload.options.find(o => o.optionId === opt.id);
          return updated ? { ...opt, voteCount: updated.voteCount } : opt;
        }),
      };
    });
  }, []);

  const handleWsNewComment = useCallback((newComment: Comment) => {
    let inserted = false;
    setComments((prev) => {
      if (newComment.parentId) {
        return prev.map((root) => {
          if (root.id === newComment.parentId) {
            const alreadyExists = root.replies?.some((r) => r.id === newComment.id);
            if (alreadyExists) return root;
            inserted = true;
            return { ...root, replies: [...(root.replies || []), newComment] };
          }
          return root;
        });
      }
      if (prev.some((c) => c.id === newComment.id)) return prev;
      inserted = true;
      return [{ ...newComment, replies: newComment.replies || [] }, ...prev];
    });
    if (inserted) {
      setTotalAllComments((t) => t + 1);
    }
  }, []);

  usePollWebSocket({
    pollId: id ? Number(id) : undefined,
    onVoteUpdate: handleWsVoteUpdate,
    onNewComment: handleWsNewComment,
  });

  const handleCommentSubmit = async (content: string, isAnonymous: boolean) => {
    if (!poll) return;
    setCommentError('');
    try {
      await commentService.createComment({ pollId: poll.id, content, isAnonymous });
      const data = await commentService.getCommentsByPollId(poll.id, 0, COMMENT_PAGE_SIZE);
      setComments(data.page.content);
      setCommentPage(0);
      setTotalAllComments(data.totalAllComments);
      setHasMoreComments(data.page.currentPage + 1 < data.page.totalPages);
    } catch (err: any) {
      setCommentError(err.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleReplySubmit = async (parentId: number, content: string, isAnonymous: boolean) => {
    if (!poll) return;
    try {
      await commentService.createComment({ pollId: poll.id, parentId, content, isAnonymous });
      const data = await commentService.getCommentsByPollId(poll.id, 0, COMMENT_PAGE_SIZE);
      setComments(data.page.content);
      setCommentPage(0);
      setTotalAllComments(data.totalAllComments);
      setHasMoreComments(data.page.currentPage + 1 < data.page.totalPages);
    } catch (err: any) {
      setCommentError(err.response?.data?.message || 'Failed to post reply');
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
    if (!user) {
      navigate('/login');
      return;
    }
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
      if (user) {
        fetchIdentityStatus(Number(id));
      }
    }
  }, [id, fetchPoll, fetchComments, fetchIdentityStatus, user]);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#comments') {
        setShowComments(true);
        // Add slight delay to let the UI render the comment section opening, then scroll
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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
          <h2 className="text-2xl font-bold text-white mb-4">{t('pollDetail.pollNotFound')}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {t('pollDetail.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  const isActive = new Date(poll.endTime) > new Date();
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  // Show results if: user has voted, poll ended, OR a live vote update arrived via WebSocket
  const showResults = hasVoted || !isActive || liveVoteReceived;

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-2 right-0 z-20 p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
          title="Back"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 animate-modal-enter shadow-2xl shadow-slate-200/50 dark:shadow-black/30 bg-white/80 dark:bg-transparent">
          {/* Header */}
          <div className="p-6 sm:p-8 pb-6 border-b border-slate-200 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isActive ? t('pollDetail.active') : t('pollDetail.ended')}
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

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">{poll.title}</h1>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/20 shadow-lg shadow-indigo-500/20 overflow-hidden shrink-0">
                  {poll.creator.avatarUrl && poll.creator.avatarUrl !== 'null' && poll.creator.avatarUrl.trim() !== '' ? (
                    <img 
                      src={poll.creator.avatarUrl.startsWith('http') || poll.creator.avatarUrl.startsWith('blob') ? poll.creator.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${poll.creator.avatarUrl}`} 
                      alt={poll.creator.username} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${poll.creator.username}` }}
                    />
                  ) : (
                    <span>{poll.creator.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-800 dark:text-white/90 font-medium block">{poll.creator.username}</span>
                  <span className="text-slate-500 dark:text-white/50 text-sm">{timeAgo(poll.createdAt)} · {endsIn(poll.endTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiveChartOpen(true)}
                  className="flex items-center gap-2 group px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-xl border border-red-500/30 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-sm">Xem Live</span>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-white/60 mt-5 pt-4 border-t border-slate-200 dark:border-white/5">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400/80" />
                <span className="text-slate-800 dark:text-white font-semibold">{totalVotes}</span> {t('pollDetail.voters')}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400/80" />
                <span className="text-slate-800 dark:text-white font-semibold">
                  {totalAllComments || poll?.commentCount || 0}
                </span>{' '}
                {t('pollDetail.comments')}
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400/80" />
                <span className="text-slate-800 dark:text-white font-semibold">{poll.options.length}</span> {t('pollDetail.options')}
              </span>
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
                  className={`relative rounded-xl border p-4 transition-all duration-300 shadow-sm dark:shadow-none ${
                    isActive && !hasVoted
                      ? 'cursor-pointer hover:border-indigo-400/40 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      : 'cursor-default'
                  } ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 ring-1 ring-indigo-500 dark:ring-0 text-indigo-900'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]'
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
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-white/30'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="text-slate-800 dark:text-white font-medium truncate">{option.text}</span>
                    </div>
                    {showResults && (
                      <div className="text-right shrink-0">
                        <span className="text-slate-900 dark:text-white font-bold block">{percentage}%</span>
                        <span className="text-slate-500 dark:text-white/50 text-xs">{option.voteCount} {t('pollDetail.votes')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vote Button / Status */}
          <div className="px-6 sm:px-8 py-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-slate-600 dark:text-white/70 text-sm">
              {t('pollDetail.totalVotes')} <span className="text-slate-900 dark:text-white font-semibold">{totalVotes}</span>
            </div>
            {isActive && !hasVoted && (
              <button
                onClick={handleVote}
                disabled={(user && !selectedOption) || voting}
                className={`w-full sm:w-auto px-8 py-3.5 font-semibold rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:!shadow-none ${!user ? 'bg-[#00c853] hover:bg-[#00e676] text-white' : 'btn-primary text-white disabled:!bg-gray-600'}`}
              >
                {voting ? t('pollDetail.submitVote') + '...' : !user ? t('pollDetail.loginToVote') : t('pollDetail.submitVote')}
              </button>
            )}
            {hasVoted && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('pollDetail.youVoted')}</span>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <PostActions
            commentsCount={totalAllComments || poll?.commentCount || 0}
            onCommentClick={() => setShowComments(!showComments)}
            onShareClick={handleShare}
            hasCopied={copied}
          />

          {/* Comments */}
          {showComments && (
            <div className="border-t border-slate-200 dark:border-white/10 flex flex-col bg-slate-50 dark:bg-black/20">
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[480px] p-4 sm:p-6">
                {loadingComments && comments.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-white/50 py-8">{t('pollDetail.noComments')}</p>
                ) : (
                  <>
                    <CommentList
                      comments={comments}
                      onReplySubmit={handleReplySubmit}
                      identityLocked={identityLocked}
                      lockedIsAnonymous={lockedIsAnonymous}
                      highlightCommentId={highlightCommentId}
                    />
                    {hasMoreComments && (
                      <div className="flex justify-center pt-4">
                        <button
                          type="button"
                          onClick={() => void loadMoreComments()}
                          disabled={loadingComments}
                          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white text-sm disabled:opacity-50"
                        >
                          {loadingComments ? '…' : t('pollDetail.loadMoreComments')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="shrink-0 p-4 sm:p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-transparent">
                {commentError && <p className="text-red-400 text-sm mb-2">{commentError}</p>}
                {!user ? (
                   <div className="text-center p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                     <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                       {t('pollDetail.loginToComment')}
                     </Link>
                   </div>
                ) : (
                   <CommentInput 
                     onSubmit={handleCommentSubmit} 
                     placeholder={t('pollDetail.writeComment')} 
                     avatarUrl={user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl.trim() !== '' ? ((user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob')) ? user.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`) : undefined}
                     username={user?.username}
                     identityLocked={identityLocked}
                     lockedIsAnonymous={lockedIsAnonymous}
                   />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {poll && (
        <PollLiveChartModal 
          isOpen={isLiveChartOpen}
          onClose={() => setIsLiveChartOpen(false)}
          options={poll.options}
          pollTitle={poll.title}
        />
      )}
    </div>
  );
};

export default PollDetail;

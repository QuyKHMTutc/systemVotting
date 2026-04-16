import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import { commentService, type Comment } from '../services/comment.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import { ListPlus, CheckSquare, X, PenLine, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import UserProfileModal from '../components/UserProfileModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePollEventsWebSocket, type PollEventPayload } from '../hooks/usePollEventsWebSocket';
import { useTranslation } from 'react-i18next';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'created' | 'voted' | 'comments') || 'created';
  const setActiveTab = (tab: 'created' | 'voted' | 'comments') =>
    setSearchParams({ tab }, { replace: true });

  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleDeletePoll = async (pollId: number) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await pollService.deletePoll(pollId);
      setCreatedPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete. Please try again.');
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [created, voted, comments] = await Promise.all([
          pollService.getMyPolls(),
          pollService.getMyVotedPolls(),
          commentService.getMyComments()
        ]);
        setCreatedPolls(created);
        setVotedPolls(voted);
        setMyComments(comments);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileData();
    if (user) fetchProfileData();
  }, [user]);

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    const updateList = (prev: Poll[]) => {
      let newContent = [...prev];

      if (payload.type === 'CREATED') {
        // Only add to 'createdPolls' if it belongs to the current user. But we don't have the user object in the payload easily right here except in poll.creator.id
        // For simplicity, we can let them refresh, or check user.id
        if (user && payload.poll.creator.id === user.id && !newContent.some(p => p.id === payload.poll.id)) {
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
      }
      return newContent;
    };

    setCreatedPolls(prev => updateList(prev));
    setVotedPolls(prev => updateList(prev));
  }, [user]);

  usePollEventsWebSocket({ onEvent: handlePollEvent });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative bg-white/80 dark:bg-transparent">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-20 p-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 rounded-full text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            aria-label="Back"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cover / Header - gradient + blur + glow */}
          <div className="relative h-40 sm:h-48 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />

            {/* Blurred shapes */}
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-indigo-400/30 blur-3xl -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-purple-400/25 blur-3xl translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-32 h-32 rounded-full bg-pink-400/20 blur-2xl" />

            {/* Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
          </div>

          {/* Profile content - overlaps cover */}
          <div className="relative px-6 sm:px-8 -mt-16 sm:-mt-20 pb-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar - 80–100px, ring, shadow */}
              <div className="relative mb-4">
                <div className="w-24 h-24 sm:w-[100px] sm:h-[100px] rounded-full ring-4 ring-slate-200 dark:ring-white/20 sm:ring-slate-300 sm:dark:ring-purple-400/30 bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/30">
                  {user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl.trim() !== '' ? (
                    <img
                      src={
                        user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob')
                          ? user.avatarUrl
                          : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`
                      }
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`;
                      }}
                    />
                  ) : (
                    <span className="text-4xl font-bold text-slate-800 dark:text-white/90">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Subtle glow behind avatar */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl -z-10 scale-110" />
              </div>

              {/* Username & Email */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                {user?.username}
              </h1>
              <p className="text-slate-500 dark:text-white/60 text-sm mb-5">{user?.email}</p>

              {/* Edit Profile button */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <PenLine className="w-4 h-4" />
                {t('profile.editProfile')}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/50 mb-1">
                  <ListPlus className="w-4 h-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t('profile.polls')}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{createdPolls.length}</p>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/50 mb-1">
                  <CheckSquare className="w-4 h-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t('profile.votes')}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{votedPolls.length}</p>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/50 mb-1">
                  <MessageSquare className="w-4 h-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t('profile.engagement')}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {myComments.length}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs - animated underline */}
          <div className="relative border-b border-slate-200 dark:border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('created')}
                className={`relative flex-1 py-4 px-2 sm:px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                  activeTab === 'created'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                }`}
              >
                <ListPlus className="w-5 h-5 hidden sm:block" />
                <span>{t('profile.createdPolls')}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold hidden sm:inline-block ${
                    activeTab === 'created' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
                  }`}
                >
                  {createdPolls.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('voted')}
                className={`relative flex-1 py-4 px-2 sm:px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                  activeTab === 'voted'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                }`}
              >
                <CheckSquare className="w-5 h-5 hidden sm:block" />
                <span>{t('profile.votedPolls')}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold hidden sm:inline-block ${
                    activeTab === 'voted' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
                  }`}
                >
                  {votedPolls.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`relative flex-1 py-4 px-2 sm:px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                  activeTab === 'comments'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                }`}
              >
                <MessageSquare className="w-5 h-5 hidden sm:block" />
                <span>{t('profile.myComments')}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold hidden sm:inline-block ${
                    activeTab === 'comments' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
                  }`}
                >
                  {myComments.length}
                </span>
              </button>
            </div>
            {/* Animated glowing underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[left] duration-300 ease-out"
              style={{
                left: activeTab === 'created' ? '16.66%' : activeTab === 'voted' ? '50%' : '83.33%',
                width: '33.33%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
              }}
            />
          </div>

          {/* Poll list content */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {activeTab === 'created' ? (
                createdPolls.length > 0 ? (
                  createdPolls.map((poll, i) => (
                    <div
                      key={poll.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="transition-transform duration-200 hover:-translate-y-0.5">
                        <PollCard
                          poll={poll}
                          hasVoted={votedPolls.some((vp) => vp.id === poll.id)}
                          commentCount={poll.commentCount}
                          onDelete={handleDeletePoll}
                          showDeleteButton
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <ListPlus className="h-8 w-8 text-slate-400 dark:text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noPollsCreated')}</h3>
                    <p className="text-slate-500 dark:text-white/50 text-sm mb-4">
                      {t('profile.noPollsDesc')}
                    </p>
                    <button
                      onClick={() => navigate('/create-poll')}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      {t('profile.createPollBtn')}
                    </button>
                  </div>
                )
              ) : activeTab === 'voted' ? (
                votedPolls.length > 0 ? (
                  votedPolls.map((poll, i) => (
                    <div
                      key={poll.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="transition-transform duration-200 hover:-translate-y-0.5">
                        <PollCard poll={poll} hasVoted commentCount={poll.commentCount} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <CheckSquare className="h-8 w-8 text-slate-400 dark:text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noVotesYet')}</h3>
                    <p className="text-slate-500 dark:text-white/50 text-sm mb-4">
                      {t('profile.noVotesDesc')}
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      {t('profile.browsePollsBtn')}
                    </button>
                  </div>
                )
              ) : (
                myComments.length > 0 ? (
                  myComments.map((comment, i) => (
                    <div
                      key={comment.id}
                      className="animate-fade-in-up glass-panel p-5 rounded-2xl mb-4 transition-transform duration-200 hover:-translate-y-0.5"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold border border-indigo-200 dark:border-indigo-500/30 overflow-hidden">
                           {comment.isAnonymous ? 'A' : (
                               comment.avatarUrl && comment.avatarUrl !== 'null' && comment.avatarUrl.trim() !== '' ? (
                                   <img src={comment.avatarUrl.startsWith('http') || comment.avatarUrl.startsWith('blob') ? comment.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${comment.avatarUrl}`} alt={comment.username} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.username}` }} />
                               ) : comment.username.charAt(0).toUpperCase()
                           )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-white/90 text-sm">
                              {comment.isAnonymous ? 'Anonymous' : comment.username}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-white/40">•</span>
                            <span className="text-xs text-slate-500 dark:text-white/50">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            {comment.pollTitle && (
                                <>
                                  <span className="text-xs text-slate-400 dark:text-white/40">•</span>
                                  <button onClick={() => navigate(`/poll/${comment.pollId}`)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 truncate max-w-[150px] sm:max-w-xs">{comment.pollTitle}</button>
                                </>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-white/80 text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-slate-400 dark:text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noCommentsYet')}</h3>
                    <p className="text-slate-500 dark:text-white/50 text-sm mb-4">
                      {t('profile.noCommentsDesc')}
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      {t('profile.browsePollsBtn')}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

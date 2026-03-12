import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import { ListPlus, CheckSquare, X, PenLine, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import UserProfileModal from '../components/UserProfileModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'created' | 'voted') || 'created';
  const setActiveTab = (tab: 'created' | 'voted') =>
    setSearchParams({ tab }, { replace: true });

  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
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
        const [created, voted] = await Promise.all([
          pollService.getMyPolls(),
          pollService.getMyVotedPolls(),
        ]);
        setCreatedPolls(created);
        setVotedPolls(voted);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileData();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pb-12">
      <Navbar />

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden relative">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/80 hover:text-white transition-all duration-200"
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
                <div className="w-24 h-24 sm:w-[100px] sm:h-[100px] rounded-full ring-4 ring-white/20 sm:ring-purple-400/30 bg-white/10 flex items-center justify-center overflow-hidden shadow-xl shadow-black/30">
                  {user?.avatarUrl ? (
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
                    <span className="text-4xl font-bold text-white/90">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Subtle glow behind avatar */}
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl -z-10 scale-110" />
              </div>

              {/* Username & Email */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
                {user?.username}
              </h1>
              <p className="text-white/60 text-sm mb-5">{user?.email}</p>

              {/* Edit Profile button */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <PenLine className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-white/50 mb-1">
                  <ListPlus className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">Polls</span>
                </div>
                <p className="text-2xl font-bold text-white">{createdPolls.length}</p>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-white/50 mb-1">
                  <CheckSquare className="w-4 h-4 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">Votes</span>
                </div>
                <p className="text-2xl font-bold text-white">{votedPolls.length}</p>
              </div>
              <div className="text-center group">
                <div className="flex items-center justify-center gap-2 text-white/50 mb-1">
                  <MessageSquare className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                  <span className="text-xs font-medium uppercase tracking-wider">Engagement</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {createdPolls.length + votedPolls.length}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs - animated underline */}
          <div className="relative border-b border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('created')}
                className={`relative flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                  activeTab === 'created'
                    ? 'text-indigo-400'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <ListPlus className="w-5 h-5" />
                <span>Created Polls</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'created' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {createdPolls.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('voted')}
                className={`relative flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200 ${
                  activeTab === 'voted'
                    ? 'text-indigo-400'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <CheckSquare className="w-5 h-5" />
                <span>Voted Polls</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'voted' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {votedPolls.length}
                </span>
              </button>
            </div>
            {/* Animated glowing underline */}
            <div
              className="absolute bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[left] duration-300 ease-out"
              style={{
                left: activeTab === 'created' ? '25%' : '75%',
                width: '30%',
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
                          onDelete={handleDeletePoll}
                          showDeleteButton
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <ListPlus className="h-8 w-8 text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No polls created yet</h3>
                    <p className="text-white/50 text-sm mb-4">
                      Create your first poll to start gathering community votes.
                    </p>
                    <button
                      onClick={() => navigate('/create-poll')}
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                    >
                      Create a poll →
                    </button>
                  </div>
                )
              ) : votedPolls.length > 0 ? (
                votedPolls.map((poll, i) => (
                  <div
                    key={poll.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="transition-transform duration-200 hover:-translate-y-0.5">
                      <PollCard poll={poll} hasVoted />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] animate-fade-in-up">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <CheckSquare className="h-8 w-8 text-white/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No votes yet</h3>
                  <p className="text-white/50 text-sm mb-4">
                    Explore polls and cast your first vote!
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                  >
                    Browse polls →
                  </button>
                </div>
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

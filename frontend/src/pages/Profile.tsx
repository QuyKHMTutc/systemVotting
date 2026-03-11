import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import { ListPlus, CheckSquare, X, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import UserProfileModal from '../components/UserProfileModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Persist active tab in URL so it survives navigate(-1) from PollDetail
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
        if (!window.confirm('Bạn có chắc muốn xóa cuộc bình chọn này không?')) return;
        try {
            await pollService.deletePoll(pollId);
            setCreatedPolls(prev => prev.filter(p => p.id !== pollId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const [created, voted] = await Promise.all([
                    pollService.getMyPolls(),
                    pollService.getMyVotedPolls()
                ]);
                setCreatedPolls(created);
                setVotedPolls(voted);
            } catch (err) {
                console.error("Failed to fetch profile data", err);
                setError('Failed to load profile data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8 relative">
                {/* Nút Đóng Profile */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full transition-all duration-300 hover:bg-red-500 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:rotate-90"
                    aria-label="Close Profile"
                    title="Đóng trang cá nhân"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-md mb-4 overflow-hidden border-4 border-white/20">
                            {user?.avatarUrl ? (
                                <img 
                                    src={user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob') ? user.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`} 
                                    alt={user.username} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}` }} 
                                />
                            ) : (
                                <span className="text-4xl font-bold text-indigo-600">{user?.username?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
                        <p className="text-blue-100">{user?.email}</p>
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 transition-colors duration-200 
                            ${activeTab === 'created' 
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <ListPlus className="w-5 h-5" />
                        <span>Created Polls ({createdPolls.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('voted')}
                        className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 transition-colors duration-200 
                            ${activeTab === 'voted' 
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <CheckSquare className="w-5 h-5" />
                        <span>Voted Polls ({votedPolls.length})</span>
                    </button>
                </div>
                
                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                         {activeTab === 'created' ? (
                            createdPolls.length > 0 ? (
                                createdPolls.map(poll => (
                                    <div key={poll.id} className="relative group/card transition-transform duration-200 hover:-translate-y-1">
                                         <PollCard poll={poll} hasVoted={votedPolls.some(vp => vp.id === poll.id)} />
                                         {/* Delete button - appears on hover */}
                                         <button
                                             onClick={() => handleDeletePoll(poll.id)}
                                             className="absolute top-3 right-12 z-20 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover/card:opacity-100 transition-all shadow-md"
                                             title="Xóa cuộc bình chọn này"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                    <ListPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No polls created yet</h3>
                                    <p className="text-gray-500">When you create a poll, it will show up here.</p>
                                </div>
                            )
                        ) : (
                            votedPolls.length > 0 ? (
                                votedPolls.map(poll => (
                                    <div key={poll.id} className="transition-transform duration-200 hover:-translate-y-1">
                                        <PollCard poll={poll} hasVoted={true} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                    <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">You haven't voted on any polls yet</h3>
                                    <p className="text-gray-500">Explore active polls and cast your vote!</p>
                                </div>
                            )
                        )}
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

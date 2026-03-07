import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import { UserCircle, ListPlus, CheckSquare } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'created' | 'voted'>('created');
    const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
    const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
                            <UserCircle className="h-20 w-20 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{user?.username}</h1>
                        <p className="text-blue-100">{user?.email}</p>
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
                                    <div key={poll.id} className="transition-transform duration-200 hover:-translate-y-1">
                                         <PollCard poll={poll} />
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
                                        <PollCard poll={poll} />
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
        </div>
    );
};

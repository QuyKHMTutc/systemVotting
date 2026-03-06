import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { UserDTO } from '../services/user.service';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import Navbar from '../components/Navbar';

const AdminPanel = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'USERS' | 'POLLS'>('USERS');

    useEffect(() => {
        // Redirect non-admins quickly
        if (user?.role !== 'ADMIN') {
            navigate('/');
            return;
        }
        fetchUsers();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPolls = async () => {
        setLoading(true);
        try {
            // Fetch a large number of polls for admin view
            const data = await pollService.getAllPolls(0, 500);
            setPolls(data.content);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch polls.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'USERS') {
            fetchUsers();
        } else {
            fetchPolls();
        }
    }, [activeTab]);

    const handleToggleLock = async (id: number, currentStatus: boolean) => {
        const action = currentStatus ? 'UNLOCK' : 'LOCK';
        if (window.confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                await userService.toggleLock(id);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Action failed');
            }
        }
    }

    const handleDeletePoll = async (id: number) => {
        if (window.confirm('WARNING: This will delete the poll and all associated votes. Proceed?')) {
            try {
                await pollService.deletePoll(id);
                fetchPolls();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Deletion failed');
            }
        }
    };

    if (user?.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen pb-12">
            <Navbar />

            <main className="max-w-6xl mx-auto px-6">
                <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
                        <p className="text-indigo-200/80">Manage platform users and active polls globally.</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-indigo-300 hover:bg-white/10'}`}
                    >
                        User Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('POLLS')}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'POLLS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-indigo-300 hover:bg-white/10'}`}
                    >
                        Poll Management
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="glass-panel overflow-hidden rounded-2xl">
                        <div className="overflow-x-auto">
                            {activeTab === 'USERS' ? (
                                <table className="w-full text-left text-sm text-indigo-100">
                                    <thead className="bg-white/5 border-b border-white/10 text-indigo-200 uppercase">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">ID</th>
                                            <th className="px-6 py-4 font-semibold">Username</th>
                                            <th className="px-6 py-4 font-semibold">Email</th>
                                            <th className="px-6 py-4 font-semibold">Role</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium">{u.id}</td>
                                                <td className="px-6 py-4">{u.username}</td>
                                                <td className="px-6 py-4 text-indigo-200/60">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/10 text-white border border-white/20'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${u.locked ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-green-500/10 text-green-300 border-green-500/20'}`}>
                                                        {u.locked ? 'Locked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-3">
                                                    {u.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleToggleLock(u.id, u.locked)}
                                                            className={`${u.locked ? 'text-blue-400 hover:text-blue-300' : 'text-orange-400 hover:text-orange-300'} transition-colors font-medium`}
                                                        >
                                                            {u.locked ? 'Unlock' : 'Lock'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-indigo-200/60">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left text-sm text-indigo-100">
                                    <thead className="bg-white/5 border-b border-white/10 text-indigo-200 uppercase">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">ID</th>
                                            <th className="px-6 py-4 font-semibold">Title</th>
                                            <th className="px-6 py-4 font-semibold">Creator</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {polls.map((p) => {
                                            const isActive = new Date(p.endTime) > new Date();
                                            return (
                                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{p.id}</td>
                                                    <td className="px-6 py-4 max-w-xs truncate" title={p.title}>{p.title}</td>
                                                    <td className="px-6 py-4 text-indigo-200/60">{p.creator.username}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                                                            {isActive ? 'Active' : 'Ended'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeletePoll(p.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {polls.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-indigo-200/60">
                                                    No polls active.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;

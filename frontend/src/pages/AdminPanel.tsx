import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { UserDTO } from '../services/user.service';
import Navbar from '../components/Navbar';

const AdminPanel = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            setError('Failed to fetch users. They might not be available or you lack permissions.');
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (id: number) => {
        if (window.confirm('Are you sure you want to promote this user to ADMIN?')) {
            try {
                await userService.promoteToAdmin(id);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Promotion failed');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('WARNING: This will delete the user permanently. Proceed?')) {
            try {
                await userService.deleteUser(id);
                fetchUsers();
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
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-indigo-200/80 mb-8">Manage users, roles, and platform health.</p>

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
                            <table className="w-full text-left text-sm text-indigo-100">
                                <thead className="bg-white/5 border-b border-white/10 text-indigo-200 uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">ID</th>
                                        <th className="px-6 py-4 font-semibold">Username</th>
                                        <th className="px-6 py-4 font-semibold">Email</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
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
                                            <td className="px-6 py-4 text-right space-x-3">
                                                {u.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => handlePromote(u.id)}
                                                        className="text-green-400 hover:text-green-300 transition-colors font-medium"
                                                    >
                                                        Promote
                                                    </button>
                                                )}
                                                {u.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors font-medium"
                                                    >
                                                        Delete
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
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;

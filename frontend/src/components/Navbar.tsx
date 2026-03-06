import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import UserProfileModal from './UserProfileModal';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    return (
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-b-xl mb-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Vooting
                </Link>

                <div className="flex items-center space-x-6">
                    <div className="text-white hidden sm:flex items-center gap-4">
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors text-left"
                            aria-label="Edit Profile"
                        >
                            <div className="w-8 h-8 rounded-full border border-indigo-500 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob') ? user.avatarUrl : `http://localhost:8080${user.avatarUrl}`} alt={user.username} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}` }} />
                                ) : (
                                    <span className="text-sm font-bold text-indigo-300">{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <span className="font-medium text-white">{user?.username}</span>
                        </button>

                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="px-3 py-1 text-xs bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/30 rounded-full transition-colors flex items-center gap-1">
                                ⭐ ADMIN PANEL
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-red-500/20 hover:text-red-100 border border-white/20 hover:border-red-500/30 rounded-lg transition-all shadow-sm"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </nav>
    );
};

export default Navbar;

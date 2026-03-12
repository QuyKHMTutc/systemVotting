import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-b-2xl mb-8 border-b-0">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:from-indigo-300 hover:via-purple-300 hover:to-pink-300 transition-all duration-300">
                    Vooting
                </Link>

                <div className="flex items-center space-x-6">
                    <div className="text-white hidden sm:flex items-center gap-4">
                        <Link
                            to="/profile"
                            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors text-left"
                            aria-label="View Profile"
                        >
                            <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob') ? user.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`} alt={user.username} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}` }} />
                                ) : (
                                    <span className="text-sm font-bold text-indigo-300">{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <span className="font-medium text-white">{user?.username}</span>
                        </Link>

                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="px-3 py-1 text-xs bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/30 rounded-full transition-colors flex items-center gap-1">
                                ⭐ ADMIN PANEL
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-white/90 bg-white/5 hover:bg-red-500/20 hover:text-white border border-white/10 hover:border-red-500/30 rounded-xl transition-all duration-200"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

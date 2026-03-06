import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-b-xl mb-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    SystVot
                </Link>

                <div className="flex items-center space-x-6">
                    <div className="text-white hidden sm:flex items-center gap-4">
                        <span className="text-indigo-200/60 text-sm">Welcome, <span className="font-medium text-white">{user?.username}</span></span>

                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="px-3 py-1 text-xs bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/30 rounded-full transition-colors flex items-center gap-1">
                                ⭐ ADMIN PANEL
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

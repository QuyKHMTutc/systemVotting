import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PenLine, ListPlus, MessageSquare, CheckSquare, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="glass-panel sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl mb-8 border-b border-white/10 shadow-lg">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-1 sm:px-2 relative">
                
                {/* Left: Logo */}
                <div className="flex items-center shrink-0 min-w-fit">
                    <Link to="/" className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 pr-1 drop-shadow-sm hover:scale-[1.02] transition-transform">
                        Voting
                    </Link>
                </div>

                {/* Center: Navigation Links */}
                <div className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-10 px-4">
                    <Link to="/" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white font-bold transition-colors text-sm uppercase tracking-wider whitespace-nowrap">
                        {t('navbar.home')}
                    </Link>
                    <Link to="/explore" className="text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white font-bold transition-colors text-sm uppercase tracking-wider whitespace-nowrap">
                        {t('navbar.explore')}
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end space-x-3 sm:space-x-4 shrink-0">
                    <Link to="/create-poll" className="hidden sm:inline-flex px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] border border-white/10 whitespace-nowrap">
                        {t('navbar.createPoll')}
                    </Link>
                    {/* Theme Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 transition-colors border border-slate-300 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Language Switcher */}
                    <div className="relative">
                        <select
                            value={i18n.language.startsWith('vi') ? 'vi' : 'en'}
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                            className="appearance-none bg-slate-200/50 dark:bg-white/5 font-medium text-slate-700 dark:text-white/80 border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/40 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer text-sm"
                        >
                            <option value="en" className="text-gray-900">EN</option>
                            <option value="vi" className="text-gray-900">VI</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-white/50">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {user ? (
                        <div className="flex items-center space-x-4 sm:space-x-6">
                            <div className="text-slate-800 dark:text-white flex items-center gap-4 relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 sm:gap-3 hover:bg-slate-200/50 dark:hover:bg-white/5 pr-2 sm:pr-3 p-1.5 rounded-full sm:rounded-xl transition-colors text-left"
                                    aria-label={t('navbar.viewProfile')}
                                    aria-expanded={isDropdownOpen}
                                >
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-indigo-500/30 overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                                        {user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl.trim() !== '' ? (
                                            <img src={user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob') ? user.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`} alt={user.username} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}` }} />
                                        ) : (
                                            <span className="text-sm font-bold text-indigo-500 dark:text-indigo-300">{user?.username?.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className="font-semibold text-slate-800 dark:text-white/90 text-sm leading-tight">{user?.username}</span>
                                        {user?.role !== 'USER' && (
                                            <span className="text-slate-500 dark:text-white/40 text-[10px] uppercase tracking-wider font-bold">{user?.role}</span>
                                        )}
                                    </div>
                                    <ChevronDown className={`hidden sm:block w-4 h-4 text-slate-500 dark:text-white/50 transition-transform duration-300 ml-1 ${isDropdownOpen ? 'rotate-180 text-slate-800 dark:text-white' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <div className={`absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-[#1e1b4b]/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform origin-top-right transition-all duration-200 z-50 ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                    <div className="p-2 space-y-1">
                                        {user?.role === 'ADMIN' && (
                                            <div className="mb-2 px-2 pt-1 pb-2 border-b border-slate-200 dark:border-white/5">
                                                <Link to="/admin" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-200 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 border border-purple-500/20 dark:border-purple-500/30 rounded-lg transition-colors font-bold tracking-wide">
                                                    {t('navbar.admin')}
                                                </Link>
                                            </div>
                                        )}
                                        
                                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                                                <PenLine className="w-4 h-4" />
                                            </div>
                                            {t('navbar.editProfile')}
                                        </Link>

                                        <Link to="/profile?tab=created" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center text-pink-500 dark:text-pink-400 shrink-0">
                                                <ListPlus className="w-4 h-4" />
                                            </div>
                                            {t('navbar.myPolls')}
                                        </Link>

                                        <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            {t('navbar.myComments')}
                                        </Link>

                                        <Link to="/profile?tab=voted" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            {t('navbar.myVotes')}
                                        </Link>

                                        <div className="h-px bg-slate-200 dark:bg-white/10 my-2 mx-2"></div>

                                        <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-left">
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            {t('navbar.logout')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center"
                        >
                            {t('navbar.login')}
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

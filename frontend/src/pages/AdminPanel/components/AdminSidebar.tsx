import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import type { Tab } from '../types'; // I will create a types.ts file for shared types

interface AdminSidebarProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  setSearch: (s: string) => void;
  navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[];
  user: any;
  logout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ tab, setTab, setSearch, navItems, user, logout }) => {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-indigo-500/10 relative z-20 bg-indigo-950/20 backdrop-blur-2xl shadow-[4px_0_30px_rgba(0,0,0,0.2)]">
      <div className="px-6 py-8 border-b border-indigo-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold tracking-wide font-heading">Admin Panel</p>
            <p className="text-violet-300/60 text-xs">Control Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto thin-scrollbar">
        <div>
          <p className="px-3 text-xs font-semibold text-white/30 tracking-wider mb-3">MANAGEMENT</p>
          <div className="space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group ${
                  tab === item.id
                  ? 'text-white bg-white/10 shadow-inner'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                }`}
                style={tab === item.id ? { background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, transparent 100%)', borderLeft: '3px solid #8b5cf6', boxShadow: 'inset 0 0 20px rgba(139,92,246,0.1)' } : { borderLeft: '3px solid transparent' }}>
                <span className={tab === item.id ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'group-hover:text-violet-400 transition-colors'}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  tab === item.id ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-white/40'
                  }`}>{item.badge > 999 ? '999+' : item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner"
            style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.username}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
          <button onClick={logout} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { UserDTO } from '../services/user.service';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import { paymentService } from '../services/payment.service';
import type { AdminPaymentHistory } from '../services/payment.service';
import {
  LayoutDashboard, Users, BarChart3, ShieldAlert,
  Lock, Unlock, Trash2, Search, RefreshCw,
  TrendingUp, Activity, ChevronRight, LogOut, X,
  CreditCard, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Tab = 'OVERVIEW' | 'USERS' | 'POLLS' | 'PAYMENTS';

interface Stats {
  totalUsers: number;
  lockedUsers: number;
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
}

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981'];

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [payments, setPayments] = useState<AdminPaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; msg: string; onConfirm: () => void } | null>(null);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, lockedUsers: 0, totalPolls: 0, activePolls: 0, totalVotes: 0 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    if (user?.role !== 'ADMIN') { navigate('/'); return; }
    setLoading(true);
    try {
      const [ud, pd, pay] = await Promise.all([
        userService.getAllUsers(0, 1000),
        pollService.getAllPolls(0, 1000),
        paymentService.getAllPayments(0, 200),
      ]);
      setUsers(ud.content);
      setPolls(pd.content);
      setPayments(pay.content);
      const now = new Date();
      setStats({
        totalUsers: ud.totalElements ?? ud.content.length,
        lockedUsers: ud.content.filter(u => u.locked).length,
        totalPolls: pd.totalElements ?? pd.content.length,
        activePolls: pd.content.filter(p => new Date(p.endTime) > now).length,
        totalVotes: pd.content.reduce((s, p) => s + p.options.reduce((a, o) => a + o.voteCount, 0), 0),
      });
    } catch (err) {
      console.error('AdminPanel fetchAll error:', err);
      showToast('Failed to load data', 'error');
    }
    finally { setLoading(false); }
  }, [user, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleLock = (u: UserDTO) => {
    setConfirmModal({
      title: u.locked ? 'Unlock User' : 'Lock User',
      msg: `${u.locked ? 'Unlock' : 'Lock'} account "${u.username}"?`,
      onConfirm: async () => {
        try {
          await userService.toggleLock(u.id);
          showToast(`User ${u.locked ? 'unlocked' : 'locked'} successfully`);
          fetchAll();
        } catch { showToast('Action failed', 'error'); }
        setConfirmModal(null);
      }
    });
  };

  const handleDeletePoll = (p: Poll) => {
    setConfirmModal({
      title: 'Delete Poll',
      msg: `Permanently delete "${p.title}" and all its votes?`,
      onConfirm: async () => {
        try {
          await pollService.deletePoll(p.id);
          showToast('Poll deleted');
          fetchAll();
        } catch { showToast('Deletion failed', 'error'); }
        setConfirmModal(null);
      }
    });
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPolls = polls.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.creator.username.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data
  const pieData = [
    { name: 'Active', value: stats.activePolls },
    { name: 'Ended', value: stats.totalPolls - stats.activePolls },
  ];
  const barData = polls.slice(0, 8).map(p => ({
    name: p.title.length > 14 ? p.title.slice(0, 14) + '…' : p.title,
    votes: p.options.reduce((s, o) => s + o.voteCount, 0),
  }));

  if (user?.role !== 'ADMIN') return null;

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'USERS', label: 'Users', icon: <Users size={18} /> },
    { id: 'POLLS', label: 'Polls', icon: <BarChart3 size={18} /> },
    { id: 'PAYMENTS', label: 'Payments', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0a0818 0%,#0d0f1e 100%)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/10"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
              <ShieldAlert size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm font-heading">Admin Panel</p>
              <p className="text-purple-300/60 text-xs">Control Center</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSearch(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === item.id
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              style={tab === item.id ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.2))', border: '1px solid rgba(139,92,246,0.3)' } : {}}>
              {item.icon}
              {item.label}
              {tab === item.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
              <p className="text-purple-300/60 text-xs">Administrator</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/10"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">
              {tab === 'OVERVIEW' ? 'Dashboard Overview'
                : tab === 'USERS' ? 'User Management'
                : tab === 'POLLS' ? 'Poll Management'
                : 'Payment Transactions'}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              {tab === 'OVERVIEW' ? 'Platform metrics at a glance'
                : tab === 'USERS' ? `${users.length} total accounts`
                : tab === 'POLLS' ? `${polls.length} total polls`
                : `${payments.length} transactions`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(tab === 'USERS' || tab === 'POLLS' || tab === 'PAYMENTS') && (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'USERS' ? 'Search users…' : tab === 'POLLS' ? 'Search polls…' : 'Search user / ref…'}
                  className="pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-purple-500/50 w-56"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            )}
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/70 border border-white/10 hover:border-purple-500/40 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">

          {/* OVERVIEW */}
          {tab === 'OVERVIEW' && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20}/>, color: '#6366f1', sub: `${stats.lockedUsers} locked` },
                  { label: 'Total Polls', value: stats.totalPolls, icon: <BarChart3 size={20}/>, color: '#a855f7', sub: `${stats.activePolls} active` },
                  { label: 'Total Votes', value: stats.totalVotes.toLocaleString(), icon: <Activity size={20}/>, color: '#ec4899', sub: 'all time' },
                  { label: 'Active Now', value: stats.activePolls, icon: <TrendingUp size={20}/>, color: '#10b981', sub: 'live polls' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-5 border border-white/10 flex flex-col gap-3"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${s.color}22`, color: s.color }}>
                        {s.icon}
                      </div>
                      <span className="text-2xl font-bold text-white font-heading">{s.value}</span>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{s.label}</p>
                      <p className="text-white/40 text-xs">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar chart */}
                <div className="lg:col-span-2 rounded-2xl p-6 border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <h3 className="text-white font-semibold mb-4 font-heading">Top Polls by Votes</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#ffffff40', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1a1030', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                        cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                      />
                      <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div className="rounded-2xl p-6 border border-white/10 flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <h3 className="text-white font-semibold mb-4 font-heading">Poll Status</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                          paddingAngle={4} dataKey="value">
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#374151" />
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1030', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    {[{ label: 'Active', color: '#8b5cf6' }, { label: 'Ended', color: '#374151' }].map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                        <span className="text-white/60 text-xs">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent users */}
              <div className="rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold font-heading">Recent Users</h3>
                  <button onClick={() => setTab('USERS')} className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition-colors">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.username}</p>
                        <p className="text-white/40 text-xs truncate">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        u.locked ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-green-300 bg-green-500/10 border-green-500/20'
                      }`}>{u.locked ? 'Locked' : 'Active'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'USERS' && (
            <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {loading ? <LoadingSpinner /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                        {['#', 'User', 'Email', 'Role', 'Status', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 font-semibold text-left ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} className="hover:bg-white/3 transition-colors group">
                          <td className="px-6 py-4 text-white/30 text-xs">{i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                {u.username[0].toUpperCase()}
                              </div>
                              <span className="text-white font-medium">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/50">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              u.role === 'ADMIN'
                                ? 'text-purple-300 bg-purple-500/15 border-purple-500/30'
                                : 'text-white/60 bg-white/5 border-white/15'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              u.locked ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-green-300 bg-green-500/10 border-green-500/20'
                            }`}>{u.locked ? 'Locked' : 'Active'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.id !== user?.id && (
                              <button onClick={() => handleToggleLock(u)}
                                className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  u.locked
                                    ? 'text-blue-300 border-blue-500/30 hover:bg-blue-500/10'
                                    : 'text-orange-300 border-orange-500/30 hover:bg-orange-500/10'
                                }`}>
                                {u.locked ? <><Unlock size={13} /> Unlock</> : <><Lock size={13} /> Lock</>}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-16 text-center text-white/30">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* POLLS TAB */}
          {tab === 'POLLS' && (
            <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {loading ? <LoadingSpinner /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                        {['#', 'Title', 'Creator', 'Votes', 'Options', 'Status', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 font-semibold text-left ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredPolls.map((p, i) => {
                        const active = new Date(p.endTime) > new Date();
                        const totalVotes = p.options.reduce((s, o) => s + o.voteCount, 0);
                        return (
                          <tr key={p.id} className="hover:bg-white/3 transition-colors">
                            <td className="px-6 py-4 text-white/30 text-xs">{i + 1}</td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-white font-medium truncate" title={p.title}>{p.title}</p>
                              <p className="text-white/30 text-xs mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                  {p.creator.username[0].toUpperCase()}
                                </div>
                                <span className="text-white/70">{p.creator.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-white font-semibold">{totalVotes.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-white/50">{p.options.length}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                active ? 'text-green-300 bg-green-500/10 border-green-500/20' : 'text-white/40 bg-white/5 border-white/10'
                              }`}>{active ? 'Active' : 'Ended'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeletePoll(p)}
                                className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-all">
                                <Trash2 size={13} /> Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPolls.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-16 text-center text-white/30">No polls found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {tab === 'PAYMENTS' && (() => {
            const filteredPayments = payments.filter(p =>
              p.username.toLowerCase().includes(search.toLowerCase()) ||
              p.email.toLowerCase().includes(search.toLowerCase()) ||
              p.txnRef.toLowerCase().includes(search.toLowerCase())
            );
            const totalRevenue = payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
            return (
              <div className="space-y-6 animate-fade-in-up">
                {/* Revenue summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Transactions', value: payments.length, color: '#6366f1', icon: <CreditCard size={18}/> },
                    { label: 'Successful', value: payments.filter(p => p.status === 'SUCCESS').length, color: '#10b981', icon: <CheckCircle2 size={18}/> },
                    { label: 'Failed', value: payments.filter(p => p.status === 'FAILED').length, color: '#ef4444', icon: <XCircle size={18}/> },
                    { label: 'Revenue (VND)', value: totalRevenue.toLocaleString('vi-VN'), color: '#f59e0b', icon: <TrendingUp size={18}/> },
                  ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-4 border border-white/10 flex items-center gap-4"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${s.color}22`, color: s.color }}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-white/50 text-xs mb-0.5">{s.label}</p>
                        <p className="text-white font-bold text-lg font-heading">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transactions table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {loading ? <LoadingSpinner /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                            {['#', 'Txn Ref', 'User', 'Plan', 'Amount', 'Status', 'Date'].map((h) => (
                              <th key={h} className={`px-5 py-4 font-semibold text-left`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredPayments.map((p, i) => (
                            <tr key={p.id} className="hover:bg-white/3 transition-colors">
                              <td className="px-5 py-3.5 text-white/30 text-xs">{i + 1}</td>
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-xs text-purple-300/80 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                                  {p.txnRef}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                    {p.username[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-white text-sm font-medium">{p.username}</p>
                                    <p className="text-white/40 text-xs">{p.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  p.targetPlan === 'PRO' ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                                  : p.targetPlan === 'PLUS' ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                                  : p.targetPlan === 'GO' ? 'text-green-300 bg-green-500/10 border-green-500/20'
                                  : 'text-white/40 bg-white/5 border-white/10'
                                }`}>{p.targetPlan}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-white font-semibold">{p.amount.toLocaleString('vi-VN')}đ</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  p.status === 'SUCCESS' ? 'text-green-300 bg-green-500/10 border-green-500/20'
                                  : p.status === 'FAILED' ? 'text-red-300 bg-red-500/10 border-red-500/20'
                                  : 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                                }`}>
                                  {p.status === 'SUCCESS' ? <CheckCircle2 size={11} />
                                    : p.status === 'FAILED' ? <XCircle size={11} />
                                    : <Clock size={11} />}
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-white/50 text-xs">
                                {new Date(p.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                            </tr>
                          ))}
                          {filteredPayments.length === 0 && (
                            <tr><td colSpan={7} className="px-6 py-16 text-center text-white/30">No transactions found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium z-50 animate-fade-in-up border ${
          toast.type === 'success' ? 'bg-green-900/90 border-green-500/30' : 'bg-red-900/90 border-red-500/30'
        }`} style={{ backdropFilter: 'blur(20px)' }}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} className="opacity-60 hover:opacity-100" /></button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm border border-white/15 animate-modal-enter"
            style={{ background: 'rgba(15,12,35,0.98)' }}>
            <h3 className="text-white font-bold text-lg font-heading mb-2">{confirmModal.title}</h3>
            <p className="text-white/60 text-sm mb-6">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 border border-white/15 hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-24">
    <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
  </div>
);

export default AdminPanel;

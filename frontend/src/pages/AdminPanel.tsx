import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { UserDTO } from '../services/user.service';
import { pollService } from '../services/poll.service';
import type { Poll } from '../services/poll.service';
import { paymentService } from '../services/payment.service';
import type { AdminPaymentHistory } from '../services/payment.service';
import { categoryService } from '../services/category.service';
import type { Category } from '../services/category.service';
import {
  LayoutDashboard, Users, BarChart3, ShieldAlert,
  Lock, Unlock, Trash2, Search,
  Activity, LogOut, X,
  CreditCard, CheckCircle2, XCircle, Clock, Tag,
  ArrowUpRight, ArrowDownRight, Plus, Edit3, Save, Smile,
  Calendar, MoreVertical, Settings, Bell, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

type Tab = 'OVERVIEW' | 'USERS' | 'POLLS' | 'PAYMENTS' | 'CATEGORIES';
type Timeframe = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';



const Pagination = ({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-6 py-4 border-t border-white/5">
      <span className="text-sm text-white/50">Page {page + 1} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white">
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
              return (
                <button key={i} onClick={() => onPageChange(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${page === i ? 'bg-violet-600 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                  {i + 1}
                </button>
              );
            }
            if (i === page - 2 || i === page + 2) return <span key={i} className="text-white/30">...</span>;
            return null;
          })}
        </div>
        <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white">
          Next
        </button>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; msg: string; onConfirm: () => void } | null>(null);

  // Timeframe Filter States
  const [timeframe, setTimeframe] = useState<Timeframe>('7D');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Data States
  const [allUsers, setAllUsers] = useState<UserDTO[]>([]);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [allPayments, setAllPayments] = useState<AdminPaymentHistory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pagination States for specific tabs
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [pageUsers, setPageUsers] = useState(0);
  const [totalPagesUsers, setTotalPagesUsers] = useState(0);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pagePolls, setPagePolls] = useState(0);
  const [totalPagesPolls, setTotalPagesPolls] = useState(0);

  const [payments, setPayments] = useState<AdminPaymentHistory[]>([]);
  const [pagePayments, setPagePayments] = useState(0);
  const [totalPagesPayments, setTotalPagesPayments] = useState(0);

  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean; isEdit: boolean; data: Partial<Category> }>({ isOpen: false, isEdit: false, data: {} });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Methods
  const fetchOverviewData = useCallback(async () => {
    try {
      const [u, p, pay] = await Promise.all([
        userService.getAllUsers(0, 1000, ''),
        pollService.getAllPolls(0, 1000, '', 'ALL', 'ALL', 'createdAt', 'desc'),
        paymentService.getAllPayments(0, 1000, '')
      ]);
      setAllUsers(u.content);
      setAllPolls(p.content);
      setAllPayments(pay.content);
    } catch (err) { console.error('Failed to load overview data', err); }
  }, []);

  const fetchUsers = useCallback(async (page = 0, q = search) => {
    try {
      const ud = await userService.getAllUsers(page, 20, q);
      setUsers(ud.content);
      setTotalPagesUsers(ud.totalPages);
    } catch (err) { console.error(err); }
  }, [search]);

  const fetchPolls = useCallback(async (page = 0, q = search) => {
    try {
      const pd = await pollService.getAllPolls(page, 15, q, 'ALL', 'ALL', 'createdAt', 'desc');
      setPolls(pd.content);
      setTotalPagesPolls(pd.totalPages);
    } catch (err) { console.error(err); }
  }, [search]);

  const fetchPayments = useCallback(async (page = 0, q = search) => {
    try {
      const pay = await paymentService.getAllPayments(page, 20, q);
      setPayments(pay.content);
      setTotalPagesPayments(pay.totalPages);
    } catch (err) { console.error(err); }
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getAllCategories();
      setCategories(cats);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAll = useCallback(() => {
    if (user?.role !== 'ADMIN') { navigate('/'); return; }
    if (tab === 'OVERVIEW') { fetchOverviewData(); }
    if (tab === 'USERS') fetchUsers(pageUsers);
    if (tab === 'POLLS') fetchPolls(pagePolls);
    if (tab === 'PAYMENTS') fetchPayments(pagePayments);
    if (tab === 'CATEGORIES') fetchCategories();
  }, [user, navigate, tab, fetchOverviewData, fetchUsers, pageUsers, fetchPolls, pagePolls, fetchPayments, pagePayments, fetchCategories]);

  useEffect(() => { fetchAll(); }, [tab]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tab === 'USERS') { setPageUsers(0); fetchUsers(0); }
    if (tab === 'POLLS') { setPagePolls(0); fetchPolls(0); }
    if (tab === 'PAYMENTS') { setPagePayments(0); fetchPayments(0); }
  };

  // Actions
  const handleToggleLock = (u: UserDTO) => {
    setConfirmModal({
      title: u.locked ? 'Unlock User' : 'Lock User',
      msg: `${u.locked ? 'Unlock' : 'Lock'} account "${u.username}"?`,
      onConfirm: async () => {
        try {
          await userService.toggleLock(u.id);
          showToast(`User ${u.locked ? 'unlocked' : 'locked'} successfully`);
          fetchUsers(pageUsers);
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
          fetchPolls(pagePolls);
        } catch { showToast('Deletion failed', 'error'); }
        setConfirmModal(null);
      }
    });
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryModal.data.name?.trim()) return showToast('Category name is required', 'error');
      if (categoryModal.isEdit && categoryModal.data.id) {
        await categoryService.updateCategory(categoryModal.data.id, categoryModal.data);
        showToast('Category updated successfully');
      } else {
        await categoryService.createCategory(categoryModal.data);
        showToast('Category created successfully');
      }
      setCategoryModal({ isOpen: false, isEdit: false, data: {} });
      fetchCategories();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to save category', 'error'); }
  };

  const handleDeleteCategory = (cat: Category) => {
    setConfirmModal({
      title: 'Delete Category',
      msg: `Delete category "${cat.name}"? All polls under this category will become Uncategorized.`,
      onConfirm: async () => {
        try {
          await categoryService.deleteCategory(cat.id);
          showToast('Category deleted successfully');
          fetchCategories();
        } catch { showToast('Failed to delete category', 'error'); }
        setConfirmModal(null);
      }
    });
  };

  // Data Aggregation & Filtering Logic for Overview
  const getDateRange = useCallback(() => {
    let end = new Date();
    let start = new Date();
    if (timeframe === '7D') start.setDate(end.getDate() - 7);
    else if (timeframe === '30D') start.setDate(end.getDate() - 30);
    else if (timeframe === '90D') start.setDate(end.getDate() - 90);
    else if (timeframe === 'ALL') start = new Date(0);
    else if (timeframe === 'CUSTOM' && customRange.start && customRange.end) {
      start = new Date(customRange.start);
      end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [timeframe, customRange]);

  const overviewMetrics = useMemo(() => {
    const { start, end } = getDateRange();
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime());

    const filterByDate = (items: any[], dateField: string, s: Date, e: Date) => 
      items.filter(item => {
        if (!item[dateField]) return true;
        const d = new Date(item[dateField]);
        return d >= s && d <= e;
      });

    const currUsers = filterByDate(allUsers, 'createdAt', start, end);
    const prevUsers = filterByDate(allUsers, 'createdAt', prevStart, prevEnd);
    
    const currPolls = filterByDate(allPolls, 'createdAt', start, end);
    const prevPolls = filterByDate(allPolls, 'createdAt', prevStart, prevEnd);

    const currVotes = currPolls.reduce((sum, p) => sum + p.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0), 0);
    const prevVotes = prevPolls.reduce((sum, p) => sum + p.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0), 0);

    const currPayments = filterByDate(allPayments, 'createdAt', start, end);
    const prevPayments = filterByDate(allPayments, 'createdAt', prevStart, prevEnd);

    const currRevenue = currPayments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0);
    const prevRevenue = prevPayments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0);

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      users: { value: timeframe === 'ALL' ? allUsers.length : currUsers.length, trend: calcTrend(currUsers.length, prevUsers.length), data: currUsers },
      polls: { value: timeframe === 'ALL' ? allPolls.length : currPolls.length, trend: calcTrend(currPolls.length, prevPolls.length), data: currPolls },
      votes: { value: timeframe === 'ALL' ? allPolls.reduce((sum, p) => sum + p.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0), 0) : currVotes, trend: calcTrend(currVotes, prevVotes), data: currPolls },
      revenue: { value: timeframe === 'ALL' ? allPayments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0) : currRevenue, trend: calcTrend(currRevenue, prevRevenue), data: currPayments },
      activePolls: (timeframe === 'ALL' ? allPolls : currPolls).filter(p => new Date(p.endTime) > new Date()).length,
      endedPolls: (timeframe === 'ALL' ? allPolls : currPolls).filter(p => new Date(p.endTime) <= new Date()).length,
    };
  }, [allUsers, allPolls, allPayments, getDateRange, timeframe]);

  const activityFeed = useMemo(() => {
    const events: any[] = [];
    allUsers.forEach(u => { if (u.createdAt) events.push({ id: `u-${u.id}`, type: 'USER', date: new Date(u.createdAt), data: u }); });
    allPolls.forEach(p => { if (p.createdAt) events.push({ id: `p-${p.id}`, type: 'POLL', date: new Date(p.createdAt), data: p }); });
    allPayments.forEach(p => { if (p.createdAt && p.status === 'SUCCESS') events.push({ id: `pay-${p.id}`, type: 'PAYMENT', date: new Date(p.createdAt), data: p }); });
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events.slice(0, 5);
  }, [allUsers, allPolls, allPayments]);

  const chartData = useMemo(() => {
    const { start, end } = getDateRange();
    const map = new Map<string, { date: string, polls: number, votes: number }>();
    
    let current = new Date(start);
    const limit = timeframe === 'ALL' ? 365 : (end.getTime() - start.getTime()) / 86400000 + 1;
    let count = 0;
    while(current <= end && count < limit) {
      const key = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(key, { date: key, polls: 0, votes: 0 });
      current.setDate(current.getDate() + 1);
      count++;
    }

    overviewMetrics.polls.data.forEach(p => {
      if (!p.createdAt) return;
      const key = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = map.get(key);
      if (existing) {
        existing.polls += 1;
        existing.votes += p.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0);
      }
    });
    return Array.from(map.values());
  }, [overviewMetrics.polls.data, getDateRange, timeframe]);

  const generateSparkline = (data: any[], key: string) => {
      const { start, end } = getDateRange();
      const map = new Map<string, number>();
      let current = new Date(start);
      const limit = timeframe === 'ALL' ? 30 : (end.getTime() - start.getTime()) / 86400000 + 1; // max 30 points for sparkline
      let step = Math.max(1, Math.floor(limit / 10)); // reduce points for smooth sparkline
      
      let i = 0;
      while(current <= end && i < 15) {
          const k = current.toLocaleDateString();
          map.set(k, 0);
          current.setDate(current.getDate() + step);
          i++;
      }
      
      data.forEach(item => {
          if(!item.createdAt) return;
          const d = new Date(item.createdAt);
          if (d >= start && d <= end) {
              const k = d.toLocaleDateString();
              if (map.has(k)) {
                  map.set(k, map.get(k)! + (key === 'amount' ? Number(item.amount) : 1));
              }
          }
      });
      return Array.from(map.values()).map((v, idx) => ({ name: idx, value: v }));
  };

  const sparklines = useMemo(() => {
      return {
          users: generateSparkline(overviewMetrics.users.data, 'users'),
          polls: generateSparkline(overviewMetrics.polls.data, 'polls'),
          votes: generateSparkline(overviewMetrics.polls.data, 'votes'),
          revenue: generateSparkline(overviewMetrics.revenue.data, 'amount')
      }
  }, [overviewMetrics]);


  if (user?.role !== 'ADMIN') return null;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'OVERVIEW',    label: 'Overview',    icon: <LayoutDashboard size={18} /> },
    { id: 'USERS',       label: 'Users',       icon: <Users size={18} />,     badge: allUsers.length },
    { id: 'POLLS',       label: 'Polls',       icon: <BarChart3 size={18} />, badge: allPolls.length },
    { id: 'PAYMENTS',    label: 'Payments',    icon: <CreditCard size={18} /> },
    { id: 'CATEGORIES',  label: 'Categories',  icon: <Tag size={18} />,       badge: categories.length },
  ];

  return (
    <div className="h-screen overflow-hidden flex text-slate-200 font-sans relative z-0" style={{ background: '#070514' }}>
      
      {/* Animated Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-fuchsia-600/15 rounded-full blur-[130px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Sidebar */}
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

            <div>
                <p className="px-3 text-xs font-semibold text-white/30 tracking-wider mb-3">SYSTEM</p>
                <div className="space-y-1">
                    {[{ id: 'SETTINGS', label: 'Settings', icon: <Settings size={18}/> }, { id: 'LOGS', label: 'Logs', icon: <FileText size={18}/> }, { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={18}/> }].map(item => (
                         <button key={item.id} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-300 border-l-4 border-transparent">
                            {item.icon}
                            <span className="flex-1 text-left">{item.label}</span>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.05),transparent_50%)]">
        
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-md z-10">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 font-heading tracking-tight flex items-center gap-2">
              {tab === 'OVERVIEW'    ? <>Dashboard Overview <span className="text-2xl">👏</span></>
                : tab === 'USERS'   ? 'User Management'
                : tab === 'POLLS'   ? 'Poll Management'
                : tab === 'CATEGORIES' ? 'Category Management'
                : 'Payment Transactions'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {tab === 'OVERVIEW'    ? "Welcome back! Here's what's happening with your platform."
                : tab === 'USERS'   ? `Manage and monitor ${allUsers.length} user accounts`
                : tab === 'POLLS'   ? `Oversee ${allPolls.length} community polls`
                : tab === 'CATEGORIES' ? `Organize ${categories.length} categories`
                : `Track ${allPayments.length} payment transactions`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {tab === 'OVERVIEW' ? (
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    {['7D', '30D', '90D', 'ALL'].map((tf) => (
                        <button key={tf} onClick={() => setTimeframe(tf as Timeframe)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${timeframe === tf ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                            {tf}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => setShowDatePicker(true)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${timeframe === 'CUSTOM' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                        <Calendar size={14} /> Custom
                    </button>
                </div>
            ) : (tab === 'USERS' || tab === 'POLLS' || tab === 'PAYMENTS') ? (
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search here... ⌘K"
                  className="pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-violet-500/50 w-64 bg-white/5 shadow-inner transition-all focus:bg-white/10" />
              </form>
            ) : null}
            
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#070514]"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-0">

          {/* OVERVIEW */}
          {tab === 'OVERVIEW' && (
            <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
              
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users',  value: overviewMetrics.users.value, trend: overviewMetrics.users.trend, icon: <Users size={22}/>, color: '#8b5cf6', data: sparklines.users },
                  { label: 'Total Polls',  value: overviewMetrics.polls.value, trend: overviewMetrics.polls.trend, icon: <BarChart3 size={22}/>, color: '#3b82f6', data: sparklines.polls },
                  { label: 'Total Votes',  value: overviewMetrics.votes.value.toLocaleString(), trend: overviewMetrics.votes.trend, icon: <Activity size={22}/>, color: '#ec4899', data: sparklines.votes },
                  { label: 'Total Revenue', value: overviewMetrics.revenue.value.toLocaleString('vi-VN') + 'đ', trend: overviewMetrics.revenue.trend, icon: <CreditCard size={22}/>, color: '#10b981', data: sparklines.revenue },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-6 border border-white/5 border-t-white/10 relative overflow-hidden group hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px]"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(16px)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: s.color + '20' }}></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/5" style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}11)`, color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-white/50 text-sm font-medium mb-1">{s.label}</p>
                            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 font-heading tracking-tight drop-shadow-sm">{s.value}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between relative z-10 mt-4">
                        <span className={`text-xs font-semibold flex items-center gap-1 ${s.trend >= 0 ? 'text-emerald-400' : 'text-pink-400'}`}>
                            {s.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(s.trend).toFixed(1)}% <span className="text-white/30 ml-1 font-normal">vs last period</span>
                        </span>
                        
                        <div className="w-24 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={s.data}>
                                    <Line type="monotone" dataKey="value" stroke={s.color} strokeWidth={2.5} dot={false} isAnimationActive={true} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Polls & Votes Chart */}
                <div className="lg:col-span-2 rounded-2xl p-6 border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white font-bold text-lg font-heading">Polls & Votes Overview</h3>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/60">
                        {timeframe === 'CUSTOM' ? `${customRange.start} - ${customRange.end}` : timeframe}
                    </div>
                  </div>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(15,12,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12, backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="polls" name="Polls" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="votes" name="Votes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Poll Status Donut */}
                <div className="rounded-2xl p-6 border border-white/10 flex flex-col relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-white font-bold text-lg font-heading mb-2 relative z-10">Poll Status</h3>
                  
                  <div className="flex-1 flex items-center justify-center relative z-10 -mt-4">
                    <div className="relative w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Active', value: overviewMetrics.activePolls },
                                    { name: 'Ended', value: overviewMetrics.endedPolls },
                                ]} 
                                cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                                paddingAngle={6} dataKey="value" stroke="none" cornerRadius={6}>
                            <Cell fill="#8b5cf6" style={{ filter: 'drop-shadow(0px 4px 10px rgba(139,92,246,0.4))' }} />
                            <Cell fill="rgba(255,255,255,0.1)" />
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(15,12,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-3xl font-bold text-white font-heading">{overviewMetrics.polls.value}</p>
                            <p className="text-white/40 text-xs mt-0.5">Total Polls</p>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-8 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6] shadow-[0_0_10px_#8b5cf6]" />
                        <span className="text-white/70 text-sm font-medium">Active <span className="text-white ml-1">{overviewMetrics.activePolls}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/20" />
                        <span className="text-white/70 text-sm font-medium">Ended <span className="text-white ml-1">{overviewMetrics.endedPolls}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Users Table */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                  <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg font-heading">Recent Users</h3>
                    <button onClick={() => setTab('USERS')} className="text-violet-400 hover:text-violet-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                      View All Users
                    </button>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-white/30 text-xs tracking-wider border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-3 font-semibold text-left">User</th>
                                <th className="px-6 py-3 font-semibold text-left">Email</th>
                                <th className="px-6 py-3 font-semibold text-left">Joined</th>
                                <th className="px-6 py-3 font-semibold text-left">Status</th>
                                <th className="px-6 py-3 font-semibold text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allUsers.slice(0, 5).map(u => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {u.avatarUrl ? (
                                                <img src={u.avatarUrl} alt={u.username} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner border border-white/10" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-white font-medium">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white/50">{u.email}</td>
                                    <td className="px-6 py-4 text-white/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.locked ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                                            {u.locked ? 'Locked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-white/20 hover:text-white transition-colors p-1"><MoreVertical size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                            {allUsers.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-white/30">No users found.</td></tr>}
                        </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="rounded-2xl border border-white/10 overflow-hidden flex flex-col"
                  style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                  <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg font-heading">Activity Feed</h3>
                    <button className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">View All</button>
                  </div>
                  <div className="flex-1 p-6 space-y-6">
                    {activityFeed.map((event, idx) => (
                        <div key={event.id} className="flex gap-4 relative">
                            {idx < activityFeed.length - 1 && <div className="absolute left-4 top-10 bottom-[-24px] w-px bg-white/5"></div>}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border border-white/10 ${
                                event.type === 'USER' ? 'bg-violet-500/20 text-violet-400' :
                                event.type === 'POLL' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-emerald-500/20 text-emerald-400'
                            }`}>
                                {event.type === 'USER' ? <Users size={14}/> : event.type === 'POLL' ? <BarChart3 size={14}/> : <CreditCard size={14}/>}
                            </div>
                            <div className="pt-1.5 flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">
                                    {event.type === 'USER' ? 'New user registered' :
                                     event.type === 'POLL' ? 'New poll created' :
                                     'Payment completed'}
                                </p>
                                <p className="text-white/40 text-xs truncate mt-0.5">
                                    {event.type === 'USER' ? event.data.email :
                                     event.type === 'POLL' ? `"${event.data.title}"` :
                                     `Premium plan - ${(event.data.amount || 0).toLocaleString()}đ`}
                                </p>
                            </div>
                            <div className="pt-1.5 text-right flex-shrink-0">
                                <span className="text-white/30 text-xs">{
                                    // simple time ago logic
                                    (() => {
                                        const diff = Math.floor((Date.now() - event.date.getTime()) / 60000);
                                        if (diff < 60) return `${Math.max(1, diff)} mins ago`;
                                        if (diff < 1440) return `${Math.floor(diff/60)} hours ago`;
                                        return `${Math.floor(diff/1440)} days ago`;
                                    })()
                                }</span>
                            </div>
                        </div>
                    ))}
                    {activityFeed.length === 0 && <p className="text-white/30 text-sm text-center py-4">No recent activity.</p>}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ... [Rest of the specific tabs (USERS, POLLS, PAYMENTS, CATEGORIES) will be updated with similar modern styling in the next iteration] ... */}
          {/* For brevity, I am keeping the other tabs functional but wrapping them in the new glass style */}
          
          {tab === 'USERS' && (
            <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up shadow-xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01] text-white/40 text-xs uppercase tracking-wider">
                        {['#', 'User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 font-semibold text-left ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-white/50">No users found</td></tr>
                      ) : users.map((u, i) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 text-white/30 text-xs">{pageUsers * 20 + i + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                    {u.username[0].toUpperCase()}
                                  </div>
                              )}
                              <div>
                                <span className="text-white font-medium block">{u.username}</span>
                                {u.plan && u.plan !== 'FREE' && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">{u.plan}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/50">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              u.role === 'ADMIN' ? 'text-violet-300 bg-violet-500/20' : 'text-white/60 bg-white/10'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              u.locked ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
                            }`}>{u.locked ? 'Locked' : 'Active'}</span>
                          </td>
                          <td className="px-6 py-4 text-white/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="px-6 py-4 text-right">
                            {u.id !== user?.id && (
                              <button onClick={() => handleToggleLock(u)}
                                className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  u.locked ? 'text-blue-400 border-blue-400/30 hover:bg-blue-400/10' : 'text-orange-400 border-orange-400/30 hover:bg-orange-400/10'
                                }`}>
                                {u.locked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              <Pagination page={pageUsers} totalPages={totalPagesUsers} onPageChange={(p) => { setPageUsers(p); fetchUsers(p); }} />
            </div>
          )}

          {/* ... [POLLS, PAYMENTS, CATEGORIES content omitted here for brevity, keeping original rendering logic but applying new classes if needed] ... */}
          {/* I will add POLLS, PAYMENTS, CATEGORIES back completely to ensure nothing breaks */}
          
          {tab === 'POLLS' && (
            <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up shadow-xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01] text-white/40 text-xs uppercase tracking-wider">
                        {['#', 'Title', 'Creator', 'Votes', 'Options', 'Status', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 font-semibold text-left ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {polls.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-white/50">No polls found</td></tr>
                      ) : polls.map((p, i) => {
                        const active = new Date(p.endTime) > new Date();
                        const totalVotes = p.options.reduce((s, o) => s + o.voteCount, 0);
                        return (
                          <tr key={p.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-white/30 text-xs">{pagePolls * 15 + i + 1}</td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-white font-medium truncate" title={p.title}>{p.title}</p>
                              <p className="text-white/30 text-xs mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                  {p.creator.username[0].toUpperCase()}
                                </div>
                                <span className="text-white/70">{p.creator.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4"><span className="text-white font-semibold">{totalVotes.toLocaleString()}</span></td>
                            <td className="px-6 py-4 text-white/50">{p.options.length}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                active ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 bg-white/10'
                              }`}>{active ? 'Active' : 'Ended'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeletePoll(p)}
                                className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all">
                                <Trash2 size={14} /> Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              <Pagination page={pagePolls} totalPages={totalPagesPolls} onPageChange={(p) => { setPagePolls(p); fetchPolls(p); }} />
            </div>
          )}

          {tab === 'PAYMENTS' && (
             <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-in-up shadow-xl" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.01] text-white/40 text-xs uppercase tracking-wider">
                        {['#', 'Txn Ref', 'User', 'Plan', 'Amount', 'Status', 'Date'].map((h) => (
                            <th key={h} className={`px-6 py-4 font-semibold text-left`}>{h}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {payments.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-16 text-center text-white/30">No transactions found.</td></tr>
                        ) : payments.map((p, i) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-white/30 text-xs">{pagePayments * 20 + i + 1}</td>
                            <td className="px-6 py-4">
                            <span className="font-mono text-xs text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                                {p.txnRef}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                                {p.username[0]?.toUpperCase()}
                                </div>
                                <div>
                                <p className="text-white text-sm font-medium">{p.username}</p>
                                <p className="text-white/40 text-xs">{p.email}</p>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                p.targetPlan === 'PRO' ? 'text-yellow-400 bg-yellow-400/10'
                                : p.targetPlan === 'PLUS' ? 'text-blue-400 bg-blue-400/10'
                                : p.targetPlan === 'GO' ? 'text-emerald-400 bg-emerald-400/10'
                                : 'text-white/40 bg-white/10'
                            }`}>{p.targetPlan}</span>
                            </td>
                            <td className="px-6 py-4"><span className="text-white font-semibold">{p.amount.toLocaleString('vi-VN')}đ</span></td>
                            <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                p.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-400/10'
                                : p.status === 'FAILED' ? 'text-red-400 bg-red-400/10'
                                : 'text-yellow-400 bg-yellow-400/10'
                            }`}>
                                {p.status === 'SUCCESS' ? <CheckCircle2 size={12} />
                                : p.status === 'FAILED' ? <XCircle size={12} />
                                : <Clock size={12} />}
                                {p.status}
                            </span>
                            </td>
                            <td className="px-6 py-4 text-white/50 text-xs">
                            {new Date(p.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                <Pagination page={pagePayments} totalPages={totalPagesPayments} onPageChange={(p) => { setPagePayments(p); fetchPayments(p); }} />
            </div>
          )}

          {tab === 'CATEGORIES' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl font-heading">Category Library</h3>
                <button onClick={() => setCategoryModal({ isOpen: true, isEdit: false, data: { sortOrder: categories.length } })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Plus size={18} /> New Category
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="group rounded-2xl p-5 border border-white/10 hover:border-violet-500/50 transition-all cursor-default relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(ellipse at top left,rgba(139,92,246,0.1),transparent 70%)' }} />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-3 shadow-inner">
                        {cat.icon ?? '📋'}
                      </div>
                      <p className="text-white font-bold text-base truncate w-full">{cat.name}</p>
                      <p className="text-white/40 text-xs font-mono mt-1 w-full truncate">/{cat.slug}</p>
                      {cat.sortOrder != null && (
                        <span className="inline-block mt-3 text-[10px] font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-md">
                          Order: #{cat.sortOrder}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={() => setCategoryModal({ isOpen: true, isEdit: true, data: { ...cat } })}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors backdrop-blur-md" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* DatePicker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl animate-modal-enter" style={{ background: '#0f0c23' }}>
            <h3 className="text-white font-bold text-lg font-heading mb-6">Custom Date Range</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Start Date</label>
                    <input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({...p, start: e.target.value}))}
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none color-scheme-dark" />
                </div>
                <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">End Date</label>
                    <input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({...p, end: e.target.value}))}
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none color-scheme-dark" />
                </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDatePicker(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/60 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={() => { setTimeframe('CUSTOM'); setShowDatePicker(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Kept functionality but restyled) */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-modal-enter" style={{ background: '#0f0c23' }}>
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg font-heading">{categoryModal.isEdit ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => setCategoryModal({ isOpen: false, isEdit: false, data: {} })} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div>
                <label className="block text-white/60 text-xs font-semibold mb-1.5">Name <span className="text-pink-400">*</span></label>
                <input type="text" value={categoryModal.data.name || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                  placeholder="e.g. Technology" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold mb-1.5">Slug (Auto-generated)</label>
                <input type="text" value={categoryModal.data.slug || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value } }))}
                  placeholder="e.g. technology" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-white/60 text-xs font-semibold mb-1.5 flex items-center gap-1">Icon <Smile size={14} /></label>
                  <input type="text" value={categoryModal.data.icon || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: e.target.value } }))}
                    placeholder="e.g. 💻" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none text-xl" />
                </div>
                <div>
                  <label className="block text-white/60 text-xs font-semibold mb-1.5 flex items-center gap-1">Sort Order <Activity size={14} /></label>
                  <input type="number" value={categoryModal.data.sortOrder ?? 0} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, sortOrder: parseInt(e.target.value) || 0 } }))}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold mb-2">Quick Icons</label>
                <div className="flex flex-wrap gap-2">
                  {['💻', '🎮', '⚽', '📚', '🎬', '💼', '🍔', '🎨', '🔥', '📊'].map(emoji => (
                    <button key={emoji} onClick={() => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: emoji } }))}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xl flex items-center justify-center transition-all hover:scale-110">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-white/5 flex gap-3">
              <button onClick={() => setCategoryModal({ isOpen: false, isEdit: false, data: {} })} className="flex-1 py-3 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSaveCategory} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Save size={18} /> Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl animate-modal-enter" style={{ background: '#0f0c23' }}>
            <h3 className="text-white font-bold text-lg font-heading mb-2">{confirmModal.title}</h3>
            <p className="text-white/50 text-sm mb-6">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold z-[100] animate-fade-in-up border ${
          toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-pink-500/20 border-pink-500/30'
        }`} style={{ backdropFilter: 'blur(20px)' }}>
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={16} className="opacity-60 hover:opacity-100" /></button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

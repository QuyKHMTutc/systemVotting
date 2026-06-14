import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user.service';
import type { UserDTO } from '../../services/user.service';
import { pollService } from '../../services/poll.service';
import type { Poll } from '../../services/poll.service';
import { paymentService } from '../../services/payment.service';
import type { AdminPaymentHistory } from '../../services/payment.service';
import { categoryService } from '../../services/category.service';
import type { Category } from '../../services/category.service';
import { moderationService } from '../../services/moderation.service';
import type { PendingPoll, FlaggedComment, ModerationCount } from '../../services/moderation.service';
import { useAdminModerationWebSocket } from '../../hooks/useAdminModerationWebSocket';
import { LayoutDashboard, Users, BarChart3, CreditCard, Tag, Shield, Calendar, Search, Bell, Flag } from 'lucide-react';
import type { Tab, Timeframe } from './types';
import AdminSidebar from './components/AdminSidebar';
import AdminToast from './components/AdminToast';
import AdminConfirmModal from './components/AdminConfirmModal';
import AdminCategoryModal from './components/AdminCategoryModal';
import AdminDatePickerModal from './components/AdminDatePickerModal';
import OverviewTab from './tabs/OverviewTab';
import UsersTab from './tabs/UsersTab';
import PollsTab from './tabs/PollsTab';
import PaymentsTab from './tabs/PaymentsTab';
import CategoriesTab from './tabs/CategoriesTab';
import ModerationTab from './tabs/ModerationTab';
import ReportsTab from './tabs/ReportsTab';
import { reportService, ReportStatus } from '../../services/report.service';
import type { ReportResponse } from '../../services/report.service';

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

  // Moderation States
  const [moderationCount, setModerationCount] = useState<ModerationCount>({ pendingPolls: 0, flaggedComments: 0, total: 0 });
  const [pendingPolls, setPendingPolls] = useState<PendingPoll[]>([]);
  const [pagePendingPolls, setPagePendingPolls] = useState(0);
  const [totalPagesPendingPolls, setTotalPagesPendingPolls] = useState(0);
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([]);
  const [pageFlaggedComments, setPageFlaggedComments] = useState(0);
  const [totalPagesFlaggedComments, setTotalPagesFlaggedComments] = useState(0);
  const [moderationSubTab, setModerationSubTab] = useState<'POLLS' | 'COMMENTS'>('POLLS');
  const [expandedPollId, setExpandedPollId] = useState<number | null>(null);

  // Reports States
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [pageReports, setPageReports] = useState(0);
  const [totalPagesReports, setTotalPagesReports] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Methods
  const fetchOverviewData = useCallback(async () => {
    try {
      const [u, p, pay] = await Promise.all([
        userService.getAllUsers(0, 1000, ''),
        pollService.getAllAdminPolls(0, 1000, '', 'ALL', 'ALL', 'createdAt', 'desc'),
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
      const pd = await pollService.getAllAdminPolls(page, 15, q, 'ALL', 'ALL', 'createdAt', 'desc');
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

  const fetchModerationCount = useCallback(async () => {
    try { setModerationCount(await moderationService.getCount()); } catch { /* silent */ }
  }, []);

  const fetchPendingPolls = useCallback(async (page = 0) => {
    try {
      const data = await moderationService.getPendingPolls(page, 15);
      setPendingPolls(data.content);
      setTotalPagesPendingPolls(data.totalPages);
    } catch (err) { console.error(err); }
  }, []);

  const fetchFlaggedComments = useCallback(async (page = 0) => {
    try {
      const data = await moderationService.getFlaggedComments(page, 20);
      setFlaggedComments(data.content);
      setTotalPagesFlaggedComments(data.totalPages);
    } catch (err) { console.error(err); }
  }, []);

  const fetchReports = useCallback(async (page = 0, status?: ReportStatus) => {
    try {
      const data = await reportService.getAllReports({ page, size: 20, status });
      setReports(data.content);
      setTotalPagesReports(data.totalPages);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAll = useCallback(() => {
    if (user?.role !== 'ADMIN') { navigate('/'); return; }
    if (tab === 'OVERVIEW') { fetchOverviewData(); }
    if (tab === 'USERS') fetchUsers(pageUsers);
    if (tab === 'POLLS') fetchPolls(pagePolls);
    if (tab === 'PAYMENTS') fetchPayments(pagePayments);
    if (tab === 'CATEGORIES') fetchCategories();
    if (tab === 'MODERATION') { fetchPendingPolls(0); fetchFlaggedComments(0); }
    if (tab === 'REPORTS') { fetchReports(pageReports); }
    // Always keep count refreshed for badge
    fetchModerationCount();
  }, [user, navigate, tab, fetchOverviewData, fetchUsers, pageUsers, fetchPolls, pagePolls, fetchPayments, pagePayments, fetchCategories, fetchPendingPolls, fetchFlaggedComments, fetchReports, pageReports, fetchModerationCount]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time: nhận COUNT_UPDATED từ AdminPanel WebSocket khi có admin khác hoạt động
  const handleAdminModerationEvent = useCallback((event: import('../../hooks/useAdminModerationWebSocket').AdminModerationEvent) => {
    if (event.type === 'COUNT_UPDATED') {
      setModerationCount({
        pendingPolls: event.pendingPolls,
        flaggedComments: event.flaggedComments,
        total: event.total,
      });
      // Nếu đang ở tab MODERATION thì tự refresh danh sách
      if (tab === 'MODERATION') {
        fetchPendingPolls(pagePendingPolls);
        fetchFlaggedComments(pageFlaggedComments);
      }
    }
  }, [tab, pagePendingPolls, pageFlaggedComments, fetchPendingPolls, fetchFlaggedComments]);

  useAdminModerationWebSocket({ onEvent: handleAdminModerationEvent });

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

  const handleApprovePoll = async (id: number) => {
    try {
      await moderationService.approvePoll(id);
      showToast('✅ Bài đăng đã được phê duyệt và xuất hiện công khai');
      fetchPendingPolls(pagePendingPolls);
      fetchModerationCount();
    } catch { showToast('Phê duyệt thất bại', 'error'); }
  };

  const handleRejectPoll = (poll: PendingPoll) => {
    setConfirmModal({
      title: 'Từ chối bài đăng',
      msg: `Từ chối và ẩn bài đăng "${poll.title}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await moderationService.rejectPoll(poll.id);
          showToast('🚫 Bài đăng đã bị từ chối');
          fetchPendingPolls(pagePendingPolls);
          fetchModerationCount();
        } catch { showToast('Từ chối thất bại', 'error'); }
        setConfirmModal(null);
      }
    });
  };

  const handleApproveComment = async (id: number) => {
    try {
      await moderationService.approveComment(id);
      showToast('✅ Bình luận đã được xác nhận an toàn');
      fetchFlaggedComments(pageFlaggedComments);
      fetchModerationCount();
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const handleBlockComment = async (id: number) => {
    try {
      await moderationService.blockComment(id);
      showToast('🚫 Bình luận đã bị chặn');
      fetchFlaggedComments(pageFlaggedComments);
      fetchModerationCount();
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const handleUpdateReportStatus = async (id: number, status: ReportStatus) => {
    try {
      await reportService.updateReportStatus(id, status);
      showToast('Cập nhật trạng thái báo cáo thành công');
      fetchReports(pageReports);
    } catch { showToast('Cập nhật thất bại', 'error'); }
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
    
    const current = new Date(start);
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
      const current = new Date(start);
      const limit = timeframe === 'ALL' ? 30 : (end.getTime() - start.getTime()) / 86400000 + 1; // max 30 points for sparkline
      const step = Math.max(1, Math.floor(limit / 10)); // reduce points for smooth sparkline
      
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
    { id: 'MODERATION',  label: 'Moderation',  icon: <Shield size={18} />,    badge: moderationCount.total > 0 ? moderationCount.total : undefined },
    { id: 'REPORTS',     label: 'Reports',     icon: <Flag size={18} /> },
  ];

  return (
    <div className="h-screen overflow-hidden flex text-slate-200 font-sans relative z-0" style={{ background: '#070514' }}>

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
                : tab === 'MODERATION' ? 'Content Moderation'
                : tab === 'REPORTS'    ? 'Report Management'
                : 'Payment Transactions'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {tab === 'OVERVIEW'    ? "Welcome back! Here's what's happening with your platform."
                : tab === 'USERS'   ? `Manage and monitor ${allUsers.length} user accounts`
                : tab === 'POLLS'   ? `Oversee ${allPolls.length} community polls`
                : tab === 'CATEGORIES' ? `Organize ${categories.length} categories`
                : tab === 'MODERATION' ? `Review ${moderationCount.total} pending items`
                : tab === 'REPORTS'    ? `Review community reports`
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
            <button className="relative p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#070514]"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide relative z-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {tab === 'OVERVIEW' && (
              <OverviewTab 
                overviewMetrics={overviewMetrics} 
                activityFeed={activityFeed} 
                chartData={chartData} 
                sparklines={sparklines} 
                timeframe={timeframe} 
                customRange={customRange}
                allUsers={allUsers}
                setTab={setTab}
              />
            )}
            
            {tab === 'USERS' && (
              <UsersTab
                users={users}
                pageUsers={pageUsers}
                setPageUsers={setPageUsers}
                totalPagesUsers={totalPagesUsers}
                fetchUsers={fetchUsers}
                handleToggleLock={handleToggleLock}
                currentUser={user}
              />
            )}

            {tab === 'POLLS' && (
              <PollsTab
                polls={polls}
                pagePolls={pagePolls}
                setPagePolls={setPagePolls}
                totalPagesPolls={totalPagesPolls}
                handleDeletePoll={handleDeletePoll}
              />
            )}

            {tab === 'PAYMENTS' && (
              <PaymentsTab
                payments={payments}
                pagePayments={pagePayments}
                setPagePayments={setPagePayments}
                totalPagesPayments={totalPagesPayments}
                fetchPayments={fetchPayments}
              />
            )}

            {tab === 'CATEGORIES' && (
              <CategoriesTab
                categories={categories}
                setCategoryModal={setCategoryModal}
                handleDeleteCategory={handleDeleteCategory}
              />
            )}

            {tab === 'MODERATION' && (
              <ModerationTab
                moderationCount={moderationCount}
                moderationSubTab={moderationSubTab}
                setModerationSubTab={setModerationSubTab}
                pendingPolls={pendingPolls}
                expandedPollId={expandedPollId}
                setExpandedPollId={setExpandedPollId}
                onApprovePoll={handleApprovePoll}
                onRejectPoll={handleRejectPoll}
                flaggedComments={flaggedComments}
                onApproveComment={handleApproveComment}
                onBlockComment={handleBlockComment}
                pagePendingPolls={pagePendingPolls}
                setPagePendingPolls={setPagePendingPolls}
                totalPagesPendingPolls={totalPagesPendingPolls}
                pageFlaggedComments={pageFlaggedComments}
                setPageFlaggedComments={setPageFlaggedComments}
                totalPagesFlaggedComments={totalPagesFlaggedComments}
              />
            )}

            {tab === 'REPORTS' && (
              <ReportsTab
                reports={reports}
                pageReports={pageReports}
                setPageReports={setPageReports}
                totalPagesReports={totalPagesReports}
                fetchReports={fetchReports}
                handleUpdateStatus={handleUpdateReportStatus}
              />
            )}
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <AdminSidebar tab={tab} setTab={setTab} setSearch={setSearch} navItems={navItems} user={user} logout={logout} />

      {/* Modals & Toasts */}
      <AdminToast toast={toast} setToast={setToast} />
      
      <AdminConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} />

      <AdminCategoryModal
        categoryModal={categoryModal}
        setCategoryModal={setCategoryModal}
        handleSaveCategory={handleSaveCategory}
      />

      <AdminDatePickerModal
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        customRange={customRange}
        setCustomRange={setCustomRange}
        setTimeframe={setTimeframe}
      />

    </div>
  );
};

export default AdminPanel;

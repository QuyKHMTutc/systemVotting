import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import { commentService, type Comment } from '../services/comment.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import {
  ListPlus, CheckSquare, PenLine, MessageSquare,
  CreditCard, Crown, Zap, ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import UserProfileModal from '../components/UserProfileModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePollEventsWebSocket, type PollEventPayload } from '../hooks/usePollEventsWebSocket';
import { useTranslation } from 'react-i18next';
import { paymentService, type PaymentHistory } from '../services/payment.service';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'created' | 'voted' | 'comments' | 'payments') || 'created';
  const setActiveTab = (tab: 'created' | 'voted' | 'comments' | 'payments') =>
    setSearchParams({ tab }, { replace: true });

  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const initialLoaded = useRef(false); // chỉ show spinner lần đầu tiên

  const handleDeletePoll = async (pollId: number) => {
    if (!window.confirm(t('profile.deleteConfirm'))) return;
    try {
      await pollService.deletePoll(pollId);
      setCreatedPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch (err: any) {
      alert(err.response?.data?.message || t('profile.deleteFail'));
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        // Chỉ hiện loading spinner lần đầu — các lần sau bảo toàn UI (tránh unmount Navbar)
        if (!initialLoaded.current) setLoading(true);
        const [created, voted, comments, ph] = await Promise.all([
          pollService.getMyPolls(),
          pollService.getMyVotedPolls(),
          commentService.getMyComments(),
          paymentService.getPaymentHistory().catch(() => [])
        ]);
        setCreatedPolls(created);
        setVotedPolls(voted);
        setMyComments(comments);
        setPayments(ph || []);
      } catch {
        setError(t('profile.loadFail'));
      } finally {
        initialLoaded.current = true;
        setLoading(false);
      }
    };
    if (user) fetch();
  // Dùng user?.id thay vì user — chỉ re-fetch khi đổi user, không phải khi plan/avatar update
  }, [user?.id]);

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    const up = (prev: Poll[]) => {
      let list = [...prev];
      if (payload.type === 'CREATED') {
        if (user && payload.poll.creator.id === user.id && !list.some(p => p.id === payload.poll.id)) list.unshift(payload.poll);
      } else if (payload.type === 'DELETED') {
        list = list.filter(p => p.id !== payload.pollId);
      } else if (payload.type === 'VOTED') {
        list = list.map(p => p.id === payload.pollId
          ? { ...p, options: p.options.map(o => { const u = payload.options.find(x => x.optionId === o.id); return u ? { ...o, voteCount: u.voteCount } : o; }) }
          : p);
      } else if (payload.type === 'COMMENT_ADDED') {
        list = list.map(p => p.id === payload.pollId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p);
      }
      return list;
    };
    setCreatedPolls(p => up(p));
    setVotedPolls(p => up(p));
  }, [user?.id]);

  usePollEventsWebSocket({ onEvent: handlePollEvent });

  /* ── helpers ── */
  const avatarSrc = user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl.trim() !== ''
    ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob')
      ? user.avatarUrl
      : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`)
    : null;

  const planUpper = (user?.plan || 'FREE').toUpperCase();
  const planMeta = planUpper === 'PLUS'
    ? { label: 'PLUS', gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/40', icon: <Crown className="w-3.5 h-3.5" />, pill: 'bg-amber-500/10 border-amber-400/40 text-amber-600 dark:text-amber-300' }
    : planUpper === 'PRO'
    ? { label: 'PRO', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/40', icon: <Crown className="w-4 h-4" />, pill: 'bg-rose-500/10 border-rose-400/40 text-rose-600 dark:text-rose-300' }
    : planUpper === 'GO'
    ? { label: 'GO', gradient: 'from-violet-500 to-indigo-600', shadow: 'shadow-violet-500/40', icon: <Zap className="w-3.5 h-3.5" />, pill: 'bg-violet-500/10 border-violet-400/40 text-violet-600 dark:text-violet-300' }
    : null;

  const expDate = user?.plan && user.plan !== 'FREE' ? (user as any).planExpirationDate : null;
  const daysLeft = expDate ? Math.ceil((new Date(expDate).getTime() - Date.now()) / 86400000) : null;
  const expiryUI = daysLeft === null ? null
    : daysLeft <= 0 ? { text: 'Đã hết hạn', color: 'text-red-500 dark:text-red-400', dot: 'bg-red-500 animate-ping' }
      : daysLeft <= 7 ? { text: `⚠ Còn ${daysLeft} ngày`, color: 'text-orange-500 dark:text-orange-400', dot: 'bg-orange-500 animate-pulse' }
        : { text: `Còn ${daysLeft} ngày`, color: 'text-slate-500 dark:text-white/40', dot: 'bg-emerald-400' };

  const tabs = [
    { key: 'created', icon: <ListPlus className="w-4 h-4" />, label: t('profile.createdPolls'), count: createdPolls.length },
    { key: 'voted', icon: <CheckSquare className="w-4 h-4" />, label: t('profile.votedPolls'), count: votedPolls.length },
    { key: 'comments', icon: <MessageSquare className="w-4 h-4" />, label: t('profile.myComments'), count: myComments.length },
    { key: 'payments', icon: <CreditCard className="w-4 h-4" />, label: 'Lịch sử thanh toán', count: null },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#07050f]">
      <Navbar />

      {/* ══════════════════ HERO COVER ══════════════════ */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#2d1060] to-[#0f0a2e]" />
        {/* Mesh blobs */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-600/30 blur-[120px] -top-40 -left-20" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-pink-600/25 blur-[90px] top-0 right-10" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-[80px] bottom-0 left-1/3" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }}
        />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f5f5f7] dark:from-[#07050f] to-transparent" />
        {/* Back btn */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white/80 text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* ══════════════════ PROFILE CARD ══════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white dark:bg-[#0e0b1f] rounded-3xl shadow-[0_2px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_40px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/[0.06] overflow-hidden">

          {/* ── profile info row ── */}
          <div className="px-6 sm:px-10 pt-5 pb-0 flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8">

            {/* Avatar */}
            <div className="relative shrink-0 -mt-16 sm:-mt-20 self-start sm:self-auto">
              <div className={`p-[3px] rounded-[28px] bg-gradient-to-br ${planMeta?.gradient ?? 'from-slate-300 to-slate-400 dark:from-white/20 dark:to-white/10'} shadow-2xl ${planMeta?.shadow ?? ''}`}>
                <div className="w-28 h-28 sm:w-[140px] sm:h-[140px] rounded-[26px] overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={user?.username} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`; }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center">
                      <span className="text-5xl font-black text-white select-none">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Plan icon dot */}
              {planMeta && (
                <div className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-gradient-to-br ${planMeta.gradient} flex items-center justify-center text-white ring-2 ring-white dark:ring-[#0e0b1f] shadow-md`}>
                  {planMeta.icon}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pb-6">
              {/* Row: name + plan badge */}
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {user?.username}
                </h1>
                {planMeta && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-full text-[11px] font-black tracking-wide ${planMeta.pill}`}>
                    {planMeta.icon} {planMeta.label}
                  </span>
                )}
                {!planMeta && (
                  <span className="inline-flex items-center px-2.5 py-1 border border-slate-200 dark:border-white/10 rounded-full text-[11px] font-bold text-slate-400 dark:text-white/30 bg-slate-50 dark:bg-white/[0.03]">
                    FREE
                  </span>
                )}
              </div>

              {/* Email */}
              <p className="text-slate-500 dark:text-white/40 text-sm mb-3">{user?.email}</p>

              {/* Expiry */}
              {expiryUI && (
                <div className="flex items-center gap-1.5 mb-4">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${expiryUI.dot}`} />
                  <span className={`text-xs font-semibold ${expiryUI.color}`}>{expiryUI.text}</span>
                  {daysLeft !== null && daysLeft > 0 && (
                    <span className="text-xs text-slate-400 dark:text-white/25">
                      · {new Date(expDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              )}

              {/* Stats inline — kiểu GitHub/Twitter */}
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  { val: createdPolls.length, label: 'bài đăng' },
                  { val: votedPolls.length, label: 'lượt vote' },
                  { val: myComments.length, label: 'bình luận' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{s.val}</span>
                    <span className="text-sm text-slate-500 dark:text-white/40 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit button — top-right on desktop */}
            <div className="sm:pb-6 shrink-0 self-start sm:self-end">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                  bg-slate-900 dark:bg-white text-white dark:text-slate-900
                  hover:bg-slate-700 dark:hover:bg-slate-100
                  shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  border border-slate-800 dark:border-white/10"
              >
                <PenLine className="w-4 h-4" />
                {t('profile.editProfile')}
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="relative mt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex overflow-x-auto px-6 sm:px-10 scrollbar-none">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-none flex items-center gap-2 py-4 px-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 ${active
                        ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                  >
                    <span className={active ? 'text-indigo-500' : 'text-slate-400 dark:text-white/30'}>{tab.icon}</span>
                    {tab.label}
                    {tab.count !== null && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/30'
                        }`}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════ TAB CONTENT ══════════════════ */}
        <div className="mt-5 pb-20">
          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm text-center">{error}</div>
          )}

          {/* Created */}
          {activeTab === 'created' && (
            createdPolls.length > 0
              ? <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {createdPolls.map((poll, i) => (
                  <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 rounded-2xl">
                      <PollCard poll={poll} onDelete={handleDeletePoll} showDeleteButton />
                    </div>
                  </div>
                ))}
              </div>
              : <ProfileEmpty icon={<ListPlus className="w-8 h-8" />} title={t('profile.noPollsYet')} desc={t('profile.noPollsDesc')} action={{ label: t('profile.createPollBtn'), onClick: () => navigate('/create-poll') }} />
          )}

          {/* Voted */}
          {activeTab === 'voted' && (
            votedPolls.length > 0
              ? <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {votedPolls.map((poll, i) => (
                  <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 rounded-2xl">
                      <PollCard poll={poll} />
                    </div>
                  </div>
                ))}
              </div>
              : <ProfileEmpty icon={<CheckSquare className="w-8 h-8" />} title={t('profile.noVotesYet')} desc={t('profile.noVotesDesc')} action={{ label: t('profile.browsePollsBtn'), onClick: () => navigate('/') }} />
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            myComments.length > 0
              ? <div className="space-y-3">
                {myComments.map((c, i) => (
                  <div key={c.id} className="animate-fade-in-up bg-white dark:bg-[#0e0b1f] rounded-2xl border border-slate-100 dark:border-white/[0.05] p-5 hover:shadow-md hover:border-slate-200 dark:hover:border-white/[0.1] transition-all" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="flex gap-4">
                      <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                        {c.isAnonymous ? 'A' : (
                          c.avatarUrl && c.avatarUrl !== 'null' && c.avatarUrl.trim() !== '' ? (
                            <img src={c.avatarUrl.startsWith('http') || c.avatarUrl.startsWith('blob') ? c.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${c.avatarUrl}`} alt={c.username} className="w-full h-full object-cover" />
                          ) : c.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white text-sm">{c.isAnonymous ? 'Anonymous' : c.username}</span>
                          <span className="text-slate-300 dark:text-white/20 text-xs">·</span>
                          <span className="text-slate-400 dark:text-white/30 text-xs">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                          {c.pollTitle && (
                            <>
                              <span className="text-slate-300 dark:text-white/20 text-xs">·</span>
                              <button onClick={() => navigate(`/poll/${c.pollId}`)} className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">{c.pollTitle}</button>
                            </>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-white/60 text-sm leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              : <ProfileEmpty icon={<MessageSquare className="w-8 h-8" />} title={t('profile.noCommentsYet')} desc={t('profile.noCommentsDesc')} action={{ label: t('profile.browsePollsBtn'), onClick: () => navigate('/') }} />
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            payments.length > 0
              ? <div className="bg-white dark:bg-[#0e0b1f] rounded-2xl border border-slate-100 dark:border-white/[0.05] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                      {['Mã giao dịch', 'Thời gian', 'Gói', 'Số tiền', 'Trạng thái'].map((h, i) => (
                        <th key={i} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((txn, i) => (
                      <tr key={txn.id} className={`border-b border-slate-50 dark:border-white/[0.03] last:border-0 hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-white/[0.015]'}`}>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400 dark:text-white/25">{txn.txnRef}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700 dark:text-white/60">{new Date(txn.createdAt).toLocaleDateString('vi-VN')}</span>
                          <br />
                          <span className="text-[10px] text-slate-400 dark:text-white/25">{new Date(txn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${txn.targetPlan === 'PLUS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'}`}>
                            {txn.targetPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">{txn.amount.toLocaleString('vi-VN')}đ</td>
                        <td className="px-6 py-4">
                          {txn.status === 'SUCCESS' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Thành công
                            </span>
                          )}
                          {txn.status === 'PENDING' && (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/50 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.08]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/30" />Chờ thanh toán
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-white/25 px-1">Chưa quét mã QR</span>
                            </div>
                          )}
                          {txn.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-100 dark:border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Thất bại
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              : <ProfileEmpty icon={<CreditCard className="w-8 h-8" />} title="Chưa có giao dịch" desc="Bạn chưa thực hiện giao dịch thanh toán gói nào." />
          )}
        </div>
      </div>

      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
};

/* ── Empty state ── */
function ProfileEmpty({ icon, title, desc, action }: {
  icon: React.ReactNode; title: string; desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-24 animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-300 dark:text-white/20">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-white/40 text-sm mb-8 max-w-xs mx-auto leading-relaxed">{desc}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-all hover:scale-[1.02] shadow-md"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}

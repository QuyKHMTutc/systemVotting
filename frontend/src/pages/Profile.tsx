import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pollService } from '../services/poll.service';
import { commentService, type Comment } from '../services/comment.service';
import type { Poll } from '../services/poll.service';
import { PollCard } from '../components/PollCard';
import { ListPlus, CheckSquare, X, PenLine, MessageSquare, CreditCard } from 'lucide-react';
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
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [created, voted, comments, paymentHistory] = await Promise.all([
          pollService.getMyPolls(),
          pollService.getMyVotedPolls(),
          commentService.getMyComments(),
          paymentService.getPaymentHistory().catch(() => [])
        ]);
        setCreatedPolls(created);
        setVotedPolls(voted);
        setMyComments(comments);
        setPayments(paymentHistory || []);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
        setError(t('profile.loadFail'));
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfileData();
  }, [user]);

  const handlePollEvent = useCallback((payload: PollEventPayload) => {
    const updateList = (prev: Poll[]) => {
      let newContent = [...prev];
      if (payload.type === 'CREATED') {
        if (user && payload.poll.creator.id === user.id && !newContent.some(p => p.id === payload.poll.id)) {
          newContent.unshift(payload.poll);
        }
      } else if (payload.type === 'DELETED') {
        newContent = newContent.filter(p => p.id !== payload.pollId);
      } else if (payload.type === 'VOTED') {
        newContent = newContent.map(p => {
          if (p.id === payload.pollId) {
            return { ...p, options: p.options.map(opt => { const updated = payload.options.find(o => o.optionId === opt.id); return updated ? { ...opt, voteCount: updated.voteCount } : opt; }) };
          }
          return p;
        });
      } else if (payload.type === 'COMMENT_ADDED') {
        newContent = newContent.map(p => p.id === payload.pollId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p);
      }
      return newContent;
    };
    setCreatedPolls(prev => updateList(prev));
    setVotedPolls(prev => updateList(prev));
  }, [user]);

  usePollEventsWebSocket({ onEvent: handlePollEvent });

  const avatarSrc = user?.avatarUrl && user.avatarUrl !== 'null' && user.avatarUrl.trim() !== ''
    ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob')
        ? user.avatarUrl
        : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`)
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pb-16">
      <Navbar />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* =========== SIDEBAR TRÁI - STICKY =========== */}
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-transparent">
              
              {/* Cover gradient */}
              <div className="relative h-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-indigo-400/30 blur-3xl -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-purple-400/25 blur-3xl translate-y-1/2" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
                <button
                  onClick={() => navigate(-1)}
                  className="absolute top-3 right-3 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-all duration-200"
                  aria-label="Back"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar + info */}
              <div className="flex flex-col items-center text-center px-6 pb-6 -mt-12">
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="w-24 h-24 rounded-full ring-4 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden shadow-xl shadow-black/20">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={user?.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`;
                        }}
                      />
                    ) : (
                      <span className="text-3xl font-bold text-slate-800 dark:text-white/90">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl -z-10 scale-110" />
                </div>

                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight">{user?.username}</h1>
                <p className="text-slate-500 dark:text-white/50 text-xs mb-4">{user?.email}</p>

                {/* Plan badge */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    user?.plan === 'PLUS' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300' :
                    user?.plan === 'GO'   ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' :
                                            'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60'
                  }`}>
                    Gói: <span className="font-black">{user?.plan || 'FREE'}</span>
                  </span>
                  {user?.plan && user.plan !== 'FREE' && (user as any).planExpirationDate && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50">
                      HH: {new Date((user as any).planExpirationDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                {/* Edit profile button */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <PenLine className="w-4 h-4" />
                  {t('profile.editProfile')}
                </button>

                {/* Stats */}
                <div className="w-full grid grid-cols-3 gap-1 mt-5 pt-5 border-t border-slate-200 dark:border-white/10">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{createdPolls.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wide font-medium mt-0.5">Polls</p>
                  </div>
                  <div className="text-center border-x border-slate-200 dark:border-white/10">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{votedPolls.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wide font-medium mt-0.5">Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{myComments.length}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wide font-medium mt-0.5">Bình luận</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========== PHẦN NỘI DUNG PHẢI =========== */}
          <div className="flex-1 min-w-0">
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-transparent overflow-hidden">
              
              {/* Tabs */}
              <div className="relative border-b border-slate-200 dark:border-white/10">
                <div className="flex">
                  {[
                    { key: 'created', icon: <ListPlus className="w-4 h-4" />, label: t('profile.createdPolls'), count: createdPolls.length },
                    { key: 'voted',   icon: <CheckSquare className="w-4 h-4" />, label: t('profile.votedPolls'), count: votedPolls.length },
                    { key: 'comments', icon: <MessageSquare className="w-4 h-4" />, label: t('profile.myComments'), count: myComments.length },
                    { key: 'payments', icon: <CreditCard className="w-4 h-4" />, label: 'Lịch sử thanh toán', count: null },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`relative flex-1 py-4 px-1 sm:px-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors duration-200 ${
                        activeTab === tab.key
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                      }`}
                    >
                      <span className="hidden sm:block">{tab.icon}</span>
                      <span className="text-[11px] sm:text-sm">{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold hidden sm:inline-block ${
                          activeTab === tab.key
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Glowing underline indicator */}
                <div
                  className="absolute bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-[left] duration-300 ease-out"
                  style={{
                    left: activeTab === 'created' ? '12.5%' : activeTab === 'voted' ? '37.5%' : activeTab === 'comments' ? '62.5%' : '87.5%',
                    width: '25%',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)',
                  }}
                />
              </div>

              {/* Tab Content */}
              <div className="p-6 sm:p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm text-center">{error}</div>
                )}

                <div className="space-y-5">
                  {/* Created polls */}
                  {activeTab === 'created' && (
                    createdPolls.length > 0 ? (
                      createdPolls.map((poll, i) => (
                        <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="transition-transform duration-200 hover:-translate-y-0.5">
                            <PollCard poll={poll} onDelete={handleDeletePoll} showDelete={true} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <ListPlus className="h-8 w-8 text-slate-400 dark:text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noPollsYet')}</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mb-4">{t('profile.noPollsDesc')}</p>
                        <button onClick={() => navigate('/create-poll')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm">{t('profile.createPollBtn')}</button>
                      </div>
                    )
                  )}

                  {/* Voted polls */}
                  {activeTab === 'voted' && (
                    votedPolls.length > 0 ? (
                      votedPolls.map((poll, i) => (
                        <div key={poll.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="transition-transform duration-200 hover:-translate-y-0.5">
                            <PollCard poll={poll} showDelete={false} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <CheckSquare className="h-8 w-8 text-slate-400 dark:text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noVotesYet')}</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mb-4">{t('profile.noVotesDesc')}</p>
                        <button onClick={() => navigate('/')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm">{t('profile.browsePollsBtn')}</button>
                      </div>
                    )
                  )}

                  {/* Comments */}
                  {activeTab === 'comments' && (
                    myComments.length > 0 ? (
                      myComments.map((comment, i) => (
                        <div
                          key={comment.id}
                          className="animate-fade-in-up p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] hover:bg-slate-100/50 dark:hover:bg-white/[0.05] transition-colors"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold border border-indigo-200 dark:border-indigo-500/30 overflow-hidden">
                               {comment.isAnonymous ? 'A' : (
                                   comment.avatarUrl && comment.avatarUrl !== 'null' && comment.avatarUrl.trim() !== '' ? (
                                       <img src={comment.avatarUrl.startsWith('http') || comment.avatarUrl.startsWith('blob') ? comment.avatarUrl : `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${comment.avatarUrl}`} alt={comment.username} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.username}` }} />
                                   ) : comment.username.charAt(0).toUpperCase()
                               )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-slate-800 dark:text-white/90 text-sm">{comment.isAnonymous ? 'Anonymous' : comment.username}</span>
                                <span className="text-xs text-slate-400 dark:text-white/40">•</span>
                                <span className="text-xs text-slate-500 dark:text-white/50">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                {comment.pollTitle && (
                                  <>
                                    <span className="text-xs text-slate-400 dark:text-white/40">•</span>
                                    <button onClick={() => navigate(`/poll/${comment.pollId}`)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 truncate max-w-[150px] sm:max-w-xs">{comment.pollTitle}</button>
                                  </>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-white/80 text-sm whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <MessageSquare className="h-8 w-8 text-slate-400 dark:text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('profile.noCommentsYet')}</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm mb-4">{t('profile.noCommentsDesc')}</p>
                        <button onClick={() => navigate('/')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm">{t('profile.browsePollsBtn')}</button>
                      </div>
                    )
                  )}

                  {/* Payment history */}
                  {activeTab === 'payments' && (
                    payments.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-600 dark:text-white/70">
                            <tr>
                              <th className="px-5 py-4 rounded-tl-xl">Mã GD</th>
                              <th className="px-5 py-4">Thời gian</th>
                              <th className="px-5 py-4">Gói</th>
                              <th className="px-5 py-4">Số tiền</th>
                              <th className="px-5 py-4 rounded-tr-xl">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/10 bg-white dark:bg-transparent">
                            {payments.map((txn) => (
                              <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-white/40">{txn.txnRef}</td>
                                <td className="px-5 py-4 text-slate-600 dark:text-white/60 whitespace-nowrap text-xs">
                                  {new Date(txn.createdAt).toLocaleDateString('vi-VN')}<br />
                                  <span className="text-slate-400 dark:text-white/30">{new Date(txn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-5 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    txn.targetPlan === 'PLUS'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                  }`}>{txn.targetPlan}</span>
                                </td>
                                <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{(txn.amount).toLocaleString('vi-VN')}đ</td>
                                <td className="px-5 py-4">
                                  {txn.status === 'SUCCESS' && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-semibold">Thành công</span>}
                                  {txn.status === 'PENDING' && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full text-xs font-semibold">Đang xử lý</span>}
                                  {txn.status === 'FAILED' && <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-full text-xs font-semibold">Thất bại</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <CreditCard className="h-8 w-8 text-slate-400 dark:text-white/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Chưa có giao dịch</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm">Bạn chưa thực hiện giao dịch thanh toán nâng cấp gói nào.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

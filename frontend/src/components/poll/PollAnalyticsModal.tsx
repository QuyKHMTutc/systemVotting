import { useState, useEffect, useMemo } from 'react';
import {
  X, Download, TrendingUp, AlertCircle,
  Trophy, Users, BarChart2, Clock, Activity, Table2, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { pollService } from '../../services/poll.service';
import type { PollOption } from '../../services/poll.service';
import { useTranslation } from 'react-i18next';

interface PollAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: number;
  pollTitle: string;
  options: PollOption[];
  judgeWeight?: number;
}

const OPTION_COLORS = [
  { solid: '#818cf8', from: '#6366f1', to: '#818cf8' },
  { solid: '#fbbf24', from: '#f59e0b', to: '#fbbf24' },
  { solid: '#34d399', from: '#10b981', to: '#34d399' },
  { solid: '#f472b6', from: '#ec4899', to: '#f472b6' },
  { solid: '#38bdf8', from: '#0ea5e9', to: '#38bdf8' },
  { solid: '#c084fc', from: '#a855f7', to: '#c084fc' },
  { solid: '#fb923c', from: '#f97316', to: '#fb923c' },
  { solid: '#2dd4bf', from: '#14b8a6', to: '#2dd4bf' },
  { solid: '#a3e635', from: '#84cc16', to: '#a3e635' },
  { solid: '#f87171', from: '#ef4444', to: '#f87171' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

/* ─── Custom tooltip for AreaChart ─────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl min-w-[160px]">
      <p className="text-slate-500 dark:text-white/50 text-[11px] font-bold mb-2 uppercase tracking-widest">
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-600 dark:text-white/70 text-xs flex-1 truncate max-w-[120px]">{entry.name}</span>
          <span className="text-slate-900 dark:text-white text-sm font-extrabold ml-1">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main component ────────────────────────────────────────────────────── */
export default function PollAnalyticsModal({
  isOpen, onClose, pollId, pollTitle, options, judgeWeight = 0
}: PollAnalyticsModalProps) {
  const { t } = useTranslation();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [animBars, setAnimBars] = useState(false);

  const hasWeighted = judgeWeight > 0;
  const audienceWeight = 100 - judgeWeight;
  const totalVotes = useMemo(() => options.reduce((s, o) => s + (o.voteCount ?? 0), 0), [options]);
  const totalJudgeVotes = useMemo(() => options.reduce((s, o) => s + (o.judgeCount ?? 0), 0), [options]);
  const totalAudienceVotes = useMemo(() => options.reduce((s, o) => s + (o.audienceCount ?? 0), 0), [options]);

  const getScore = useMemo(() => (opt: PollOption) => {
    if (!hasWeighted) return totalVotes > 0 ? (opt.voteCount / totalVotes) * 100 : 0;
    const j = totalJudgeVotes > 0 ? ((opt.judgeCount ?? 0) / totalJudgeVotes) * judgeWeight : 0;
    const a = totalAudienceVotes > 0 ? ((opt.audienceCount ?? 0) / totalAudienceVotes) * audienceWeight : 0;
    return j + a;
  }, [hasWeighted, judgeWeight, audienceWeight, totalVotes, totalJudgeVotes, totalAudienceVotes]);

  const sorted = useMemo(() => [...options].sort((a, b) => getScore(b) - getScore(a)), [options, getScore]);
  const leader = sorted[0];

  const peakPoint = useMemo(() => {
    if (!trendData.length) return null;
    let maxSum = 0, peakName: string | null = null;
    trendData.forEach(p => {
      const sum = Object.entries(p).filter(([k]) => k !== 'name').reduce((s, [, v]) => s + ((v as number) ?? 0), 0);
      if (sum > maxSum) { maxSum = sum; peakName = p.name; }
    });
    return peakName;
  }, [trendData]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    document.body.style.overflow = 'hidden';
    setAnimBars(false);
    setActiveTab(0);

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await pollService.getPollAnalytics(pollId);
        if (mounted) {
          // Khởi tạo biến đếm tích lũy cho từng lựa chọn
          const cumulativeOptions: Record<string, number> = {};
          options.forEach(o => cumulativeOptions[o.text] = 0);

          const transformed = raw.map((point: any) => {
            const cp: any = { name: point.time };
            
            // Cộng dồn số phiếu mới vào tổng tích lũy
            Object.keys(point.options || {}).forEach(optId => {
              const opt = options.find(o => o.id.toString() === optId);
              if (opt) {
                cumulativeOptions[opt.text] += point.options[optId];
              }
            });

            // Gán giá trị tích lũy vào data point
            options.forEach(o => {
              cp[o.text] = cumulativeOptions[o.text];
            });
            
            return cp;
          });
          
          setTrendData(transformed);
        }
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.message || t('pollAnalytics.loadError'));
      } finally {
        if (mounted) {
          setLoading(false);
          setTimeout(() => setAnimBars(true), 120);
        }
      }
    };
    load();
    return () => { mounted = false; document.body.style.overflow = 'auto'; };
  }, [isOpen, pollId, t, totalVotes]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await pollService.exportPollVotes(pollId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poll_${pollId}_votes.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      alert(t('pollAnalytics.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { label: t('pollAnalytics.tabOverview'), icon: BarChart2 },
    { label: t('pollAnalytics.tabTrend'),    icon: Activity  },
    { label: t('pollAnalytics.tabDetail'),   icon: Table2    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className="relative w-[95vw] sm:max-w-7xl max-h-[96vh] sm:max-h-[90vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden animate-modal-enter bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient glows (only visible in dark mode, subtle in light) */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-start justify-between px-5 sm:px-8 pt-5 pb-3 shrink-0 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex-1 min-w-0 mr-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
                {t('pollAnalytics.headerBadge')}
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">
              {pollTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/50 dark:hover:text-white transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-2xl border-2 border-slate-200 dark:border-violet-500/20 border-t-violet-500 animate-spin" />
                <div className="absolute inset-2 rounded-xl border-2 border-slate-200 dark:border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <p className="text-slate-500 dark:text-white/30 text-sm font-medium">{t('pollAnalytics.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── KPI STRIP ──────────────────────────────────────────────── */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 sm:px-8 pt-4 shrink-0">

              {/* Total votes */}
              <div className="rounded-2xl p-3 sm:p-4 flex flex-col gap-1 bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400/70">
                    {t('pollAnalytics.kpiTotal')}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 leading-none mt-1">{totalVotes.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-bold tracking-wide">
                    ↑ 100%
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-white/40">{t('pollAnalytics.kpiVotes')}</p>
                </div>
              </div>

              {/* Leader */}
              <div className="rounded-2xl p-3 sm:p-4 flex flex-col gap-1 bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400/70">
                    {t('pollAnalytics.kpiLeader')}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2 flex-1 mt-1">{leader?.text ?? '—'}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-bold mt-1">
                  {leader && totalVotes > 0
                    ? `${Math.round(getScore(leader))}% · ${leader.voteCount} ${t('pollAnalytics.votes')}`
                    : '—'}
                </p>
              </div>

              {/* Options count */}
              <div className="rounded-2xl p-3 sm:p-4 flex flex-col gap-1 bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400/70">
                    {t('pollAnalytics.kpiOptions')}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 leading-none mt-1">{options.length}</p>
                <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1">{t('pollAnalytics.kpiChoices')}</p>
              </div>

              {/* Peak time */}
              <div className="rounded-2xl p-3 sm:p-4 flex flex-col gap-1 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400/70">
                    {t('pollAnalytics.kpiPeak')}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight flex-1 line-clamp-2 mt-1">{peakPoint ?? '—'}</p>
                <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1">{t('pollAnalytics.kpiPeakLabel')}</p>
              </div>
            </div>

            {/* ── TAB BAR ────────────────────────────────────────────────── */}
            <div className="relative z-10 px-5 sm:px-8 pt-4 pb-3 shrink-0 flex items-center justify-between">
              <div className="flex gap-1 p-1 rounded-xl w-fit bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                {tabs.map((tab, i) => {
                  const Icon = tab.icon;
                  const active = activeTab === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                        active 
                          ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80 hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── TAB CONTENT ────────────────────────────────────────────── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-8 pb-4"
              style={{ scrollbarWidth: 'thin' }}>

              {/* ──────────── TAB 0: Overview ──────────── */}
              {activeTab === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left: Donut Chart */}
                  <div className="lg:col-span-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center shadow-sm">
                    <p className="text-sm font-bold text-slate-700 dark:text-white/70 self-start mb-2 uppercase tracking-wide">Kết quả bình chọn</p>
                    <div className="w-full aspect-square relative max-h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sorted}
                            dataKey="voteCount"
                            nameKey="text"
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="90%"
                            stroke="none"
                            paddingAngle={4}
                            cornerRadius={8}
                          >
                            {sorted.map((entry, index) => {
                               const c = OPTION_COLORS[options.findIndex(o => o.id === entry.id) % OPTION_COLORS.length];
                               return <Cell key={`cell-${index}`} fill={c.solid} />;
                            })}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none mb-1">{totalVotes}</span>
                        <span className="text-xs font-semibold text-slate-400 dark:text-white/40">Tổng phiếu</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress bars */}
                  <div className="lg:col-span-3 space-y-3">
                  {sorted.map((opt, rank) => {
                    const colorIdx = options.findIndex(o => o.id === opt.id) % OPTION_COLORS.length;
                    const c = OPTION_COLORS[colorIdx];
                    const pct = getScore(opt);
                    const isWinner = rank === 0 && opt.voteCount > 0;

                    return (
                      <div key={opt.id}
                        className={`rounded-2xl p-3 sm:p-4 transition-all border shadow-sm ${
                          isWinner 
                            ? 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' 
                            : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5'
                        }`}
                      >
                        {/* Row 1: rank + label + percentage */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-base sm:text-lg shrink-0 leading-none">
                              {rank < 3 ? MEDALS[rank] : <span className="text-slate-300 dark:text-white/20 text-xs font-black">#{rank + 1}</span>}
                            </span>
                            <span className="text-[13px] sm:text-base font-bold text-slate-900 dark:text-white truncate">{opt.text}</span>
                          </div>
                          <div className="flex items-baseline gap-2 shrink-0">
                            <span className="text-lg sm:text-xl font-extrabold leading-none" style={{ color: c.solid }}>
                              {Math.round(pct)}%
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-white/40 font-medium hidden sm:inline">
                              {opt.voteCount.toLocaleString()} {t('pollAnalytics.votes')}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 ring-1 ring-inset ring-slate-200/50 dark:ring-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{
                              width: animBars ? `${Math.max(pct > 0 ? pct : 0, 0)}%` : '0%',
                              background: `linear-gradient(90deg, ${c.from}, ${c.solid})`,
                              boxShadow: pct > 0 ? `0 0 12px ${c.solid}40` : 'none',
                              transitionDelay: `${rank * 80}ms`,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20 dark:bg-transparent" />
                          </div>
                        </div>

                        {/* Weighted breakdown */}
                        {hasWeighted && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }} />
                              <span className="text-slate-500 dark:text-white/50 font-medium">Giám khảo:</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">{opt.judgeCount ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }} />
                              <span className="text-slate-500 dark:text-white/50 font-medium">Khán giả:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{opt.audienceCount ?? 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* ──────────── TAB 1: Trend ──────────── */}
              {activeTab === 1 && (
                <div>
                  {trendData.length === 0 ? (
                    <div className="h-80 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-white/5">
                        <Activity className="w-8 h-8 text-slate-400 dark:text-white/30" />
                      </div>
                      <p className="text-slate-500 dark:text-white/40 text-sm font-medium">{t('pollAnalytics.noData')}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-white/40 font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" />
                        {t('pollAnalytics.trendLabel')}
                      </p>
                      <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6" style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                              {options.map((opt, idx) => {
                                const c = OPTION_COLORS[idx % OPTION_COLORS.length];
                                return (
                                  <linearGradient key={opt.id} id={`ag-${opt.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={c.solid} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={c.solid} stopOpacity={0} />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} vertical={false} />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.5 }}
                              dy={10}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.5 }}
                              dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              wrapperStyle={{
                                paddingTop: 24,
                                fontSize: 12,
                                opacity: 0.7,
                              }}
                            />
                            {options.map((opt, idx) => {
                              const c = OPTION_COLORS[idx % OPTION_COLORS.length];
                              return (
                                <Area
                                  key={opt.id}
                                  type="monotone"
                                  dataKey={opt.text}
                                  stroke={c.solid}
                                  strokeWidth={3}
                                  fill={`url(#ag-${opt.id})`}
                                  dot={{ r: 4, fill: c.solid, strokeWidth: 0 }}
                                  activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }}
                                  connectNulls
                                />
                              );
                            })}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ──────────── TAB 2: Detail table ──────────── */}
              {activeTab === 2 && (
                <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                          <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 w-12">#</th>
                          <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{t('pollAnalytics.colOption')}</th>
                          <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{t('pollAnalytics.colVotes')}</th>
                          <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{t('pollAnalytics.colPercent')}</th>
                          {hasWeighted && <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500/70">⚖️ GK</th>}
                          {hasWeighted && <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400/70">👥 KG</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((opt, rank) => {
                          const colorIdx = options.findIndex(o => o.id === opt.id) % OPTION_COLORS.length;
                          const c = OPTION_COLORS[colorIdx];
                          const pct = getScore(opt);
                          const isWinner = rank === 0 && opt.voteCount > 0;
                          return (
                            <tr key={opt.id}
                              className={`border-b border-slate-200 dark:border-white/5 ${isWinner ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''}`}
                            >
                              <td className="px-5 py-4 text-center text-lg">
                                {rank < 3 ? MEDALS[rank] : <span className="text-slate-400 dark:text-white/30 text-sm font-black">#{rank + 1}</span>}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{opt.text}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="text-sm font-black text-slate-900 dark:text-white">{opt.voteCount.toLocaleString()}</span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="text-sm font-black" style={{ color: c.solid }}>{Math.round(pct)}%</span>
                              </td>
                              {hasWeighted && (
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{opt.judgeCount ?? 0}</span>
                                </td>
                              )}
                              {hasWeighted && (
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{opt.audienceCount ?? 0}</span>
                                </td>
                              )}
                            </tr>
                          );
                        })}

                        {/* Total row */}
                        <tr className="bg-slate-100/50 dark:bg-white/[0.02]">
                          <td className="px-5 py-4" />
                          <td className="px-5 py-4">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/50">{t('pollAnalytics.total')}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-base font-black text-slate-900 dark:text-white">{totalVotes.toLocaleString()}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-base font-black text-slate-900 dark:text-white">100%</span>
                          </td>
                          {hasWeighted && (
                            <td className="px-5 py-4 text-right">
                              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                                {options.reduce((s, o) => s + (o.judgeCount ?? 0), 0)}
                              </span>
                            </td>
                          )}
                          {hasWeighted && (
                            <td className="px-5 py-4 text-right">
                              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                {options.reduce((s, o) => s + (o.audienceCount ?? 0), 0)}
                              </span>
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <div className="relative z-10 shrink-0 px-5 sm:px-8 py-5 flex items-center justify-between gap-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-transparent">
              <div className="hidden sm:flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cập nhật theo thời gian thực</p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 ml-auto shadow-lg hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
              >
                <Download className="w-5 h-5" />
                {isExporting ? t('pollAnalytics.exporting') : t('pollAnalytics.exportBtn')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

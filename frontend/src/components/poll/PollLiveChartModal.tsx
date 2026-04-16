import React, { useMemo, useState, useEffect } from 'react';
import { X, Activity, BarChart3, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface PollLiveChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: { id: number; text: string; voteCount: number }[];
  pollTitle: string;
}

const PREMIUM_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6', '#fb7185', '#2dd4bf'];

const CustomTooltip = ({ active, payload }: any) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const tooltipData = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-[#0f1117]/95 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: tooltipData.color }} />
          <span className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-wider">{t('liveChart.option')}</span>
        </div>
        <p className="text-base font-semibold text-slate-800 dark:text-white mb-3 max-w-[250px] leading-snug">
          {tooltipData.fullText}
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-indigo-600 dark:text-white leading-none">
            {tooltipData.votes}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-white/50 mb-1">
            {t('liveChart.votes')} ({tooltipData.percentage})
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function PollLiveChartModal({ isOpen, onClose, options, pollTitle }: PollLiveChartModalProps) {
  const [enableChartAnim, setEnableChartAnim] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setEnableChartAnim(true), 100);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnableChartAnim(false);
    }
  }, [isOpen]);

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

  const data = useMemo(() => options.map((opt, index) => {
    const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
    return {
      name: opt.text.length > 20 ? opt.text.substring(0, 20) + '...' : opt.text,
      fullText: opt.text,
      votes: opt.voteCount,
      percentage: `${pct}%`,
      visualVotes: Math.max(opt.voteCount, 0.05),
      color: PREMIUM_COLORS[index % PREMIUM_COLORS.length]
    };
  }), [options, totalVotes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Light & Dark aware backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-lg transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl dark:shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-modal-enter flex flex-col max-h-[95vh] transition-colors">
        
        {/* Dynamic Background Glows - subtle in light mode, vibrant in dark mode */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-400/10 dark:bg-sky-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-400/10 dark:bg-fuchsia-500/20 blur-[100px] rounded-full pointer-events-none translate-y-1/2" />

        {/* Content Area */}
        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  <span className="text-xs font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase">{t('liveChart.liveResults')}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-sky-400 bg-indigo-50 dark:bg-sky-500/10 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-sky-500/20 text-xs font-semibold">
                  <Activity className="w-4 h-4" />
                  {t('liveChart.realTime')}
                </div>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 mt-4 leading-tight line-clamp-3">
                {pollTitle}
              </h2>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10 shrink-0"
              title={t('liveChart.close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-center overflow-hidden transition-colors">
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 mb-1 text-sm font-semibold">
                <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                {t('liveChart.totalVotes')}
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{totalVotes}</div>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-center overflow-hidden transition-colors">
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 mb-1 text-sm font-semibold">
                <BarChart3 className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
                {t('liveChart.totalOptions')}
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{options.length}</div>
            </div>
          </div>

          {/* Chart Container - using absolute positioning technique to guarantee it renders */}
          <div className="relative w-full h-[400px] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-inner overflow-hidden transition-colors">
            {/* Grid pattern background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px', color: 'gray' }} />
            
            <div className="absolute inset-4 sm:inset-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 0, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                  
                  <YAxis 
                    allowDecimals={false} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 600, opacity: 0.5 }}
                    domain={[0, totalVotes === 0 ? 5 : 'auto']}
                  />
                  
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 600, dy: 15, opacity: 0.7 }}
                    interval={0}
                  />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.1)' }} />
                  
                  <Bar 
                    dataKey="visualVotes" 
                    radius={[8, 8, 8, 8]}
                    isAnimationActive={enableChartAnim}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    barSize={48}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="transition-all duration-300"
                        style={{ filter: `drop-shadow(0 4px 10px ${entry.color}80)` }} 
                      />
                    ))}
                    <LabelList 
                      dataKey="percentage" 
                      position="top" 
                      fill="currentColor" 
                      fontSize={13} 
                      fontWeight={700}
                      opacity={0.8}
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

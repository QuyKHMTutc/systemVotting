import { useState, useEffect } from 'react';
import { X, Download, TrendingUp, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { pollService } from '../../services/poll.service';
import type { PollOption } from '../../services/poll.service';

interface PollAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollId: number;
  pollTitle: string;
  options: PollOption[];
}

const PREMIUM_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6', '#fb7185', '#2dd4bf', '#fbbf24', '#34d399', '#f87171'];

export default function PollAnalyticsModal({ isOpen, onClose, pollId, pollTitle, options }: PollAnalyticsModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    document.body.style.overflow = 'hidden';

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawData = await pollService.getPollAnalytics(pollId);
        
        // Transform data for Recharts: { time: '...', option_id: count } -> { name: '...', 'Option 1': count }
        if (isMounted) {
          const transformed = rawData.map(point => {
            const chartPoint: any = { name: point.time };
            Object.keys(point.options).forEach(optId => {
              const opt = options.find(o => o.id.toString() === optId);
              if (opt) {
                chartPoint[opt.text] = point.options[optId];
              }
            });
            return chartPoint;
          });
          setData(transformed);
        }
      } catch (err: any) {
        if (isMounted) setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu phân tích');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, pollId, options]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await pollService.exportPollVotes(pollId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poll_${pollId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export failed', error);
      alert('Không thể xuất dữ liệu lúc này.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-lg transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-modal-enter flex flex-col max-h-[95vh]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />

        <div className="relative z-10 flex flex-col h-full p-6 sm:p-8 overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-8 gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full w-max text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                <TrendingUp className="w-4 h-4" />
                Thống kê / Phân tích
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-tight line-clamp-2">
                {pollTitle}
              </h2>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 dark:text-white/60 transition-all shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="relative w-full h-[400px] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-4 sm:p-6 shadow-inner overflow-hidden mb-6">
                {data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Chưa có dữ liệu thống kê theo thời gian.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.6 }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.6 }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      
                      {options.map((opt, idx) => (
                        <Line
                          key={opt.id}
                          type="monotone"
                          dataKey={opt.text}
                          stroke={PREMIUM_COLORS[idx % PREMIUM_COLORS.length]}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  {isExporting ? 'Đang xuất...' : 'Xuất dữ liệu (.csv)'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

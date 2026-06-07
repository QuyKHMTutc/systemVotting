import React from 'react';
import type { Timeframe } from '../types';

interface AdminDatePickerModalProps {
  showDatePicker: boolean;
  setShowDatePicker: (b: boolean) => void;
  customRange: { start: string; end: string };
  setCustomRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  setTimeframe: (t: Timeframe) => void;
}

const AdminDatePickerModal: React.FC<AdminDatePickerModalProps> = ({
  showDatePicker, setShowDatePicker, customRange, setCustomRange, setTimeframe
}) => {
  if (!showDatePicker) return null;

  return (
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
  );
};

export default AdminDatePickerModal;

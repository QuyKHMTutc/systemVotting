import React from 'react';
import { Trash2 } from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { Poll } from '../../../services/poll.service';

interface PollsTabProps {
  polls: Poll[];
  pagePolls: number;
  setPagePolls: (p: number) => void;
  totalPagesPolls: number;
  handleDeletePoll: (p: Poll) => void;
}

const PollsTab: React.FC<PollsTabProps> = ({
  polls, pagePolls, setPagePolls, totalPagesPolls, handleDeletePoll
}) => {
  return (
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
              const totalVotes = p.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0);
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
      <Pagination page={pagePolls} totalPages={totalPagesPolls} onPageChange={(p) => setPagePolls(p)} />
    </div>
  );
};

export default PollsTab;

import React, { useState } from 'react';
import { Trash2, XCircle } from 'lucide-react';
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
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  return (
    <>
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
                    <button 
                      onClick={() => setSelectedPoll(p)}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 hover:underline block"
                    >
                      View Details
                    </button>
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

      {/* Details Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPoll(null)}
          />
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Poll Details</h3>
              <button 
                onClick={() => setSelectedPoll(null)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-4">
                <div>
                  <h4 className="text-xs text-white/40 font-semibold uppercase mb-1">Title</h4>
                  <p className="text-sm text-white/90 font-medium leading-relaxed">{selectedPoll.title}</p>
                </div>
                {selectedPoll.description && (
                  <div>
                    <h4 className="text-xs text-white/40 font-semibold uppercase mb-1">Description</h4>
                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{selectedPoll.description}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs text-white/40 font-semibold uppercase mb-1">Options ({selectedPoll.options.length})</h4>
                  <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                    {selectedPoll.options.map((opt: any) => (
                      <li key={opt.id}>{opt.text} <span className="text-white/40 text-xs ml-1">({opt.voteCount || 0} votes)</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs text-white/40 font-semibold uppercase mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPoll.tags?.map((t: any) => (
                      <span key={t.id} className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">{t.name}</span>
                    ))}
                    {(!selectedPoll.tags || selectedPoll.tags.length === 0) && <span className="text-white/40 text-xs italic">No tags</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PollsTab;

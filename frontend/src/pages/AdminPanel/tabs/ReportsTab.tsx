import { useEffect, useState } from 'react';
import { ReportStatus } from '../../../services/report.service';
import type { ReportResponse } from '../../../services/report.service';
import { Flag, CheckCircle, XCircle } from 'lucide-react';

import { Link } from 'react-router-dom';

interface ReportsTabProps {
  reports: ReportResponse[];
  pageReports: number;
  setPageReports: (page: number) => void;
  totalPagesReports: number;
  fetchReports: (page?: number, status?: ReportStatus) => void;
  handleUpdateStatus: (id: number, status: ReportStatus) => void;
}

export default function ReportsTab({
  reports,
  pageReports,
  setPageReports,
  totalPagesReports,
  fetchReports,
  handleUpdateStatus
}: ReportsTabProps) {
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);

  useEffect(() => {
    fetchReports(0, filterStatus as ReportStatus || undefined);
  }, [filterStatus, fetchReports]);

  const goToPage = (nextPage: number) => {
    setPageReports(nextPage);
    fetchReports(nextPage, filterStatus as ReportStatus || undefined);
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'SPAM': return 'Spam / Advertising';
      case 'HARASSMENT': return 'Harassment';
      case 'HATE_SPEECH': return 'Hate Speech';
      case 'FALSE_INFORMATION': return 'False Information';
      case 'INAPPROPRIATE_CONTENT': return 'Inappropriate Content';
      case 'OTHER': return 'Other';
      default: return reason;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-400" />
          Violation Reports
        </h2>
        
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          >
            <option className="bg-slate-800 text-white" value="">All Statuses</option>
            <option className="bg-slate-800 text-white" value="PENDING">Pending</option>
            <option className="bg-slate-800 text-white" value="RESOLVED">Resolved</option>
            <option className="bg-slate-800 text-white" value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-white/50 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">#{r.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{r.reporterName}</div>
                    <div className="text-xs text-white/40">{r.reporterEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-medium">
                        {r.targetType}
                      </span>
                      {r.targetType === 'POLL' ? (
                        <Link to={`/poll/${r.targetId}`} target="_blank" className="text-blue-400 hover:underline text-xs">
                          #ID: {r.targetId}
                        </Link>
                      ) : (
                        <span className="text-white/60 text-xs">#ID: {r.targetId}</span>
                      )}
                    </div>
                    {r.targetSnippet && (
                      <div className="mt-1.5">
                        <div className="text-xs text-white/80 p-2 bg-white/5 rounded-lg border border-white/5 line-clamp-2" title="Click View Details for more">
                          <span className="italic whitespace-pre-wrap">"{r.targetSnippet}"</span>
                        </div>
                        <button 
                          onClick={() => setSelectedSnippet(r.targetSnippet!)}
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-red-400">
                    {getReasonLabel(r.reasonType)}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={r.description}>
                    {r.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'PENDING' && <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">PENDING</span>}
                    {r.status === 'RESOLVED' && <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">RESOLVED</span>}
                    {r.status === 'REJECTED' && <span className="px-2.5 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium border border-slate-500/30">REJECTED</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r.id, ReportStatus.RESOLVED)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Mark as Resolved"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, ReportStatus.REJECTED)}
                            className="p-1.5 text-slate-400 hover:bg-slate-400/10 rounded-lg transition-colors"
                            title="Reject Report"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/40">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPagesReports > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-white/50">
            Page <span className="font-semibold text-white">{pageReports + 1}</span> / <span className="font-semibold text-white">{totalPagesReports}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(Math.max(0, pageReports - 1))}
              disabled={pageReports === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(Math.min(totalPagesReports - 1, pageReports + 1))}
              disabled={pageReports >= totalPagesReports - 1}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedSnippet && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSnippet(null)}
          />
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Content Details</h3>
              <button 
                onClick={() => setSelectedSnippet(null)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

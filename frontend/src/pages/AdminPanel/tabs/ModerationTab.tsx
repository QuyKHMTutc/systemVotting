import React from 'react';
import { Clock, AlertTriangle, Shield, CheckCircle2, Eye, ThumbsUp, Ban } from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { PendingPoll, FlaggedComment, ModerationCount } from '../../../services/moderation.service';

interface ModerationTabProps {
  moderationCount: ModerationCount;
  moderationSubTab: 'POLLS' | 'COMMENTS';
  setModerationSubTab: (tab: 'POLLS' | 'COMMENTS') => void;
  pendingPolls: PendingPoll[];
  expandedPollId: number | null;
  setExpandedPollId: (id: number | null) => void;
  onApprovePoll: (id: number) => void;
  onRejectPoll: (poll: PendingPoll) => void;
  flaggedComments: FlaggedComment[];
  onApproveComment: (id: number) => void;
  onBlockComment: (id: number) => void;
  pagePendingPolls: number;
  setPagePendingPolls: (p: number) => void;
  totalPagesPendingPolls: number;
  pageFlaggedComments: number;
  setPageFlaggedComments: (p: number) => void;
  totalPagesFlaggedComments: number;
}

const ModerationTab: React.FC<ModerationTabProps> = ({
  moderationCount, moderationSubTab, setModerationSubTab,
  pendingPolls, expandedPollId, setExpandedPollId, onApprovePoll, onRejectPoll,
  flaggedComments, onApproveComment, onBlockComment,
  pagePendingPolls, setPagePendingPolls, totalPagesPendingPolls,
  pageFlaggedComments, setPageFlaggedComments, totalPagesFlaggedComments
}) => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in-up">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Polls', value: moderationCount.pendingPolls, icon: <Clock size={20}/>, color: '#f59e0b', desc: 'SUSPICIOUS polls' },
          { label: 'Flagged Comments', value: moderationCount.flaggedComments, icon: <AlertTriangle size={20}/>, color: '#ef4444', desc: 'SUSPICIOUS comments' },
          { label: 'Total Pending', value: moderationCount.total, icon: <Shield size={20}/>, color: '#8b5cf6', desc: 'Total items waiting' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 border border-white/10 flex items-center gap-4 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5"
              style={{ background: `${s.color}22`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-white font-heading">{s.value}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.desc}</p>
            </div>
            {s.value > 0 && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-ping" style={{ background: s.color, opacity: 0.7 }} />}
          </div>
        ))}
      </div>

      {/* Sub-tab switcher */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
        {(['POLLS', 'COMMENTS'] as const).map(st => (
          <button key={st} onClick={() => setModerationSubTab(st)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              moderationSubTab === st ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/70'
            }`}>
            {st === 'POLLS' ? <><Clock size={14}/> Polls ({moderationCount.pendingPolls})</> : <><AlertTriangle size={14}/> Comments ({moderationCount.flaggedComments})</>}
          </button>
        ))}
      </div>

      {/* PENDING POLLS */}
      {moderationSubTab === 'POLLS' && (
        <div className="space-y-4">
          {pendingPolls.length === 0 ? (
            <div className="rounded-2xl border border-white/10 py-16 flex flex-col items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <CheckCircle2 size={40} className="text-emerald-400/50" />
              <p className="text-white/40 font-medium">No pending polls 🎉</p>
            </div>
          ) : pendingPolls.map(poll => (
            <div key={poll.id} className="rounded-2xl border border-amber-500/20 overflow-hidden transition-all hover:border-amber-400/40"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
              {/* Poll header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10 border border-amber-500/20">
                      <Clock size={18} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base truncate">{poll.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white/40 text-xs">by <span className="text-white/60 font-medium">{poll.creator.username}</span></span>
                        <span className="text-white/20">•</span>
                        <span className="text-white/40 text-xs">{new Date(poll.createdAt).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">{poll.visibility}</span>
                      </div>
                      {/* AI Reason */}
                      <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-300/80 text-xs leading-relaxed">{poll.moderationReason || 'Suspicious content'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpandedPollId(expandedPollId === poll.id ? null : poll.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all" title="View details">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onApprovePoll(poll.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 hover:border-emerald-400/40 transition-all">
                      <ThumbsUp size={14}/> Approve
                    </button>
                    <button onClick={() => onRejectPoll(poll)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400/20 hover:border-rose-400/40 transition-all">
                      <Ban size={14}/> Reject
                    </button>
                  </div>
                </div>

                {/* Expanded options preview */}
                {expandedPollId === poll.id && (
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-2">
                    <p className="text-white/40 text-xs font-semibold mb-3">POLL OPTIONS</p>
                    {poll.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03]">
                        <span className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <span className="text-white/70 text-sm">{opt.text}</span>
                      </div>
                    ))}
                    {poll.description && (
                      <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border-l-2 border-violet-500/40">
                        <p className="text-white/40 text-[10px] font-semibold mb-1">DESCRIPTION</p>
                        <p className="text-white/60 text-sm">{poll.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination page={pagePendingPolls} totalPages={totalPagesPendingPolls} onPageChange={p => setPagePendingPolls(p)} />
        </div>
      )}

      {/* FLAGGED COMMENTS */}
      {moderationSubTab === 'COMMENTS' && (
        <div className="space-y-3">
          {flaggedComments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 py-16 flex flex-col items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <CheckCircle2 size={40} className="text-emerald-400/50" />
              <p className="text-white/40 font-medium">No flagged comments 🎉</p>
            </div>
          ) : flaggedComments.map(comment => (
            <div key={comment.id} className="rounded-xl border border-rose-500/20 p-4 flex items-start gap-4 hover:border-rose-400/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white border border-white/10"
                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                {comment.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{comment.username}</span>
                  <span className="text-white/20">→</span>
                  <span className="text-violet-400 text-xs truncate max-w-[200px]">{comment.pollTitle}</span>
                  <span className="text-white/30 text-xs ml-auto flex-shrink-0">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-white/70 text-sm bg-white/[0.03] rounded-lg p-2.5 border border-white/5 mb-2">{comment.content}</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300/70 text-xs">{comment.moderationReason || 'Suspicious content'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => onApproveComment(comment.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-all whitespace-nowrap">
                  <ThumbsUp size={12}/> Safe
                </button>
                <button onClick={() => onBlockComment(comment.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 hover:bg-rose-400/20 transition-all whitespace-nowrap">
                  <Ban size={12}/> Block
                </button>
              </div>
            </div>
          ))}
          <Pagination page={pageFlaggedComments} totalPages={totalPagesFlaggedComments} onPageChange={p => setPageFlaggedComments(p)} />
        </div>
      )}
    </div>
  );
};

export default ModerationTab;

import React from 'react';

interface AdminConfirmModalProps {
  confirmModal: { title: string; msg: string; onConfirm: () => void } | null;
  setConfirmModal: (modal: { title: string; msg: string; onConfirm: () => void } | null) => void;
}

const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({ confirmModal, setConfirmModal }) => {
  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl animate-modal-enter" style={{ background: '#0f0c23' }}>
        <h3 className="text-white font-bold text-lg font-heading mb-2">{confirmModal.title}</h3>
        <p className="text-white/50 text-sm mb-6">{confirmModal.msg}</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={confirmModal.onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmModal;

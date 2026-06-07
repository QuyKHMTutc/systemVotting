import React from 'react';
import { X } from 'lucide-react';

interface AdminToastProps {
  toast: { msg: string; type: 'success' | 'error' } | null;
  setToast: (toast: { msg: string; type: 'success' | 'error' } | null) => void;
}

const AdminToast: React.FC<AdminToastProps> = ({ toast, setToast }) => {
  if (!toast) return null;

  return (
    <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white text-sm font-bold z-[100] animate-fade-in-up border ${
      toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-pink-500/20 border-pink-500/30'
    }`} style={{ backdropFilter: 'blur(20px)' }}>
      {toast.msg}
      <button onClick={() => setToast(null)}><X size={16} className="opacity-60 hover:opacity-100" /></button>
    </div>
  );
};

export default AdminToast;

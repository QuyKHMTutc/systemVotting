import React from 'react';
import { X, Smile, Activity, Save } from 'lucide-react';
import type { Category } from '../../../services/category.service';

interface AdminCategoryModalProps {
  categoryModal: { isOpen: boolean; isEdit: boolean; data: Partial<Category> };
  setCategoryModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; isEdit: boolean; data: Partial<Category> }>>;
  handleSaveCategory: () => void;
}

const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  categoryModal, setCategoryModal, handleSaveCategory
}) => {
  if (!categoryModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-modal-enter" style={{ background: '#0f0c23' }}>
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg font-heading">{categoryModal.isEdit ? 'Edit Category' : 'Create Category'}</h3>
          <button onClick={() => setCategoryModal({ isOpen: false, isEdit: false, data: {} })} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5">Name <span className="text-pink-400">*</span></label>
            <input type="text" value={categoryModal.data.name || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
              placeholder="e.g. Technology" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
          </div>
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5">Slug (Auto-generated)</label>
            <input type="text" value={categoryModal.data.slug || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, slug: e.target.value } }))}
              placeholder="e.g. technology" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-white/60 text-xs font-semibold mb-1.5 flex items-center gap-1">Icon <Smile size={14} /></label>
              <input type="text" value={categoryModal.data.icon || ''} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: e.target.value } }))}
                placeholder="e.g. 💻" className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none text-xl" />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold mb-1.5 flex items-center gap-1">Sort Order <Activity size={14} /></label>
              <input type="number" value={categoryModal.data.sortOrder ?? 0} onChange={e => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, sortOrder: parseInt(e.target.value) || 0 } }))}
                className="w-full px-4 py-3 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500/50 bg-white/5 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-2">Quick Icons</label>
            <div className="flex flex-wrap gap-2">
              {['💻', '🎮', '⚽', '📚', '🎬', '💼', '🍔', '🎨', '🔥', '📊'].map(emoji => (
                <button key={emoji} onClick={() => setCategoryModal(prev => ({ ...prev, data: { ...prev.data, icon: emoji } }))}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xl flex items-center justify-center transition-all hover:scale-110">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 border-t border-white/5 flex gap-3">
          <button onClick={() => setCategoryModal({ isOpen: false, isEdit: false, data: {} })} className="flex-1 py-3 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={handleSaveCategory} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Save size={18} /> Save Category
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryModal;

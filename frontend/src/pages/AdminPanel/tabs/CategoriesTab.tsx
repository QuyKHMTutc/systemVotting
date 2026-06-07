import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import type { Category } from '../../../services/category.service';

interface CategoriesTabProps {
  categories: Category[];
  setCategoryModal: (modal: { isOpen: boolean; isEdit: boolean; data: Partial<Category> }) => void;
  handleDeleteCategory: (cat: Category) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories, setCategoryModal, handleDeleteCategory
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-xl font-heading">Category Library</h3>
        <button onClick={() => setCategoryModal({ isOpen: true, isEdit: false, data: { sortOrder: categories.length } })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Plus size={18} /> New Category
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="group rounded-2xl p-5 border border-white/10 hover:border-violet-500/50 transition-all cursor-default relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(ellipse at top left,rgba(139,92,246,0.1),transparent 70%)' }} />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-3 shadow-inner">
                {cat.icon ?? '📋'}
              </div>
              <p className="text-white font-bold text-base truncate w-full">{cat.name}</p>
              <p className="text-white/40 text-xs font-mono mt-1 w-full truncate">/{cat.slug}</p>
              {cat.sortOrder != null && (
                <span className="inline-block mt-3 text-[10px] font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-md">
                  Order: #{cat.sortOrder}
                </span>
              )}
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={() => setCategoryModal({ isOpen: true, isEdit: true, data: { ...cat } })}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md" title="Edit">
                <Edit3 size={14} />
              </button>
              <button onClick={() => handleDeleteCategory(cat)}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors backdrop-blur-md" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesTab;

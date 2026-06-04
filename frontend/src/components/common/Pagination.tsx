export const Pagination = ({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-6 py-4 border-t border-white/5">
      <span className="text-sm text-white/50">Page {page + 1} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white">
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => {
            if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
              return (
                <button key={i} onClick={() => onPageChange(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${page === i ? 'bg-violet-600 text-white' : 'hover:bg-white/10 text-white/70'}`}>
                  {i + 1}
                </button>
              );
            }
            if (i === page - 2 || i === page + 2) return <span key={i} className="text-white/30">...</span>;
            return null;
          })}
        </div>
        <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-white">
          Next
        </button>
      </div>
    </div>
  );
};

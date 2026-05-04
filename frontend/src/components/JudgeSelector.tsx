import { useState, useRef, useCallback } from 'react';
import { judgeService } from '../services/judge.service';
import type { JudgeCandidate } from '../services/judge.service';

interface JudgeSelectorProps {
    judges: JudgeCandidate[];
    onChange: (judges: JudgeCandidate[]) => void;
    maxJudges: number;
    judgeWeight: number;
}

const JudgeSelector = ({ judges, onChange, maxJudges, judgeWeight }: JudgeSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<JudgeCandidate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [importPreview, setImportPreview] = useState<JudgeCandidate[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addedIds = new Set(judges.filter(j => j.id).map(j => j.id));

    const handleSearch = useCallback((q: string) => {
        setSearchQuery(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (q.length < 2) { setSearchResults([]); return; }
        searchTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await judgeService.searchUsers(q);
                setSearchResults(results.filter(r => !addedIds.has(r.id)));
            } catch { setSearchResults([]); }
            finally { setIsSearching(false); }
        }, 350);
    }, [addedIds]);

    const addJudge = (judge: JudgeCandidate) => {
        if (judges.length >= maxJudges) return;
        if (addedIds.has(judge.id)) return;
        onChange([...judges, judge]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeJudge = (id: number | null) => {
        onChange(judges.filter(j => j.id !== id));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportError('');
        setIsParsing(true);
        try {
            const text = await file.text();
            const results = await judgeService.parseCsv(text);
            setImportPreview(results);
            setShowImportModal(true);
        } catch {
            setImportError('Không thể đọc file. Vui lòng kiểm tra định dạng.');
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmImport = () => {
        const found = importPreview.filter(c => c.found && !addedIds.has(c.id));
        const canAdd = Math.min(found.length, maxJudges - judges.length);
        onChange([...judges, ...found.slice(0, canAdd)]);
        setShowImportModal(false);
        setImportPreview([]);
    };

    const foundCount = importPreview.filter(c => c.found).length;
    const notFoundCount = importPreview.filter(c => !c.found).length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                        Hội đồng giám khảo chiếm <span className="font-bold text-amber-500">{judgeWeight}%</span> tổng điểm.
                        Tối đa <span className="font-bold text-indigo-400">{maxJudges}</span> người.
                    </p>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-indigo-200">
                    {judges.length}/{maxJudges}
                </span>
            </div>

            {/* Added judges chips */}
            {judges.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    {judges.map(j => (
                        <span key={j.id} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-sm">
                            {j.avatarUrl
                                ? <img src={j.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                                : <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{j.username?.[0]?.toUpperCase()}</span>
                            }
                            <span className="font-medium">{j.username}</span>
                            <button type="button" onClick={() => removeJudge(j.id)}
                                className="text-amber-600/60 hover:text-red-500 transition-colors ml-0.5">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search + Import row */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        {isSearching
                            ? <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            : <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        }
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder={judges.length >= maxJudges ? 'Đã đủ số lượng giám khảo' : 'Tìm theo username hoặc email...'}
                        disabled={judges.length >= maxJudges}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50 text-sm"
                    />
                    {/* Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                            {searchResults.map(r => (
                                <button key={r.id} type="button" onClick={() => addJudge(r)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-left">
                                    {r.avatarUrl
                                        ? <img src={r.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">{r.username?.[0]?.toUpperCase()}</span>
                                    }
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{r.username}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.email}</p>
                                    </div>
                                    <svg className="ml-auto w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Import button */}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing || judges.length >= maxJudges}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-indigo-300 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    {isParsing
                        ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    }
                    Import CSV
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </div>

            {importError && <p className="text-xs text-red-500">{importError}</p>}

            {/* CSV hint */}
            <p className="text-xs text-slate-400 dark:text-white/30">
                💡 File CSV: mỗi dòng một username hoặc email. Hỗ trợ cả hai cùng lúc.
            </p>

            {/* Import Preview Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Xem trước danh sách import</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Tìm thấy <span className="text-green-500 font-semibold">{foundCount}</span> người,
                                không tìm thấy <span className="text-red-500 font-semibold">{notFoundCount}</span> người.
                            </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                            {importPreview.map((c, i) => (
                                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${!c.found ? 'opacity-50' : ''}`}>
                                    {c.found
                                        ? <>
                                            {c.avatarUrl
                                                ? <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">{c.username?.[0]?.toUpperCase()}</span>
                                            }
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.username}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                        </>
                                        : <>
                                            <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-lg">?</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate italic">"{c.matchedValue}"</p>
                                                <p className="text-xs text-red-400">Không tìm thấy người dùng</p>
                                            </div>
                                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                        </>
                                    }
                                </div>
                            ))}
                        </div>
                        <div className="p-5 flex gap-3 border-t border-slate-200 dark:border-white/10">
                            <button type="button" onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm">
                                Huỷ
                            </button>
                            <button type="button" onClick={confirmImport} disabled={foundCount === 0}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-amber-500/20">
                                Thêm {Math.min(foundCount, maxJudges - judges.length)} giám khảo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JudgeSelector;

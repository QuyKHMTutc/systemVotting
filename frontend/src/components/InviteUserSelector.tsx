import { useState, useRef, useCallback } from 'react';
import { judgeService } from '../services/judge.service';
import type { JudgeCandidate } from '../services/judge.service';

interface InviteUserSelectorProps {
    invitedUsers: JudgeCandidate[];
    onChange: (users: JudgeCandidate[]) => void;
}

const InviteUserSelector = ({ invitedUsers, onChange }: InviteUserSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<JudgeCandidate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [importPreview, setImportPreview] = useState<JudgeCandidate[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addedIds = new Set(invitedUsers.filter(u => u.id).map(u => u.id));
    const addedEmails = new Set(invitedUsers.map(u => u.email?.toLowerCase()));

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

    const addUser = (user: JudgeCandidate) => {
        if (addedIds.has(user.id)) return;
        onChange([...invitedUsers, user]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeUser = (id: number | null, email: string | null) => {
        if (id) {
            onChange(invitedUsers.filter(u => u.id !== id));
        } else {
            onChange(invitedUsers.filter(u => u.email !== email));
        }
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
        // For found users, filter by id; for not-found, keep by email only (outside system)
        const toAdd: JudgeCandidate[] = [];
        for (const c of importPreview) {
            if (c.found) {
                if (!addedIds.has(c.id)) toAdd.push(c);
            } else {
                // Still allow inviting by email even if not in system
                const emailLower = c.matchedValue?.toLowerCase();
                if (emailLower && emailLower.includes('@') && !addedEmails.has(emailLower)) {
                    toAdd.push({
                        id: null,
                        username: null,
                        email: emailLower,
                        avatarUrl: null,
                        matchedValue: emailLower,
                        found: false
                    });
                }
            }
        }
        onChange([...invitedUsers, ...toAdd]);
        setShowImportModal(false);
        setImportPreview([]);
    };

    const foundCount = importPreview.filter(c => c.found).length;
    const notFoundCount = importPreview.filter(c => !c.found).length;

    return (
        <div className="space-y-4">
            {/* Added user chips */}
            {invitedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                    {invitedUsers.map((u, i) => (
                        <span
                            key={u.id ?? u.email ?? i}
                            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-sm"
                        >
                            {u.avatarUrl
                                ? <img src={u.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                                : u.username
                                    ? <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">{u.username[0].toUpperCase()}</span>
                                    : <span className="w-5 h-5 rounded-full bg-violet-400/50 flex items-center justify-center text-white text-xs">@</span>
                            }
                            <span className="font-medium">{u.username ?? u.email}</span>
                            {!u.username && u.email && (
                                <span className="text-[10px] text-violet-400/70 ml-0.5">email only</span>
                            )}
                            <button
                                type="button"
                                onClick={() => removeUser(u.id, u.email)}
                                className="text-violet-500/60 hover:text-red-500 transition-colors ml-0.5"
                            >
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
                            ? <svg className="animate-spin w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            : <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        }
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Tìm theo username hoặc email..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-violet-300 dark:border-violet-500/30 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm"
                    />
                    {/* Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                            {searchResults.map(r => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => addUser(r)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors text-left"
                                >
                                    {r.avatarUrl
                                        ? <img src={r.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{r.username?.[0]?.toUpperCase()}</span>
                                    }
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{r.username}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.email}</p>
                                    </div>
                                    <svg className="ml-auto w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Import CSV button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-violet-300 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isParsing
                        ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    }
                    Import CSV
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </div>

            {importError && <p className="text-xs text-red-500">{importError}</p>}

            {/* Hint */}
            <p className="text-xs text-slate-400 dark:text-white/30">
                💡 Gõ tên hoặc email để tìm người dùng. File CSV: mỗi dòng một username hoặc email.
            </p>

            {/* Import Preview Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Xem trước danh sách import</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Tìm thấy trong hệ thống: <span className="text-green-500 font-semibold">{foundCount}</span>,
                                chỉ email (ngoài hệ thống): <span className="text-amber-500 font-semibold">{notFoundCount}</span>.
                            </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                            {importPreview.map((c, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-3">
                                    {c.found ? (
                                        <>
                                            {c.avatarUrl
                                                ? <img src={c.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                : <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{c.username?.[0]?.toUpperCase()}</span>
                                            }
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.username}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 text-sm font-bold">@</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{c.matchedValue}</p>
                                                <p className="text-xs text-amber-500">Không có trong hệ thống — sẽ mời qua email</p>
                                            </div>
                                            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-5 flex gap-3 border-t border-slate-200 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-sm"
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                onClick={confirmImport}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:from-violet-400 hover:to-purple-500 transition-all text-sm shadow-lg shadow-violet-500/20"
                            >
                                Thêm {importPreview.length} người
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InviteUserSelector;

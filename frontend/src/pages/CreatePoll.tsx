import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import { categoryService, type Category } from '../services/category.service';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import JudgeSelector from '../components/JudgeSelector';
import InviteUserSelector from '../components/InviteUserSelector';
import type { JudgeCandidate } from '../services/judge.service';
import { PlanPollLimits } from '../utils/planLimits';

const CreatePoll = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const plan = (user?.plan ?? 'FREE').toUpperCase();
    const maxJudges = PlanPollLimits.maxJudges(plan);
    const judgeWeight = PlanPollLimits.judgeWeight(plan);
    const canUseJudges = maxJudges > 0;

    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [options, setOptions] = useState<string[]>(['', '']);
    const [endTime, setEndTime] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [enableJudges, setEnableJudges] = useState(false);
    const [judges, setJudges] = useState<JudgeCandidate[]>([]);
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [invitedUsers, setInvitedUsers] = useState<JudgeCandidate[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        categoryService.getAllCategories().then(setCategories).catch(() => {});
    }, []);

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !tags.includes(newTag) && tags.length < 5) setTags([...tags, newTag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));
    const handleAddOption = () => setOptions([...options, '']);
    const handleOptionChange = (i: number, v: string) => { const n = [...options]; n[i] = v; setOptions(n); };
    const handleRemoveOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (options.some(opt => opt.trim() === '')) { setError(t('createPoll.errorEmptyOptions')); return; }
        setLoading(true); setError('');
        try {
            const formattedEndTime = endTime.length === 16 ? `${endTime}:00` : endTime;
            await pollService.createPoll({
                title: question,
                description: description.trim() || undefined,
                tags: tags.length > 0 ? tags : ['General'],
                isAnonymous,
                options: options.map(opt => ({ text: opt })),
                endTime: formattedEndTime,
                judgeIds: enableJudges && judges.length > 0 ? judges.filter(j => j.id).map(j => j.id) : [],
                visibility,
                invitedEmails: visibility === 'PRIVATE' ? invitedUsers.map(u => u.email ?? '').filter(Boolean) : [],
                categoryId: selectedCategoryId,
            });
            navigate('/explore');
        } catch (err: any) {
            setError(err.response?.data?.message || t('createPoll.errorFailed'));
        } finally { setLoading(false); }
    };

    const now = new Date();
    const localISOTime = (new Date(now.getTime() - now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    return (
        <div className="min-h-screen pb-12">
            <Navbar />
            <main className="max-w-3xl mx-auto px-6">
                <div className="glass-panel p-8 rounded-2xl shadow-xl bg-white/80 dark:bg-transparent border border-slate-200 dark:border-white/10">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('createPoll.title')}</h1>
                    <p className="text-slate-500 dark:text-indigo-200/80 mb-8">{t('createPoll.subtitle')}</p>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Question */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-2">{t('createPoll.question')}</label>
                            <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                placeholder={t('createPoll.questionPlaceholder')} required />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-1">Mô tả <span className="text-slate-400 dark:text-white/35 font-normal">(tùy chọn)</span></label>
                            <p className="text-xs text-slate-400 dark:text-white/40 mb-2">Thêm mô tả ngắn để người tham gia hiểu rõ hơn về cuộc thăm dò.</p>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                maxLength={500}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm resize-none"
                                placeholder="Chia sẻ thêm bối cảnh hoặc chi tiết về cuộc thăm dò..."
                            />
                            <p className="text-right text-xs text-slate-400 dark:text-white/30 mt-1">{description.length}/500</p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100">{t('createPoll.options')}</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3 relative group">
                                    <input type="text" value={option} onChange={e => handleOptionChange(index, e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm"
                                        placeholder={t('createPoll.optionPlaceholder', { index: index + 1 })} required />
                                    {options.length > 2 && (
                                        <button type="button" onClick={() => handleRemoveOption(index)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddOption}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 dark:border-white/20 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-400 dark:hover:border-white/40 rounded-xl transition-all font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                {t('createPoll.addOption')}
                            </button>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-1">{t('createPoll.category')}</label>
                            <p className="text-xs text-slate-400 dark:text-white/40 mb-3">{t('createPoll.categoryDesc')}</p>
                            {categories.length === 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {[...Array(9)].map((_, i) => <div key={i} className="h-9 w-28 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => {
                                        const isSelected = selectedCategoryId === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 select-none
                                                    ${isSelected
                                                        ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300 shadow-sm shadow-violet-200 dark:shadow-violet-900/30'
                                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white/85'
                                                    }`}
                                            >
                                                <span className="text-base leading-none">{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-3">{t('createPoll.tags')}</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium shadow-sm">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-white/70 hover:text-white transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} disabled={tags.length >= 5}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 shadow-sm"
                                placeholder={tags.length >= 5 ? t('createPoll.tagsMaxReached') : t('createPoll.tagsPlaceholder')} />
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-2">{t('createPoll.endTime')}</label>
                            <input type="datetime-local" min={localISOTime} value={endTime} onChange={e => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:[color-scheme:dark]"
                                required />
                        </div>

                        {/* Advanced Options Accordion */}
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setAdvancedOpen(o => !o)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left"
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    {t('createPoll.advancedOptions')}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {advancedOpen && (
                                <div className="divide-y divide-slate-200 dark:divide-white/10 px-5 py-4 space-y-5">

                        {/* Privacy */}
                        <div className="space-y-4">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={visibility === 'PRIVATE'} onChange={() => {
                                        const next = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
                                        setVisibility(next); setInvitedUsers([]);
                                        if (next === 'PRIVATE') { setEnableJudges(false); setJudges([]); }
                                    }} />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${visibility === 'PRIVATE' ? 'bg-violet-500' : 'bg-slate-300 dark:bg-white/10'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${visibility === 'PRIVATE' ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                                <div className="ml-4">
                                    <span className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">{t('createPoll.privacyPrivate')}</span>
                                    <span className="block text-xs text-slate-500 dark:text-indigo-200/60 mt-0.5">{t('createPoll.privacyPrivateDesc')}</span>
                                </div>
                            </label>
                            {visibility === 'PRIVATE' && (
                                <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4">
                                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-3">{t('createPoll.invitedUsersList')}</p>
                                    <InviteUserSelector invitedUsers={invitedUsers} onChange={setInvitedUsers} />
                                </div>
                            )}
                        </div>

                        {/* Anonymous */}
                        <div className="pt-2">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${isAnonymous ? 'bg-pink-500' : 'bg-slate-300 dark:bg-white/10'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isAnonymous ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                                <div className="ml-4">
                                    <span className="block text-slate-800 dark:text-white font-medium">{t('createPoll.anonymousMode')}</span>
                                    <span className="block text-xs text-slate-500 dark:text-indigo-200/60 mt-0.5">{t('createPoll.anonymousDesc')}</span>
                                </div>
                            </label>
                        </div>

                        {/* Judges */}
                        {visibility !== 'PRIVATE' && (canUseJudges ? (
                            <div className="pt-2 space-y-4">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={enableJudges} onChange={() => { setEnableJudges(!enableJudges); if (enableJudges) setJudges([]); }} />
                                        <div className={`block w-12 h-7 rounded-full transition-colors ${enableJudges ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/10'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${enableJudges ? 'transform translate-x-5' : ''}`}></div>
                                    </div>
                                    <div className="ml-4">
                                        <span className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
                                            {t('createPoll.judgesEnable')}
                                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">{plan}</span>
                                        </span>
                                        <span className="block text-xs text-slate-500 dark:text-indigo-200/60 mt-0.5">{t('createPoll.judgesWeightDesc', { judgeWeight, audienceWeight: 100 - judgeWeight })}</span>
                                    </div>
                                </label>
                                {enableJudges && (
                                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                                        <JudgeSelector judges={judges} onChange={setJudges} maxJudges={maxJudges} judgeWeight={judgeWeight} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <span className="text-2xl">⚖️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('createPoll.judgesEnable').replace('⚖️ ', '')}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{t('createPoll.judgesUpgrade')}</p>
                                    </div>
                                    <button type="button" onClick={() => navigate('/profile')}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-sm">
                                        {t('createPoll.upgradeBtn')}
                                    </button>
                                </div>
                            </div>
                        ))}

                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex justify-end gap-4">
                            <button type="button" onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium rounded-xl transition-all">
                                {t('createPoll.cancel')}
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm">
                                {loading ? t('createPoll.creating') : t('createPoll.submitBtn')}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreatePoll;

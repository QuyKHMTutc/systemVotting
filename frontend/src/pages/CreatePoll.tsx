import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import JudgeSelector from '../components/JudgeSelector';
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
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [options, setOptions] = useState<string[]>(['', '']);
    const [endTime, setEndTime] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [enableJudges, setEnableJudges] = useState(false);
    const [judges, setJudges] = useState<JudgeCandidate[]>([]);
    const navigate = useNavigate();

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/^#/, '');
            if (newTag && !tags.includes(newTag) && tags.length < 5) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (options.some(opt => opt.trim() === '')) {
            setError(t('createPoll.errorEmptyOptions'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Send local time string directly, appending seconds since datetime-local input omits them
            const formattedEndTime = endTime.length === 16 ? `${endTime}:00` : endTime;
            const payload = {
                title: question,
                tags: tags.length > 0 ? tags : ['General'],
                isAnonymous: isAnonymous,
                options: options.map(opt => ({ text: opt })),
                endTime: formattedEndTime,
                judgeIds: enableJudges && judges.length > 0
                    ? judges.filter(j => j.id).map(j => j.id)
                    : []
            };

            await pollService.createPoll(payload);
            navigate('/explore');
        } catch (err: any) {
            setError(err.response?.data?.message || t('createPoll.errorFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Get minimum datetime for the picker (now)
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);

    return (
        <div className="min-h-screen pb-12">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6">
                <div className="glass-panel p-8 rounded-2xl shadow-xl transition-colors bg-white/80 dark:bg-transparent border border-slate-200 dark:border-white/10">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('createPoll.title')}</h1>
                    <p className="text-slate-500 dark:text-indigo-200/80 mb-8">{t('createPoll.subtitle')}</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-2">{t('createPoll.question')}</label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                placeholder={t('createPoll.questionPlaceholder')}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-3">{t('createPoll.tags')}</label>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map((tag) => (
                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-medium shadow-sm">
                                        #{tag}
                                        <button 
                                            type="button" 
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 text-white/70 hover:text-white transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                disabled={tags.length >= 5}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 shadow-sm"
                                placeholder={tags.length >= 5 ? t('createPoll.tagsMaxReached') : t('createPoll.tagsPlaceholder')}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-2">{t('createPoll.options')}</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3 relative group">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm"
                                        placeholder={t('createPoll.optionPlaceholder', { index: index + 1 })}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-white/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            title={t('createPoll.removeOption')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="w-full flex items-center justify-center gap-2 py-3 mt-4 border-2 border-dashed border-slate-300 dark:border-white/20 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:border-indigo-400 dark:hover:border-white/40 rounded-xl transition-all font-medium group focus:outline-none focus:ring-2 focus:ring-pink-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 group-hover:text-pink-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                {t('createPoll.addOption')}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-indigo-100 mb-2">{t('createPoll.endTime')}</label>
                            <input
                                type="datetime-local"
                                min={localISOTime}
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:[color-scheme:dark]"
                                required
                            />
                        </div>

                        {/* Anonymous Toggle */}
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={isAnonymous}
                                        onChange={() => setIsAnonymous(!isAnonymous)}
                                    />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${isAnonymous ? 'bg-pink-500' : 'bg-slate-300 dark:bg-white/10'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isAnonymous ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                                <div className="ml-4">
                                    <span className="block text-slate-800 dark:text-white font-medium">{t('createPoll.anonymousMode')}</span>
                                    <span className="block text-xs text-slate-500 dark:text-indigo-200/60 mt-0.5 group-hover:text-slate-700 dark:group-hover:text-indigo-200/90 transition-colors">
                                        {t('createPoll.anonymousDesc')}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Judge Section */}
                        {canUseJudges ? (
                            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-4">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only"
                                            checked={enableJudges}
                                            onChange={() => { setEnableJudges(!enableJudges); if (enableJudges) setJudges([]); }}
                                        />
                                        <div className={`block w-12 h-7 rounded-full transition-colors ${enableJudges ? 'bg-amber-500' : 'bg-slate-300 dark:bg-white/10'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${enableJudges ? 'transform translate-x-5' : ''}`}></div>
                                    </div>
                                    <div className="ml-4">
                                        <span className="flex items-center gap-2 text-slate-800 dark:text-white font-medium">
                                            ⚖️ Bình chọn có Hội đồng Giám khảo
                                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">{plan}</span>
                                        </span>
                                        <span className="block text-xs text-slate-500 dark:text-indigo-200/60 mt-0.5">
                                            Giám khảo chiếm {judgeWeight}% điểm, khán giả chiếm {100 - judgeWeight}%
                                        </span>
                                    </div>
                                </label>

                                {enableJudges && (
                                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                                        <JudgeSelector
                                            judges={judges}
                                            onChange={setJudges}
                                            maxJudges={maxJudges}
                                            judgeWeight={judgeWeight}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                    <span className="text-2xl">⚖️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Bình chọn có Hội đồng Giám khảo</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Nâng cấp lên gói GO trở lên để sử dụng tính năng này</p>
                                    </div>
                                    <button type="button" onClick={() => navigate('/profile')}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all shadow-sm">
                                        Nâng cấp
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white font-medium rounded-xl transition-all"
                            >
                                {t('createPoll.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                            >
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

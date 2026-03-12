import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import Navbar from '../components/Navbar';

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [options, setOptions] = useState<string[]>(['', '']);
    const [endTime, setEndTime] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
            setError('All options must be filled');
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
                endTime: formattedEndTime
            };

            await pollService.createPoll(payload);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create poll');
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
                <div className="glass-panel p-8 rounded-2xl shadow-xl">
                    <h1 className="text-3xl font-bold text-white mb-2">Create New Poll</h1>
                    <p className="text-indigo-200/80 mb-8">Set up a question and let the community vote.</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-indigo-100 mb-2">Poll Question</label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="What would you like to ask?"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-100 mb-3">Tags (Tối đa 5 thẻ)</label>
                            
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
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                                placeholder={tags.length >= 5 ? "Đã đạt tối đa 5 thẻ" : "Nhập tag và bấm Enter (VD: CongNghe, GiaiTri)"}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-indigo-100 mb-2">Options</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3 relative group">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        placeholder={`Option ${index + 1}`}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                            title="Remove Option"
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
                                className="w-full flex items-center justify-center gap-2 py-3 mt-4 border border-dashed border-white/20 text-indigo-300 hover:text-white hover:bg-white/5 hover:border-white/40 rounded-xl transition-all font-medium group focus:outline-none focus:ring-2 focus:ring-pink-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 group-hover:text-pink-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                Add another option
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-100 mb-2">End Date & Time</label>
                            <input
                                type="datetime-local"
                                min={localISOTime}
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                                required
                            />
                        </div>

                        {/* Anonymous Toggle */}
                        <div className="pt-2 border-t border-white/10">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={isAnonymous}
                                        onChange={() => setIsAnonymous(!isAnonymous)}
                                    />
                                    <div className={`block w-12 h-7 rounded-full transition-colors ${isAnonymous ? 'bg-pink-500' : 'bg-white/10'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${isAnonymous ? 'transform translate-x-5' : ''}`}></div>
                                </div>
                                <div className="ml-4">
                                    <span className="block text-white font-medium">Bảo mật ẩn danh (Anonymous Mode)</span>
                                    <span className="block text-xs text-indigo-200/60 mt-0.5 group-hover:text-indigo-200/90 transition-colors">
                                        Đăng dưới chế độ ẩn danh. Người khác sẽ không thấy bạn là người tạo.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                            >
                                {loading ? 'Creating...' : 'Create Poll'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreatePoll;

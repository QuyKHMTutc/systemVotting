import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { TOPICS } from '../constants/topics';

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [topic, setTopic] = useState('Khác');
    const [options, setOptions] = useState<string[]>(['', '']);
    const [endTime, setEndTime] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
                topic: topic,
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
                            <label className="block text-sm font-medium text-indigo-100 mb-3">Topic / Chủ đề</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar w-full">
                                {TOPICS.map((t) => {
                                    const Icon = t.icon;
                                    const isSelected = topic === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTopic(t.id)}
                                            className={`flex flex-row items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 whitespace-nowrap outline-none ${
                                                isSelected 
                                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-transparent text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] transform scale-105 font-bold' 
                                                    : 'bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10 hover:border-white/20 hover:text-white font-medium'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-300/70'}`} />
                                            <span className="text-sm">{t.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
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

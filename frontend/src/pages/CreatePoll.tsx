import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/poll.service';
import Navbar from '../components/Navbar';
import { Cpu, Coffee, Gamepad2, BookOpen, Trophy, Tag } from 'lucide-react';

const CATEGORIES = [
    { id: 'Công nghệ', name: 'Công nghệ', icon: Cpu },
    { id: 'Cuộc sống', name: 'Cuộc sống', icon: Coffee },
    { id: 'Game', name: 'Game', icon: Gamepad2 },
    { id: 'Giáo dục', name: 'Giáo dục', icon: BookOpen },
    { id: 'Thể thao', name: 'Thể thao', icon: Trophy },
    { id: 'Khác', name: 'Khác', icon: Tag },
];

const CreatePoll = () => {
    const [question, setQuestion] = useState('');
    const [category, setCategory] = useState('Khác');
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
                category: category,
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
                            <label className="block text-sm font-medium text-indigo-100 mb-3">Category</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                                                isSelected 
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transform scale-[1.02]' 
                                                    : 'bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-indigo-400' : 'text-indigo-300/70'}`} />
                                            <span className="text-sm font-medium">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-indigo-100 mb-2">Options</label>
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder={`Option ${index + 1}`}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index)}
                                            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="text-indigo-300 hover:text-indigo-200 text-sm font-medium mt-2 flex items-center transition-colors border border-dashed border-indigo-500/30 px-4 py-2 rounded-lg w-full justify-center"
                            >
                                + Add another option
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
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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

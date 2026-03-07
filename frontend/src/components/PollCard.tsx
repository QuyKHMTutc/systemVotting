
import { Link } from 'react-router-dom';
import type { Poll } from '../services/poll.service';

export const PollCard = ({ poll }: { poll: Poll }) => {
    const isActive = new Date(poll.endTime) > new Date();
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return (
        <div className="glass-panel p-6 rounded-2xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden group flex flex-col h-full border border-gray-100 bg-white">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {isActive ? '● Active' : '○ Ended'}
                    </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{poll.title}</h2>

                <div className="mt-auto pt-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-5 py-3 border-y border-gray-100">
                        <div className="flex flex-col items-center">
                            <span className="text-gray-900 font-bold text-sm mb-0.5">{totalVotes}</span>
                            <span>Votes</span>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-900 font-bold text-sm mb-0.5">{poll.options.length}</span>
                            <span>Options</span>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-900 font-medium mb-0.5">{new Date(poll.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span>Ends</span>
                        </div>
                    </div>

                    <Link
                        to={`/poll/${poll.id}`}
                        className={`block text-center w-full py-2.5 px-4 rounded-xl transition-all font-medium text-sm ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'}`}
                    >
                        {isActive ? 'Vote Now' : 'View Results'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

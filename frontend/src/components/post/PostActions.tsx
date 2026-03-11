import React from 'react';
import { Share2, MessageSquare } from 'lucide-react';

interface PostActionsProps {
    commentsCount: number;
    sharesCount?: number;
    onCommentClick: () => void;
    onShareClick: () => void;
    hasCopied?: boolean;
}

const PostActions: React.FC<PostActionsProps> = ({ 
    commentsCount, 
    sharesCount = 0, 
    onCommentClick, 
    onShareClick,
    hasCopied = false
}) => {
    return (
        <div className="mt-6 pt-4 border-t border-white/10">
            {/* Counts Row */}
            <div className="flex justify-between items-center px-2 mb-3 text-[14px] text-gray-400">
                <div className="flex gap-4">
                    <span className="hover:underline cursor-pointer">{commentsCount} comments</span>
                </div>
                <div className="flex gap-4">
                    <span className="hover:underline cursor-pointer">{sharesCount > 0 ? `${sharesCount} shares` : ''}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-white/10 w-full mb-1"></div>

            {/* Actions Row */}
            <div className="flex justify-between items-center gap-1">
                <button 
                    onClick={onCommentClick}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-200 font-semibold text-[15px]"
                >
                    <MessageSquare className="w-5 h-5" />
                    Comment
                </button>
                <button 
                    onClick={onShareClick}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-200 font-semibold text-[15px] relative"
                >
                    <Share2 className="w-5 h-5" />
                    Share
                    {hasCopied && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 animate-fade-in-up">
                            Link copied!
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PostActions;

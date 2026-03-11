import React, { useState } from 'react';
import type { Comment } from '../../services/comment.service';
import { CornerDownRight } from 'lucide-react';
import CommentInput from './CommentInput';

interface CommentItemProps {
    comment: Comment;
    onReplySubmit: (parentId: number, content: string) => void;
}

// Relative time helper
const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    return date.toLocaleDateString();
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReplySubmit }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const hasVoted = comment.voteStatus !== 'Chưa vote';
    const isReply = comment.parentId != null;
    const formattedDate = getRelativeTime(comment.createdAt);

    const handleReplyClick = () => {
        setIsReplying(!isReplying);
    };

    return (
        <div className="flex gap-2 mb-4 w-full group/item">
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                <img 
                    src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${comment.username}&background=random`} 
                    alt={comment.username} 
                    className="w-8 h-8 rounded-full object-cover cursor-pointer"
                />
            </div>

            {/* Comment Content Area */}
            <div className="flex-1 min-w-0">
                {/* Bubble Wrapper with Hover */}
                <div className="max-w-[80%] md:max-w-[500px]">
                    <div className="bg-[#2a2a2a] md:bg-[#2a2a2a] px-3 py-2 rounded-2xl relative group-hover/item:bg-white/5 transition-colors w-fit inline-block">
                        <span className="font-semibold text-white text-[13px] mr-2 cursor-pointer hover:underline">{comment.username}</span>
                        <span className="text-[#E4E6EB] whitespace-pre-wrap text-[14px] leading-snug break-words">
                            {comment.content.split(' ').map((word, index) => {
                                if (word.startsWith('@')) {
                                    return <span key={index} className="text-indigo-400 font-medium">{word} </span>;
                                }
                                return word + ' ';
                            })}
                        </span>
                    </div>
                </div>

                {/* Action Row - Outside Bubble */}
                <div className="flex items-center gap-3 mt-1 ml-3 text-[12px] text-gray-400">
                    <span className="hover:underline cursor-pointer">{formattedDate}</span>
                    <span className="text-gray-500 font-bold -translate-y-px">·</span>
                    <button 
                        onClick={handleReplyClick}
                        className="font-bold hover:underline transition-colors outline-none cursor-pointer"
                    >
                        Reply
                    </button>
                    <span className="text-gray-500 font-bold -translate-y-px">·</span>
                    <button className="font-bold hover:underline transition-colors outline-none cursor-pointer">
                        Like
                    </button>
                    {hasVoted && (
                        <>
                            <span className="text-gray-500 font-bold -translate-y-px">·</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full text-indigo-300 bg-indigo-500/10 whitespace-nowrap">
                                {comment.voteStatus}
                            </span>
                        </>
                    )}
                </div>

                {/* Reply Form */}
                {isReplying && (
                    <div className="w-full mt-2">
                        <CommentInput 
                            onSubmit={(content) => {
                                let finalContent = content;
                                if (isReply && !finalContent.startsWith(`@${comment.username}`)) {
                                    finalContent = `@${comment.username} ${finalContent}`;
                                }
                                onReplySubmit(comment.id, finalContent);
                                setIsReplying(false);
                            }}
                            placeholder={`Reply to ${comment.username}...`}
                            username="You" 
                            isReply={true}
                            autoFocus={true}
                        />
                    </div>
                )}

                {/* Render Replies (Recursive) */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 w-full ml-0 sm:ml-4 flex flex-col pl-4">
                        {showReplies ? (
                            <>
                                {comment.replies?.map(reply => (
                                    <CommentItem 
                                        key={reply.id} 
                                        comment={reply} 
                                        onReplySubmit={onReplySubmit} 
                                    />
                                ))}
                                <button 
                                    onClick={() => setShowReplies(false)}
                                    className="text-[13px] font-medium text-blue-400 hover:underline mt-1 flex items-center gap-2 group w-fit outline-none transition-colors"
                                >
                                    <CornerDownRight className="w-4 h-4 opacity-70" />
                                    Hide replies
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setShowReplies(true)}
                                className="text-[13px] font-medium text-blue-400 hover:underline mt-1 flex items-center gap-2 group w-fit outline-none transition-colors"
                            >
                                <CornerDownRight className="w-4 h-4" />
                                View {comment.replies?.length} replies
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;

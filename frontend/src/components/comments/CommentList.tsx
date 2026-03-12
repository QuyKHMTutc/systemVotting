import React, { useState } from 'react';
import type { Comment } from '../../services/comment.service';
import CommentItem from './CommentItem';

interface CommentListProps {
    comments: Comment[];
    onReplySubmit: (parentId: number, content: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, onReplySubmit }) => {
    // Dictionary to preserve reply thread expansion state across re-renders
    const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});

    const toggleReply = (commentId: number, forceOpen?: boolean) => {
        setExpandedReplies(prev => ({
            ...prev,
            [commentId]: forceOpen !== undefined ? forceOpen : !prev[commentId]
        }));
    };

    // Note: When submitting a reply inside CommentItem, we can call toggleReply(comment.id, true) 
    // to ensure the thread remains open after the new reply is fetched and causes a structural re-render.
    if (!comments || comments.length === 0) {
        return (
            <div className="text-center text-white/40 py-6 border border-dashed border-white/10 rounded-xl">
                No comments yet. Be the first to share your thoughts!
            </div>
        );
    }

    return (
        <div className="space-y-2 mt-4">
            {comments.map((comment) => (
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReplySubmit={onReplySubmit}
                    expandedReplies={expandedReplies}
                    toggleReply={toggleReply}
                />
            ))}
        </div>
    );
};

export default CommentList;

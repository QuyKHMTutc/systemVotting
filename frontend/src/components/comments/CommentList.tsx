import React from 'react';
import type { Comment } from '../../services/comment.service';
import CommentItem from './CommentItem';

interface CommentListProps {
    comments: Comment[];
    onReplySubmit: (parentId: number, content: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, onReplySubmit }) => {
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
                />
            ))}
        </div>
    );
};

export default CommentList;

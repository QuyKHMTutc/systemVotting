import React, { useState, useEffect } from 'react';
import { commentService } from '../../services/comment.service';
import type { Comment } from '../../services/comment.service';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import { MessageSquare } from 'lucide-react';

interface CommentSectionProps {
    pollId: number;
    voteTrigger?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pollId, voteTrigger = 0 }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComments = async () => {
        try {
            const data = await commentService.getCommentsByPollId(pollId);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [pollId, voteTrigger]);

    const handleSubmit = async (content: string) => {
        setError('');

        try {
            await commentService.createComment({ pollId, content });
            fetchComments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to post comment');
        }
    };

    const handleReplySubmit = async (parentId: number, content: string) => {
        try {
            await commentService.createComment({
                pollId,
                parentId,
                content
            });
            fetchComments();
        } catch (err: any) {
            console.error('Failed to post reply:', err);
        }
    };

    return (
        <div className="mt-8 glass-panel p-6 rounded-2xl shadow-lg border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Discussion ({comments.length})
            </h3>

            {/* Comment Form */}
            <div className="mb-6">
                {error && <div className="text-red-400 text-sm mb-2 ml-12">{error}</div>}
                <CommentInput onSubmit={handleSubmit} placeholder="Write a comment..." />
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-white/40 py-6 border border-dashed border-white/10 rounded-xl">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                ) : (
                    <CommentList comments={comments} onReplySubmit={handleReplySubmit} />
                )}
            </div>
        </div>
    );
};

export default CommentSection;

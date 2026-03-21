import React, { useState, useEffect, useCallback } from 'react';
import { commentService } from '../../services/comment.service';
import type { Comment } from '../../services/comment.service';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CommentSectionProps {
    pollId: number;
    voteTrigger?: number;
}

const countTotalComments = (commentsList: Comment[]): number => {
    return commentsList.reduce((acc, comment) => {
        return acc + 1 + countTotalComments(comment.replies || []);
    }, 0);
};

const CommentSection: React.FC<CommentSectionProps> = ({ pollId, voteTrigger = 0 }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await commentService.getCommentsByPollId(pollId);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoading(false);
        }
    }, [pollId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments, voteTrigger]);

    const handleSubmit = async (content: string, isAnonymous: boolean) => {
        setError('');

        try {
            await commentService.createComment({ pollId, content, isAnonymous });
            fetchComments();
        } catch (err) {
            const error = err as Error | any;
            setError(error.response?.data?.message || 'Failed to post comment');
        }
    };

    const handleReplySubmit = async (parentId: number, content: string, isAnonymous: boolean) => {
        try {
            await commentService.createComment({
                pollId,
                parentId,
                content,
                isAnonymous
            });
            fetchComments();
        } catch (err) {
            console.error('Failed to post reply:', err);
        }
    };

    return (
        <div className="mt-8 glass-panel p-6 rounded-2xl shadow-lg border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Discussion ({countTotalComments(comments)})
            </h3>

            {/* Comment Form */}
            <div className="mb-6">
                {error && <div className="text-red-400 text-sm mb-2 ml-12">{error}</div>}
                <CommentInput 
                  onSubmit={handleSubmit} 
                  placeholder="Write a comment..." 
                  avatarUrl={user?.avatarUrl && (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob')) ? user.avatarUrl : user?.avatarUrl ? `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}` : undefined}
                  username={user?.username}
                />
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

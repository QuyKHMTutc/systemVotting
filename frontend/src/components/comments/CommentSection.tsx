import React, { useState, useEffect } from 'react';
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

const PAGE_SIZE = 20;

const CommentSection: React.FC<CommentSectionProps> = ({ pollId, voteTrigger = 0 }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [totalAllComments, setTotalAllComments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        async function loadFirstPage() {
            setLoading(true);
            try {
                const data = await commentService.getCommentsByPollId(pollId, 0, PAGE_SIZE);
                if (cancelled) return;
                setComments(data.page.content);
                setPage(0);
                setTotalAllComments(data.totalAllComments);
                setHasMore(data.page.currentPage + 1 < data.page.totalPages);
            } catch (err) {
                if (!cancelled) console.error('Failed to fetch comments', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void loadFirstPage();
        return () => {
            cancelled = true;
        };
    }, [pollId, voteTrigger]);

    const handleSubmit = async (content: string, isAnonymous: boolean) => {
        setError('');

        try {
            await commentService.createComment({ pollId, content, isAnonymous });
            const data = await commentService.getCommentsByPollId(pollId, 0, PAGE_SIZE);
            setComments(data.page.content);
            setPage(0);
            setTotalAllComments(data.totalAllComments);
            setHasMore(data.page.currentPage + 1 < data.page.totalPages);
        } catch (err) {
            const caught = err as Error | { response?: { data?: { message?: string } } };
            const msg =
                typeof caught === 'object' &&
                caught !== null &&
                'response' in caught &&
                caught.response?.data?.message
                    ? caught.response.data.message
                    : 'Failed to post comment';
            setError(msg);
        }
    };

    const handleReplySubmit = async (parentId: number, content: string, isAnonymous: boolean) => {
        try {
            await commentService.createComment({
                pollId,
                parentId,
                content,
                isAnonymous,
            });
            const data = await commentService.getCommentsByPollId(pollId, 0, PAGE_SIZE);
            setComments(data.page.content);
            setPage(0);
            setTotalAllComments(data.totalAllComments);
            setHasMore(data.page.currentPage + 1 < data.page.totalPages);
        } catch (err) {
            console.error('Failed to post reply:', err);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const data = await commentService.getCommentsByPollId(pollId, next, PAGE_SIZE);
            setComments((prev) => [...prev, ...data.page.content]);
            setPage(next);
            setHasMore(data.page.currentPage + 1 < data.page.totalPages);
            setTotalAllComments(data.totalAllComments);
        } catch (err) {
            console.error('Failed to load more comments', err);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="mt-8 glass-panel p-6 rounded-2xl shadow-lg border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Discussion ({totalAllComments})
            </h3>

            <div className="mb-6">
                {error && <div className="text-red-400 text-sm mb-2 ml-12">{error}</div>}
                <CommentInput
                    onSubmit={handleSubmit}
                    placeholder="Write a comment..."
                    avatarUrl={
                        user?.avatarUrl &&
                        (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('blob'))
                            ? user.avatarUrl
                            : user?.avatarUrl
                              ? `${import.meta.env.PROD ? 'https://systemvotting.onrender.com' : 'http://localhost:8080'}${user.avatarUrl}`
                              : undefined
                    }
                    username={user?.username}
                />
            </div>

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
                    <>
                        <CommentList comments={comments} onReplySubmit={handleReplySubmit} />
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => void loadMore()}
                                    disabled={loadingMore}
                                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-50"
                                >
                                    {loadingMore ? 'Loading…' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentSection;

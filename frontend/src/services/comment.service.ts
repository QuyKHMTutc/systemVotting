import api from './api';
import type { PageResponse } from '../types/page';

export interface Comment {
    id: number;
    userId: number | null;
    username: string;
    avatarUrl: string | null;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    voteStatus: string;
    parentId?: number;
    pollId?: number;
    pollTitle?: string;
    replies?: Comment[];
}

export type CommentPage = PageResponse<Comment>;

export interface CommentThreadResponse {
    page: CommentPage;
    totalAllComments: number;
}

export interface CommentCreateRequest {
    pollId: number;
    parentId?: number;
    content: string;
    isAnonymous: boolean;
}

export interface IdentityStatus {
    hasCommented: boolean;
    isAnonymous: boolean | null;
}

export const commentService = {
    getCommentsByPollId: async (
        pollId: number,
        page = 0,
        size = 20
    ): Promise<CommentThreadResponse> => {
        const response = await api.get(`/comments/poll/${pollId}`, {
            params: { page, size },
        });
        return response.data.data;
    },

    getMyComments: async (page = 0, size = 100): Promise<CommentPage> => {
        const response = await api.get('/comments/me', { params: { page, size } });
        return response.data.data;
    },

    createComment: async (data: CommentCreateRequest): Promise<Comment> => {
        const response = await api.post('/comments', data);
        return response.data.data;
    },

    getIdentityStatus: async (pollId: number): Promise<IdentityStatus> => {
        const response = await api.get(`/comments/identity-status?pollId=${pollId}`);
        return response.data.data;
    },
};

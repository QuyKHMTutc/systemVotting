import api from './api';

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

export interface CommentPage {
    content: Comment[];
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
}

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

    getMyComments: async (): Promise<Comment[]> => {
        const response = await api.get('/comments/me');
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

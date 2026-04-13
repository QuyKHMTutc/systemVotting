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

export interface CommentCreateRequest {
    pollId: number;
    parentId?: number;
    content: string;
    isAnonymous: boolean;
}

export const commentService = {
    getCommentsByPollId: async (pollId: number): Promise<Comment[]> => {
        const response = await api.get(`/comments/poll/${pollId}`);
        return response.data.data;
    },

    getMyComments: async (): Promise<Comment[]> => {
        const response = await api.get('/comments/me');
        return response.data.data;
    },

    createComment: async (data: CommentCreateRequest): Promise<Comment> => {
        const response = await api.post('/comments', data);
        return response.data.data;
    }
};

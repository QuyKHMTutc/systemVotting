import api from './api';

export interface Comment {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string | null;
    content: string;
    createdAt: string;
    voteStatus: string;
    parentId?: number;
    replies?: Comment[];
}

export interface CommentCreateRequest {
    pollId: number;
    parentId?: number;
    content: string;
}

export const commentService = {
    getCommentsByPollId: async (pollId: number): Promise<Comment[]> => {
        const response = await api.get(`/comments/poll/${pollId}`);
        return response.data.data;
    },

    createComment: async (data: CommentCreateRequest): Promise<Comment> => {
        const response = await api.post('/comments', data);
        return response.data.data;
    }
};

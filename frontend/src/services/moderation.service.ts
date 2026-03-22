import api from './api';

export type ModerationDecision = 'APPROVED' | 'REJECTED';

export interface ModeratedComment {
    id: number;
    userId: number | null;
    username: string;
    avatarUrl: string | null;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    voteStatus: string;
    parentId?: number;
    moderationStatus?: string;
    moderationLabel?: string;
    moderationConfidence?: number;
}

export interface ModeratedPoll {
    id: number;
    title: string;
    description: string;
    tags: string[];
    isAnonymous: boolean;
    startTime: string;
    endTime: string;
    creator: {
        id: number;
        username: string;
        avatarUrl?: string;
    };
    options: { id: number; text: string; voteCount: number }[];
    commentCount: number;
    createdAt: string;
    moderationStatus?: string;
    moderationLabel?: string;
    moderationConfidence?: number;
    moderationField?: string;
}

export interface ModerationQueue {
    comments: ModeratedComment[];
    polls: ModeratedPoll[];
}

export const moderationService = {
    getReviewQueue: async (): Promise<ModerationQueue> => {
        const response = await api.get('/admin/moderation');
        return response.data.data;
    },

    reviewComment: async (commentId: number, decision: ModerationDecision): Promise<ModeratedComment> => {
        const response = await api.put(`/admin/moderation/comments/${commentId}`, { decision });
        return response.data.data;
    },

    reviewPoll: async (pollId: number, decision: ModerationDecision): Promise<ModeratedPoll> => {
        const response = await api.put(`/admin/moderation/polls/${pollId}`, { decision });
        return response.data.data;
    }
};

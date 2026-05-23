import api from './api';
import type { PageResponse } from '../types/page';

export interface PendingPoll {
    id: number;
    title: string;
    description: string;
    moderationReason: string;
    moderationStatus: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
    creator: { id: number; username: string; avatarUrl?: string };
    options: { id: number; text: string }[];
    createdAt: string;
    tags: string[];
    visibility: 'PUBLIC' | 'PRIVATE';
}

export interface FlaggedComment {
    id: number;
    content: string;
    username: string;
    avatarUrl: string | null;
    pollId: number;
    pollTitle: string;
    moderationReason: string;
    createdAt: string;
}

export interface ModerationCount {
    pendingPolls: number;
    flaggedComments: number;
    total: number;
}

export const moderationService = {
    // Tổng số mục cần duyệt (cho Badge)
    getCount: async (): Promise<ModerationCount> => {
        const res = await api.get('/admin/moderation/count');
        return res.data.data;
    },

    // Polls chờ duyệt
    getPendingPolls: async (page = 0, size = 20): Promise<PageResponse<PendingPoll>> => {
        const res = await api.get('/admin/moderation/polls/pending', { params: { page, size } });
        return res.data.data;
    },

    approvePoll: async (id: number): Promise<void> => {
        await api.post(`/admin/moderation/polls/${id}/approve`);
    },

    rejectPoll: async (id: number, reason?: string): Promise<void> => {
        await api.post(`/admin/moderation/polls/${id}/reject`, { reason: reason ?? 'Vi phạm tiêu chuẩn cộng đồng' });
    },

    // Comments bị gắn cờ
    getFlaggedComments: async (page = 0, size = 20): Promise<PageResponse<FlaggedComment>> => {
        const res = await api.get('/admin/moderation/comments/flagged', { params: { page, size } });
        return res.data.data;
    },

    approveComment: async (id: number): Promise<void> => {
        await api.post(`/admin/moderation/comments/${id}/approve`);
    },

    blockComment: async (id: number): Promise<void> => {
        await api.post(`/admin/moderation/comments/${id}/block`);
    },
};

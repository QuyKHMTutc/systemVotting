import api from './api';
import type { PageResponse } from '../types/page';

export type PollPageResponse = PageResponse<Poll>;

export interface Poll {
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
    options: PollOption[];
    commentCount: number;
    createdAt: string;
}

export interface PollOption {
    id: number;
    text: string;
    voteCount: number;
}

export const pollService = {
    getAllPolls: async (page = 0, size = 10, title = '', tag = 'ALL', status = 'ALL'): Promise<PollPageResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            tag: tag,
            status: status
        });
        if (title) params.append('title', title);

        const response = await api.get(`/polls?${params.toString()}`);
        return response.data.data;
    },

    getPollById: async (id: number): Promise<Poll> => {
        const response = await api.get(`/polls/${id}`);
        return response.data.data;
    },

    createPoll: async (pollData: any): Promise<Poll> => {
        const response = await api.post('/polls', pollData);
        return response.data;
    },

    deletePoll: async (id: number): Promise<void> => {
        await api.delete(`/polls/${id}`);
    },

    getMyPolls: async (page = 0, size = 100): Promise<PollPageResponse> => {
        const response = await api.get('/polls/my-polls', { params: { page, size } });
        return response.data.data;
    },

    getMyVotedPolls: async (page = 0, size = 100): Promise<PollPageResponse> => {
        const response = await api.get('/polls/my-voted', { params: { page, size } });
        return response.data.data;
    }
};

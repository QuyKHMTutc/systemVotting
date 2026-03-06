import api from './api';

export interface PollPageResponse {
    content: Poll[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface Poll {
    id: number;
    question: string;
    creatorId: number;
    creatorUsername: string;
    startTime: string;
    endTime: string;
    options: PollOption[];
    createdAt: string;
}

export interface PollOption {
    id: number;
    content: string;
    voteCount: number;
}

export const pollService = {
    getAllPolls: async (page = 0, size = 10): Promise<PollPageResponse> => {
        const response = await api.get(`/polls?page=${page}&size=${size}`);
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
    }
};

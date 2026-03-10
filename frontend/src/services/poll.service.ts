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
    title: string;
    description: string;
    topic: string;
    startTime: string;
    endTime: string;
    creator: {
        id: number;
        username: string;
    };
    options: PollOption[];
    createdAt: string;
}

export interface PollOption {
    id: number;
    text: string;
    voteCount: number;
}

export const pollService = {
    getAllPolls: async (page = 0, size = 10, title = '', topic = 'ALL', status = 'ALL'): Promise<PollPageResponse> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            topic: topic,
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

    getMyPolls: async (): Promise<Poll[]> => {
        const response = await api.get('/polls/my-polls');
        return response.data.data;
    },

    getMyVotedPolls: async (): Promise<Poll[]> => {
        const response = await api.get('/polls/my-voted');
        return response.data.data;
    }
};

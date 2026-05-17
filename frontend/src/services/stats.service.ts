import api from './api';

export interface CommunityStats {
    totalPolls: number;
    totalVotes: number;
    totalComments: number;
    activePolls: number;
    totalUsers: number;
    totalRevenue: number;
}

export const statsService = {
    getCommunityStats: async (): Promise<CommunityStats> => {
        const response = await api.get('/stats/community');
        return response.data.data;
    },
};

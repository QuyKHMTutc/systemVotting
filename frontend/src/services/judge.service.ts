import api from './api';

export interface JudgeCandidate {
    id: number | null;
    username: string | null;
    email: string | null;
    avatarUrl: string | null;
    matchedValue: string;
    found: boolean;
}

export const judgeService = {
    searchUsers: async (keyword: string): Promise<JudgeCandidate[]> => {
        const response = await api.get('/polls/search-users', { params: { keyword } });
        return response.data.data;
    },

    parseCsv: async (csvContent: string): Promise<JudgeCandidate[]> => {
        const response = await api.post('/polls/parse-judges', csvContent, {
            headers: { 'Content-Type': 'text/plain' }
        });
        return response.data.data;
    }
};

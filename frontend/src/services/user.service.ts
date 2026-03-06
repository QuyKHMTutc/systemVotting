import api from './api';

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    role: string;
    locked: boolean;
}

export const userService = {
    getAllUsers: async (): Promise<UserDTO[]> => {
        // Assuming backend returns a list of users, if the endpoint exists
        // Fallback: If no dedicated endpoint, we might mock it or assume '/users' 
        const response = await api.get('/users');
        return response.data.data; // Assuming BaseResponse wrapper
    },

    toggleLock: async (id: number): Promise<void> => {
        await api.put(`/users/${id}/toggle-lock`);
    }
};

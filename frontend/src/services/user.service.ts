import api from './api';
import type { PageResponse } from '../types/page';

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    role: string;
    locked: boolean;
}

export type UserPageResponse = PageResponse<UserDTO>;

export const userService = {
    getAllUsers: async (page = 0, size = 100, search?: string): Promise<UserPageResponse> => {
        const response = await api.get('/users', { params: { page, size, search } });
        return response.data.data;
    },

    toggleLock: async (id: number): Promise<void> => {
        await api.put(`/users/${id}/toggle-lock`);
    },

    changePassword: async (data: any): Promise<void> => {
        await api.put('/users/me/password', data);
    }
};

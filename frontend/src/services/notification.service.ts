import api from './api';

export interface Notification {
    id: number;
    actorName: string;
    actorAvatar: string | null;
    type: 'NEW_COMMENT' | 'NEW_REPLY' | 'NEW_VOTE';
    message: string;
    relatedPollId: number;
    relatedCommentId?: number;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getMyNotifications: async (): Promise<Notification[]> => {
        try {
            const response = await api.get('/notifications');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    getUnreadCount: async (): Promise<number> => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    },

    markAsRead: async (id: number): Promise<void> => {
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    markAllAsRead: async (): Promise<void> => {
        try {
            await api.put('/notifications/read-all');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
};

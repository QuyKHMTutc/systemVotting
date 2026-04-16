import api from './api';

export const authService = {
    login: async (data: any) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    loginWithGoogle: async (idToken: string) => {
        const response = await api.post('/auth/google', { idToken });
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (data: any) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },
    verifyRegistration: async (email: string, otp: string) => {
        const response = await api.post('/auth/verify-registration', { email, otp });
        return response.data;
    },
    resendRegistrationOtp: async (email: string) => {
        const response = await api.post('/auth/resend-registration-otp', { email });
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    }
};

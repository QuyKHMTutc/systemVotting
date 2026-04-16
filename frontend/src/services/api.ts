import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

let inMemoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
    inMemoryToken = token;
};

export const getMemoryToken = () => inMemoryToken;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    if (inMemoryToken && config.headers) {
        config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refreshToken') {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Thử refresh token thông qua HttpOnly cookie
                const response = await axios.post(`${API_BASE_URL}/auth/refreshToken`, {}, { withCredentials: true });
                if (response.data && response.data.data) {
                    const { accessToken } = response.data.data;
                    setMemoryToken(accessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    processQueue(null, accessToken);
                    return api(originalRequest);
                } else {
                    throw new Error("Invalid response");
                }
            } catch (err) {
                processQueue(err, null);
                setMemoryToken(null);
                window.dispatchEvent(new Event('auth-logout'));
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;

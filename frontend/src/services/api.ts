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
    const publicAuthEndpoints = [
        '/auth/login', '/auth/register', '/auth/refreshToken',
        '/auth/forgot-password', '/auth/reset-password', '/auth/google',
        '/auth/verify-registration', '/auth/resend-registration-otp',
    ];
    
    const isPublicAuthEndpoint = publicAuthEndpoints.some(ep => config.url?.includes(ep));

    // Các GET endpoint thực sự public: danh sách poll, chi tiết poll, categories
    // LƯU Ý: /comments/poll/{id} KHÔNG được liệt kê ở đây để token luôn được gửi kèm
    // khi user đã đăng nhập — backend cần userId để hiện badge "Đã vote: [đáp án]"
    // Backend xử lý jwt=null tốt nên guest vẫn đọc được bình luận bình thường
    const isPublicGet = config.method?.toLowerCase() === 'get' && (
        /^\/polls(\?|$)/.test(config.url ?? '') ||          // GET /polls (danh sách)
        /^\/polls\/trending/.test(config.url ?? '') ||       // GET /polls/trending
        /^\/categories/.test(config.url ?? '')               // GET /categories/**
        // LƯU Ý: GET /polls/{id} KHÔNG được liệt kê ở đây:
        // 1. Backend cần userId để check quyền xem PRIVATE poll (callerEmail từ JWT)
        // 2. Backend cần userId để hiện badge "Đã vote: [đáp án]" trong comments
        // Backend xử lý jwt=null tốt nên guest vẫn đọc được poll public bình thường
    );

    // Gửi token nếu có và không phải auth endpoint — isPublicGet chỉ skip token khi thực sự public
    if (inMemoryToken && config.headers && !isPublicAuthEndpoint && !isPublicGet) {
        config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
});

let refreshPromise: Promise<string> | null = null;

export const forceRefreshToken = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE_URL}/auth/refreshToken`, {}, { withCredentials: true })
            .then(response => {
                if (response.data && response.data.data) {
                    const { accessToken } = response.data.data;
                    setMemoryToken(accessToken);
                    localStorage.setItem('accessToken', accessToken); // Keep localStorage in sync with refreshed token
                    return accessToken;
                }
                throw new Error("Invalid response");
            })
            .catch(err => {
                setMemoryToken(null);
                localStorage.removeItem('accessToken'); // Clear stale token on refresh failure
                window.dispatchEvent(new Event('auth-logout'));
                throw err;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refreshToken') {
            originalRequest._retry = true;
            
            try {
                const newToken = await forceRefreshToken();
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

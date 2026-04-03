import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api',
    withCredentials: true, // Important for httpOnly cookies
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true' // Bypasses Localtunnel warning page
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired, try to refresh
            if (error.config.url !== '/auth/refresh' && error.config.url !== '/auth/login' && error.config.url !== '/auth/me') {
                try {
                    await api.post('/auth/refresh');
                    // Retry original request
                    return api.request(error.config);
                } catch (refreshError) {
                    // Refresh failed, redirect to login if not already there
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

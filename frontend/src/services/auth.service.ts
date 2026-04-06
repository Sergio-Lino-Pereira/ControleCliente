import api from './api';
import { User } from '../types/user';
import { RegisterFormData, LoginFormData } from '../schemas/auth.schema';

export const authService = {
    async register(data: RegisterFormData): Promise<{ user: User }> {
        const response = await api.post('/auth/register', data);
        const { user, accessToken } = response.data.data;
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        return { user };
    },


    async login(data: LoginFormData): Promise<{ user: User }> {
        const response = await api.post('/auth/login', data);
        const { user, accessToken } = response.data.data;
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        return { user };
    },


    async logout(): Promise<void> {
        localStorage.removeItem('accessToken');
        await api.post('/auth/logout');
    },


    async getCurrentUser(): Promise<{ user: User }> {
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    async refreshToken(): Promise<void> {
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data.data;
        if (accessToken) localStorage.setItem('accessToken', accessToken);
    },

};

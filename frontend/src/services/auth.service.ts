import api from './api';
import { User } from '../types/user';
import { RegisterFormData, LoginFormData } from '../schemas/auth.schema';

export const authService = {
    async register(data: RegisterFormData): Promise<{ user: User }> {
        const response = await api.post('/auth/register', data);
        return response.data.data;
    },

    async login(data: LoginFormData): Promise<{ user: User }> {
        const response = await api.post('/auth/login', data);
        return response.data.data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    async getCurrentUser(): Promise<{ user: User }> {
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    async refreshToken(): Promise<void> {
        await api.post('/auth/refresh');
    },
};

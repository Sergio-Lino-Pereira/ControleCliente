import api from './api';

export const agendaService = {
    // Restricted
    async updateSlug(slug: string) {
        const response = await api.put('/schedule/slug', { slug });
        return response.data;
    },
    async updateWhatsapp(whatsapp: string) {
        const response = await api.put('/schedule/whatsapp', { whatsapp });
        return response.data;
    },
    async getBusinessHours() {
        const response = await api.get('/schedule/business-hours');
        return response.data;
    },
    async updateBusinessHours(hours: any[]) {
        const response = await api.put('/schedule/business-hours', { hours });
        return response.data;
    },
    async getAppointments(date?: string) {
        const url = date ? `/schedule/appointments?date=${date}` : '/schedule/appointments';
        const response = await api.get(url);
        return response.data;
    },
    async updateAppointmentStatus(id: string, status: string) {
        const response = await api.put(`/schedule/appointments/${id}/status`, { status });
        return response.data;
    },
    async updateSettings(settings: { showInDirectory?: boolean; autoConfirm?: boolean }) {
        const response = await api.put('/schedule/settings', settings);
        return response.data;
    },
    async getUserServices() {
        const response = await api.get('/schedule/services');
        return response.data;
    },
    async updateUserServices(services: { name: string; price: string; duration: number }[]) {
        const response = await api.put('/schedule/services', { services });
        return response.data;
    },



    // Public
    async getProfessionalsList() {
        const response = await api.get('/public/booking');
        return response.data;
    },
    async getProfessional(slug: string) {
        const response = await api.get(`/public/booking/${slug}`);
        return response.data;
    },
    async getAvailability(slug: string, date: string, duration?: number) {
        const url = duration 
            ? `/public/booking/${slug}/availability?date=${date}&duration=${duration}` 
            : `/public/booking/${slug}/availability?date=${date}`;
        const response = await api.get(url);
        return response.data;
    },
    async getMonthAvailability(slug: string, year: number, month: number) {
        const response = await api.get(`/public/booking/${slug}/availability/month?year=${year}&month=${month}`);
        return response.data;
    },
    async createAppointment(slug: string, data: { date: string, startTime: string, clientName: string, clientEmail: string, clientWhatsapp: string, serviceId?: string }) {
        const response = await api.post(`/public/booking/${slug}`, data);
        return response.data;
    },

    // Lookup
    async getProfessions() {
        const response = await api.get('/professions');
        return response.data;
    },
    async getProfessionServices(professionId: string) {
        const response = await api.get(`/professions/${professionId}/services`);
        return response.data;
    }
};

import api from './api';
import { ContactFormData } from '../schemas/contact.schema';

export const contactService = {
    async sendMessage(data: ContactFormData): Promise<void> {
        await api.post('/contact', data);
    },
};

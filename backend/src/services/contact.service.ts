import { ContactInput } from '../schemas/contact.schema';
import prisma from '../lib/prisma';

export class ContactService {
    async createContactMessage(data: ContactInput) {
        const message = await prisma.contactMessage.create({
            data: {
                name: data.name,
                email: data.email,
                message: data.message,
            },
        });

        return message;
    }
}

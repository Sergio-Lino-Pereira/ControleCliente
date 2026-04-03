import { PrismaClient } from '@prisma/client';
import { ContactInput } from '../schemas/contact.schema';

const prisma = new PrismaClient();

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

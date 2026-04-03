import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { logger } from '../utils/logger.util';

const contactService = new ContactService();

export class ContactController {
    async createContact(req: Request, res: Response) {
        try {
            const message = await contactService.createContactMessage(req.body);

            logger.info('Contact message created', { email: message.email });

            res.status(201).json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                data: { id: message.id },
            });
        } catch (error) {
            logger.error('Contact creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao enviar mensagem',
            });
        }
    }
}

import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { validate } from '../middleware/validation.middleware';
import { contactSchema } from '../schemas/contact.schema';

const router = Router();
const contactController = new ContactController();

router.post(
    '/',
    validate(contactSchema),
    contactController.createContact.bind(contactController)
);

export default router;

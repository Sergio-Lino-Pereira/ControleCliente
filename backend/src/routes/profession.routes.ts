import { Router } from 'express';
import { ProfessionController } from '../controllers/profession.controller';

const router = Router();
const professionController = new ProfessionController();

// Public routes — no auth required
router.get('/', professionController.listProfessions.bind(professionController));
router.get('/:id/services', professionController.listServices.bind(professionController));

export default router;

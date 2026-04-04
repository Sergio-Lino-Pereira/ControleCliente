import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication + admin check is done in controller
router.get('/users', authenticate, adminController.listUsers.bind(adminController));
router.delete('/users/:id', authenticate, adminController.deleteUser.bind(adminController));

export default router;

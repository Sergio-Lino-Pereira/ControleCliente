import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import contactRoutes from './contact.routes';
import scheduleRoutes from './schedule.routes';
import bookingRoutes from './booking.routes';
import adminRoutes from './admin.routes';
import professionRoutes from './profession.routes';

const router = Router();
const healthController = new HealthController();

// Health check
router.get('/health', healthController.check.bind(healthController));

// API routes
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/public/booking', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/professions', professionRoutes);

export default router;

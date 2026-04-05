import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const scheduleController = new ScheduleController();

router.use(authenticate); // Protected routes

router.put('/slug', scheduleController.updateSlug.bind(scheduleController));
router.put('/whatsapp', scheduleController.updateWhatsapp.bind(scheduleController));
router.get('/business-hours', scheduleController.getBusinessHours.bind(scheduleController));
router.put('/business-hours', scheduleController.updateBusinessHours.bind(scheduleController));
router.get('/appointments', scheduleController.getAppointments.bind(scheduleController));
router.put('/appointments/:id/status', scheduleController.updateAppointmentStatus.bind(scheduleController));
router.put('/settings', scheduleController.updateSettings.bind(scheduleController));

export default router;

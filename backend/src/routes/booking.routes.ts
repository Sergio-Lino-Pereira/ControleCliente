import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();
const bookingController = new BookingController();

router.get('/', bookingController.getProfessionalsList.bind(bookingController));
router.get('/:slug', bookingController.getProfessional.bind(bookingController));
router.get('/:slug/availability/month', bookingController.getMonthAvailability.bind(bookingController));
router.get('/:slug/availability', bookingController.getAvailability.bind(bookingController));
router.post('/:slug', bookingController.createAppointment.bind(bookingController));

export default router;

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/security.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    authController.register.bind(authController)
);

router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    authController.login.bind(authController)
);

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

export default router;

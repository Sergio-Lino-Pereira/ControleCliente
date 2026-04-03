import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const setupSecurity = (app: Express) => {
    // Helmet for security headers
    app.use(helmet());

    // CORS configuration
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true, // Allow cookies
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );
};

// Rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Muitas tentativas. Por favor, tente novamente em 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

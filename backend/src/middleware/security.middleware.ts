import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

export const setupSecurity = (app: Express) => {
    // Helmet for security headers
    app.use(helmet());

    // Configuração de CORS - MODO PERMISSIVO PARA TESTE DEFINITIVO
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'bypass-tunnel-reminder'],
        maxAge: 86400 // Cache preflight response for 24h
    }));

    console.log('✅ Modo de Segurança CORS ajustado para permissão total.');

};

// Rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Muitas tentativas. Por favor, tente novamente em 30 segundos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

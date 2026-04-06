import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { logger } from '../utils/logger.util';

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Check for token in Authorization header (Bearer <token>)
        // 2. Fallback to httpOnly cookie
        let token = req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : req.cookies?.accessToken;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Não autenticado. Por favor, faça login.',
            });
            return;
        }


        // Verify token
        const payload = verifyAccessToken(token);

        // Attach user to request
        req.user = {
            id: payload.id,
            email: payload.email,
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado. Por favor, faça login novamente.',
        });
        return;
    }
};

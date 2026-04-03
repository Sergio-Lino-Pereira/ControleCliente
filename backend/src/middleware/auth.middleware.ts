import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { logger } from '../utils/logger.util';

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from httpOnly cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Não autenticado. Por favor, faça login.',
            });
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
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado. Por favor, faça login novamente.',
        });
    }
};

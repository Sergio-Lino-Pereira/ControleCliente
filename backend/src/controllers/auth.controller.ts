import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger.util';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt.util';

const authService = new AuthService();

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body);

            logger.auth('User registered successfully', user.email);

            res.status(201).json({
                success: true,
                message: 'Usuário cadastrado com sucesso',
                data: { user },
            });
        } catch (error) {
            logger.error('Registration error:', error);

            if (error instanceof Error) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Erro ao cadastrar usuário',
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const result = await authService.login(req.body);

            // Set httpOnly cookies
            res.cookie('accessToken', result.accessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            res.cookie('refreshToken', result.refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            logger.auth('User logged in successfully', result.user.email);

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: { user: result.user },
            });
        } catch (error) {
            logger.auth('Login failed', req.body.email);
            logger.error('Login error:', error);

            if (error instanceof Error && error.message === 'Email ou senha inválidos') {
                res.status(401).json({
                    success: false,
                    message: error.message,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Erro ao fazer login',
            });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            // Clear cookies
            res.clearCookie('accessToken', COOKIE_OPTIONS);
            res.clearCookie('refreshToken', COOKIE_OPTIONS);

            logger.auth('User logged out', req.user?.email);

            res.json({
                success: true,
                message: 'Logout realizado com sucesso',
            });
        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao fazer logout',
            });
        }
    }

    async me(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Não autenticado',
                });
                return;
            }

            const user = await authService.getUserById(req.user.id);

            res.json({
                success: true,
                data: { user },
            });
        } catch (error) {
            logger.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar dados do usuário',
            });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token não encontrado',
                });
                return;
            }

            // Verify refresh token
            const payload = verifyRefreshToken(refreshToken);

            // Generate new access token
            const newAccessToken = generateAccessToken({
                id: payload.id,
                email: payload.email,
            });

            // Set new access token cookie
            res.cookie('accessToken', newAccessToken, {
                ...COOKIE_OPTIONS,
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            logger.auth('Token refreshed', payload.email);

            res.json({
                success: true,
                message: 'Token renovado com sucesso',
            });
        } catch (error) {
            logger.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                message: 'Refresh token inválido ou expirado',
            });
        }
    }
}

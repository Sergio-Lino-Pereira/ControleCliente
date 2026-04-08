import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { generateSlug } from '../utils/slug.util';

const SALT_ROUNDS = 12;
const OUTRAS_CATEGORY = 'Outros';

export class AuthService {
    async register(data: RegisterInput) {
        // Check if user already exists by email, name, or whatsapp
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { name: data.name },
                    { whatsapp: data.whatsapp }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === data.email) {
                throw new Error('Email já cadastrado');
            }
            if (existingUser.whatsapp === data.whatsapp) {
                throw new Error('Este Whatsapp já está cadastrado em outro perfil');
            }
            if (existingUser.name === data.name) {
                throw new Error('Já existe um profissional com este mesmo nome');
            }
            throw new Error('Usuário já cadastrado');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Determine status: Outros category requires admin approval
        const status = data.category === OUTRAS_CATEGORY ? 'PENDING_APPROVAL' : 'ACTIVE';

        // Create user
        const user = await (prisma.user as any).create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                whatsapp: data.whatsapp,
                profession: data.profession || null,
                category: data.category || null,
                status,
                slug: generateSlug(data.name),
                services: data.services ? {
                    create: data.services.map(s => ({
                        name: s.name,
                        price: s.price ? parseFloat(s.price) : null
                    }))
                } : undefined
            },
            select: {
                id: true,
                name: true,
                email: true,
                profession: true,
                category: true,
                status: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
        
        return { user, accessToken, refreshToken };
    }

    async login(data: LoginInput) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new Error('Email ou senha inválidos');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error('Email ou senha inválidos');
        }

        // Generate tokens
        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        };
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                profession: true,
                category: true,
                status: true,
                showInDirectory: true,
                autoConfirm: true,
                whatsapp: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }
}

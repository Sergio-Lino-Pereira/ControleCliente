import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

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

        // Create user
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                whatsapp: data.whatsapp
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return user;
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
                createdAt: true,
            },
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        return user;
    }
}

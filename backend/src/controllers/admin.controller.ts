import { Request, Response } from 'express';
import prisma from '../lib/prisma';
const ADMIN_EMAIL = 'linopereira.sergio@gmail.com';

export class AdminController {
    async listUsers(_req: Request, res: Response) {
        try {
            const users = await (prisma.user as any).findMany({
                where: { email: { not: ADMIN_EMAIL } },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    whatsapp: true,
                    createdAt: true,
                    slug: true,
                    status: true,
                    category: true,
                    profession: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return res.json({ success: true, data: { users } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao listar usuários' });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = id as string;

            // Safety: never delete the admin itself
            const target = await prisma.user.findUnique({ where: { id: userId } });
            if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            if (target.email === ADMIN_EMAIL) {
                return res.status(403).json({ success: false, message: 'Não é possível excluir o administrador' });
            }

            await prisma.user.delete({ where: { id: userId } });

            return res.json({ success: true, message: 'Profissional excluído com sucesso' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao excluir usuário' });
        }
    }

    async approveUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await (prisma.user as any).update({
                where: { id: id as string },
                data: { status: 'ACTIVE' },
            });
            return res.json({ success: true, message: 'Profissional aprovado com sucesso' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao aprovar usuário' });
        }
    }
}

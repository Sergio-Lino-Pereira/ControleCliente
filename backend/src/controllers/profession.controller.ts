import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProfessionController {
    // GET /api/professions — list all professions grouped by category
    async listProfessions(_req: Request, res: Response) {
        try {
            const professions = await prisma.profession.findMany({
                orderBy: [{ category: 'asc' }, { name: 'asc' }],
                select: {
                    id: true,
                    name: true,
                    category: true,
                },
            });
            return res.json({ success: true, data: { professions } });
        } catch {
            return res.status(500).json({ success: false, message: 'Erro ao listar profissões' });
        }
    }

    // GET /api/professions/:id/services — get default services for a profession
    async listServices(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profession = await prisma.profession.findUnique({
                where: { id: id as string },
                include: { services: true },
            });
            if (!profession) return res.status(404).json({ success: false, message: 'Profissão não encontrada' });
            return res.json({ success: true, data: { services: profession.services } });
        } catch {
            return res.status(500).json({ success: false, message: 'Erro ao listar serviços' });
        }
    }
}

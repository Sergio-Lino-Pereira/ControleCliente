import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class ProfessionController {
    // GET /api/professions — list all professions grouped by category
    async listProfessions(_req: Request, res: Response) {
        try {
            const professions = await (prisma as any).profession.findMany({
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
            const services = await (prisma as any).professionService.findMany({
                where: { professionId: id as string },
            });
            return res.json({ success: true, data: { services } });
        } catch {
            return res.status(500).json({ success: false, message: 'Erro ao listar serviços' });
        }
    }
}

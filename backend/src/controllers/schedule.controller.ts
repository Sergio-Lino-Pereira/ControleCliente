import { Request, Response } from 'express';
import { ScheduleService } from '../services/schedule.service';
import prisma from '../lib/prisma';

const scheduleService = new ScheduleService();

export class ScheduleController {
    async updateSlug(req: Request, res: Response) {
        try {
            const { slug } = req.body;
            if (!slug) return res.status(400).json({ success: false, message: 'Slug é obrigatório' });

            const user = await scheduleService.updateSlug(req.user!.id, slug);
            return res.json({ success: true, data: { slug: user.slug } });
        } catch (error) {
            console.error('[ScheduleController] Erro ao atualizar slug:', error);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar slug (já pode estar em uso)' });
        }
    }

    async updateWhatsapp(req: Request, res: Response) {
        try {
            const { whatsapp } = req.body;
            await scheduleService.updateWhatsapp(req.user!.id, whatsapp);
            return res.json({ success: true, message: 'WhatsApp atualizado' });
        } catch (error) {
            console.error('Update WhatsApp Error:', error);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar WhatsApp' });
        }
    }

    async getBusinessHours(req: Request, res: Response) {
        try {
            const hours = await scheduleService.getBusinessHours(req.user!.id);
            const user = await (prisma.user as any).findUnique({ where: { id: req.user!.id } });
            
            return res.json({
                success: true,
                data: {
                    hours,
                    slug: user?.slug,
                    whatsapp: user?.whatsapp || null,
                    showInDirectory: user?.showInDirectory ?? true,
                    autoConfirm: user?.autoConfirm ?? false,
                    profession: user?.profession || null,
                    category: user?.category || null,
                }
            });
        } catch (error) {
            console.error('[ScheduleController] Erro no getBusinessHours:', error);
            return res.status(500).json({ success: false, message: 'Erro ao buscar horários' });
        }
    }

    async updateBusinessHours(req: Request, res: Response) {
        try {
            const { hours } = req.body; // array of { dayOfWeek, startTime, endTime }
            const updated = await scheduleService.updateBusinessHours(req.user!.id, hours);
            return res.json({ success: true, data: { hours: updated } });
        } catch (error) {
            console.error('[ScheduleController] Erro no updateBusinessHours:', error);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar horários' });
        }
    }

    async getAppointments(req: Request, res: Response) {
        try {
            const dateStr = req.query.date as string | undefined;
            const appointments = await scheduleService.getAppointments(req.user!.id, dateStr);
            return res.json({ success: true, data: { appointments } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar agendamentos' });
        }
    }

    async updateAppointmentStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await scheduleService.updateAppointmentStatus(req.user!.id, id as string, status);
            return res.json({ success: true, data: { appointment: updated } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar agendamento' });
        }
    }

    async updateSettings(req: Request, res: Response) {
        try {
            const { showInDirectory, autoConfirm } = req.body;
            await prisma.user.update({
                where: { id: req.user!.id },
                data: {
                    ...(showInDirectory !== undefined ? { showInDirectory } : {}),
                    ...(autoConfirm !== undefined ? { autoConfirm } : {}),
                },
            });
            return res.json({ success: true, message: 'Configurações atualizadas' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar configurações' });
        }
    }

    async getUserServices(req: Request, res: Response) {
        try {
            const services = await (prisma as any).userService.findMany({
                where: { userId: req.user!.id }
            });
            return res.json({ success: true, data: { services } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar serviços' });
        }
    }

    async updateUserServices(req: Request, res: Response) {
        try {
            const { services } = req.body;
            await (prisma as any).userService.deleteMany({ where: { userId: req.user!.id } });
            await (prisma as any).userService.createMany({
                data: services.map((s: any) => ({
                    userId: req.user!.id,
                    name: s.name,
                    price: s.price ? parseFloat(s.price.toString().replace(',', '.')) : null,
                    duration: s.duration ? parseInt(s.duration.toString()) : 30
                }))
            });
            return res.json({ success: true, message: 'Serviços atualizados com sucesso' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar serviços' });
        }
    }
}

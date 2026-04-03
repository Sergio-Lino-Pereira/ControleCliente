import { PrismaClient } from '@prisma/client';
import { WhatsappService } from './whatsapp.service';

const prisma = new PrismaClient();
const whatsappService = new WhatsappService();

export class ScheduleService {
    async updateSlug(userId: string, slug: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { slug },
        });
    }

    async updateWhatsapp(userId: string, whatsapp: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { whatsapp }
        });
    }

    async getBusinessHours(userId: string) {
        return prisma.businessHours.findMany({
            where: { userId },
            orderBy: { dayOfWeek: 'asc' },
        });
    }

    async updateBusinessHours(userId: string, hours: any[]) {
        // delete all existing and insert new
        await prisma.businessHours.deleteMany({ where: { userId } });
        if (hours.length > 0) {
            await prisma.businessHours.createMany({
                data: hours.map(h => ({
                    userId,
                    dayOfWeek: h.dayOfWeek,
                    startTime: h.startTime,
                    endTime: h.endTime,
                    whatsappEnabled: h.whatsappEnabled ?? false
                })),
            });
        }
        return this.getBusinessHours(userId);
    }

    async getAppointments(userId: string, dateStr?: string) {
        const where: any = { userId };
        if (dateStr) {
            const [year, month, day] = dateStr.split('-');
            where.date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return prisma.appointment.findMany({
            where,
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async updateAppointmentStatus(userId: string, appointmentId: string, status: string) {
        // verify ownership first
        const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
        if (!appt || appt.userId !== userId) throw new Error('Not authorized or not found');

        const updatedAppt = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status },
        });

        // Automated WhatsApp Message
        if (updatedAppt.clientWhatsapp) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && updatedAppt) {
                const dateStr = updatedAppt.date.toISOString().split('T')[0].split('-').reverse().join('/');
                const isApproval = status === 'CONFIRMED';
                let msg = '';
                
                if (isApproval) {
                    msg = `Olá ${updatedAppt.clientName}, seu agendamento com ${user.name} para o dia ${dateStr} às ${updatedAppt.startTime} foi confirmado!`;
                } else if (status === 'CANCELLED') {
                    msg = `Olá ${updatedAppt.clientName}, infelizmente seu agendamento com ${user.name} para o dia ${dateStr} às ${updatedAppt.startTime} não pode ser confirmado. Tente um novo horário ou entre em contato.`;
                }

                if (msg) {
                    await whatsappService.sendMessage(updatedAppt.clientWhatsapp, msg);
                }
            }
        }

        return updatedAppt;
    }
}

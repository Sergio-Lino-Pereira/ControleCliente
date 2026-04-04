import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';

const bookingService = new BookingService();

export class BookingController {
    async getProfessionalsList(_req: Request, res: Response) {
        try {
            const professionals = await bookingService.getProfessionalsList();
            return res.json({ success: true, data: { professionals } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao listar profissionais' });
        }
    }

    async getProfessional(req: Request, res: Response) {
        try {
            const user = await bookingService.getProfessionalBySlug(req.params.slug as string);
            if (!user) return res.status(404).json({ success: false, message: 'Profissional não encontrado' });
            return res.json({ success: true, data: { professional: user } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar profissional' });
        }
    }

    async getAvailability(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const { date } = req.query; // YYYY-MM-DD
            if (!date) return res.status(400).json({ success: false, message: 'Data é obrigatória' });

            const slots = await bookingService.getAvailability(slug as string, date as string);
            return res.json({ success: true, data: { slots } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar disponibilidade' });
        }
    }

    async getMonthAvailability(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const { year, month } = req.query; // YYYY, MM
            if (!year || !month) return res.status(400).json({ success: false, message: 'Ano e mês são obrigatórios' });

            const availability = await bookingService.getMonthAvailability(slug as string, parseInt(year as string), parseInt(month as string));
            return res.json({ success: true, data: { availability } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar disponibilidade mensal' });
        }
    }

    async createAppointment(req: Request, res: Response) {
        try {
            const { date, startTime, clientName, clientEmail, clientWhatsapp } = req.body;
            const appointment = await bookingService.createAppointment(req.params.slug as string, {
                date, startTime, clientName, clientEmail, clientWhatsapp
            });
            return res.status(201).json({ success: true, data: { appointment } });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: 'Erro ao criar agendamento' });
        }
    }
}

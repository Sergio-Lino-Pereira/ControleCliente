import { PrismaClient } from '@prisma/client';
import { WhatsappService } from './whatsapp.service';

const prisma = new PrismaClient();
const whatsappService = new WhatsappService();

export class BookingService {
    async getProfessionalsList() {
        const rawUsers = await prisma.$queryRaw<any[]>`
            SELECT id, name, slug, whatsapp, profession, category, 
                   show_in_directory as "showInDirectory", 
                   auto_confirm as "autoConfirm",
                   status
            FROM users 
            WHERE slug IS NOT NULL
        `;
        return rawUsers;
    }

    async getProfessionalBySlug(slug: string) {
        const user = await prisma.user.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
            }
        });
        if (!user) return null;
        
        const rawUsers = await prisma.$queryRaw<any[]>`SELECT whatsapp, auto_confirm as "autoConfirm" FROM users WHERE slug = ${slug} LIMIT 1`;
        return {
            ...user,
            whatsapp: rawUsers[0]?.whatsapp || null,
            autoConfirm: rawUsers[0]?.autoConfirm || false
        };
    }

    async getAvailability(slug: string, dateStr: string) {
        const user = await this.getProfessionalBySlug(slug);
        if (!user) throw new Error('Professional not found');

        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayOfWeek = date.getDay(); // 0-6

        const businessHours = await prisma.businessHours.findMany({
            where: { userId: user.id, dayOfWeek }
        });

        if (businessHours.length === 0) return []; // Not working on this day

        const slots: { time: string, whatsappEnabled: boolean }[] = [];
        const now = new Date();
        const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

        for (const bh of businessHours) {
            const [startH, startM] = bh.startTime.split(':').map(Number);
            const [endH, endM] = bh.endTime.split(':').map(Number);
            
            let currentMinutes = (startH || 0) * 60 + (startM || 0);
            const endMinutes = (endH || 0) * 60 + (endM || 0);
            
            while (currentMinutes + 30 <= endMinutes) {
                const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                const m = (currentMinutes % 60).toString().padStart(2, '0');
                const slotTime = `${h}:${m}`;

                if (!isToday || new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(h), parseInt(m)) > now) {
                    slots.push({ time: slotTime, whatsappEnabled: bh.whatsappEnabled });
                }
                currentMinutes += 30; // 30-minute slots
            }
        }

        const uniqueSlots: typeof slots = [];
        const seen = new Set();
        for (const s of slots) {
            if (!seen.has(s.time)) {
                seen.add(s.time);
                uniqueSlots.push(s);
            }
        }
        uniqueSlots.sort((a,b) => a.time.localeCompare(b.time));

        // fetch existing appointments to filter out
        const appointments = await prisma.appointment.findMany({
            where: {
                userId: user.id,
                date: date,
                status: { in: ['CONFIRMED', 'PENDING', 'CANCELLED'] } // Cancelled now blocks the slot
            }
        });

        const blockedStarts = appointments.filter(a => ['CONFIRMED', 'CANCELLED'].includes(a.status)).map(a => a.startTime);
        const pendingStarts = appointments.filter(a => a.status === 'PENDING').map(a => a.startTime);

        const availableSlots = [];
        for (const slot of uniqueSlots) {
            const isBlocked = blockedStarts.includes(slot.time);
            availableSlots.push({
                time: slot.time,
                whatsappEnabled: slot.whatsappEnabled,
                hasPending: pendingStarts.includes(slot.time),
                isAvailable: !isBlocked
            });
        }
        return availableSlots;
    }

    async getMonthAvailability(slug: string, year: number, month: number) {
        const user = await this.getProfessionalBySlug(slug);
        if (!user) throw new Error('Professional not found');

        const businessHoursConfig = await prisma.businessHours.findMany({
            where: { userId: user.id }
        });

        // Create a map of dayOfWeek to business hours configuration arrays
        const hoursMap = new Map();
        for (const bh of businessHoursConfig) {
            if (!hoursMap.has(bh.dayOfWeek)) {
                hoursMap.set(bh.dayOfWeek, []);
            }
            hoursMap.get(bh.dayOfWeek).push(bh);
        }

        // Get start and end of the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const appointments = await prisma.appointment.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['CONFIRMED', 'PENDING', 'CANCELLED'] } // CANCELLED now blocks
            }
        });

        const availability = [];

        for (let d = 1; d <= endDate.getDate(); d++) {
            const date = new Date(year, month - 1, d);
            const dayOfWeek = date.getDay();
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            const bhs = hoursMap.get(dayOfWeek);
            if (!bhs || bhs.length === 0) {
                availability.push({ date: dateStr, isWorkingDay: false, availableSlots: 0 });
                continue;
            }

            let slots: string[] = [];
            const now = new Date();
            const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

            for (const bh of bhs) {
                const [startH, startM] = bh.startTime.split(':').map(Number);
                const [endH, endM] = bh.endTime.split(':').map(Number);
                
                let currentMinutes = (startH || 0) * 60 + (startM || 0);
                const endMinutes = (endH || 0) * 60 + (endM || 0);
                
                while (currentMinutes + 30 <= endMinutes) {
                    const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                    const m = (currentMinutes % 60).toString().padStart(2, '0');
                    const slotTime = `${h}:${m}`;

                    // Check if the slot is in the past for today
                    if (!isToday || new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(h), parseInt(m)) > now) {
                        slots.push(slotTime);
                    }
                    currentMinutes += 30; // 30-minute slots
                }
            }

            // Also check for CANCELLED since it blocks the slots now
            const bookedTimes = appointments
                .filter(a => a.date.toDateString() === date.toDateString() && ['CONFIRMED', 'CANCELLED'].includes(a.status))
                .map(a => a.startTime);
            
            const availableSlotsCount = slots.filter(slot => !bookedTimes.includes(slot)).length;

            availability.push({
                date: dateStr,
                isWorkingDay: true,
                availableSlots: availableSlotsCount
            });
        }

        return availability;
    }

    async createAppointment(slug: string, data: { date: string, startTime: string, clientName: string, clientEmail: string, clientWhatsapp: string }) {
        const user = await this.getProfessionalBySlug(slug);
        if (!user) throw new Error('Professional not found');

        const [year, month, day] = data.date.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Check for active existing appointments for this client
        const todayStr = new Date().toISOString().split('T')[0];
        const [tyear, tmonth, tday] = todayStr.split('-');
        const today = new Date(parseInt(tyear), parseInt(tmonth) - 1, parseInt(tday));

        const existingAppt = await prisma.appointment.findFirst({
            where: {
                clientWhatsapp: data.clientWhatsapp,
                status: { in: ['CONFIRMED', 'PENDING'] },
                date: { gte: today }
            }
        });

        if (existingAppt) {
            throw new Error(`Este número de WhatsApp já possui um agendamento ativo para o dia ${existingAppt.date.toISOString().split('T')[0].split('-').reverse().join('/')}. Aguarde a conclusão ou cancele-o para agendar novamente.`);
        }

        let endTimeStr = '23:59';
        const startH = parseInt(data.startTime.split(':')[0]);
        endTimeStr = `${(startH + 1).toString().padStart(2, '0')}:${data.startTime.split(':')[1]}`;

        const newAppt = await prisma.appointment.create({
            data: {
                userId: user.id,
                date: date,
                startTime: data.startTime,
                endTime: endTimeStr,
                clientName: data.clientName,
                clientEmail: data.clientEmail,
                clientWhatsapp: data.clientWhatsapp,
                status: user.autoConfirm ? 'CONFIRMED' : 'PENDING'
            }
        });

        const dateStr = date.toISOString().split('T')[0].split('-').reverse().join('/');

        // Notify Professional via WhatsApp
        if (user.whatsapp) {
            const msg = user.autoConfirm 
                ? `Olá ${user.name},\n✅ *Agendamento Confirmado!*\nCliente: *${data.clientName}*\nData: *${dateStr} às ${data.startTime}*.`
                : `Olá ${user.name},\nVocê tem uma nova solicitação de agendamento de *${data.clientName}* para o dia *${dateStr} às ${data.startTime}*.\nPor favor, acesse o painel para confirmar.`;
            await whatsappService.sendMessage(user.whatsapp, msg);
        }

        // Notify Client if auto-confirmed
        if (user.autoConfirm && data.clientWhatsapp) {
            const clientMsg = `Olá ${data.clientName},\nSeu agendamento com *${user.name}* para o dia *${dateStr} às ${data.startTime}* foi *CONFIRMADO* com sucesso!`;
            await whatsappService.sendMessage(data.clientWhatsapp, clientMsg);
        }

        return newAppt;
    }
}

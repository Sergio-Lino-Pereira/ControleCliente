import { PrismaClient } from '@prisma/client';
import { ScheduleService } from './src/services/schedule.service';

const prisma = new PrismaClient();
const service = new ScheduleService();

async function test() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) return console.error('No users in DB');
        
        console.log(`Testing with user: ${user.id}`);
        
        console.log('Testing updateSlug...');
        await service.updateSlug(user.id, 'teste-slug');
        console.log('updateSlug OK');

        console.log('Testing updateWhatsapp...');
        await service.updateWhatsapp(user.id, '5511999999999');
        console.log('updateWhatsapp OK');

        console.log('Testing updateBusinessHours...');
        await service.updateBusinessHours(user.id, [
            { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', whatsappEnabled: false }
        ]);
        console.log('updateBusinessHours OK');
        
    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();

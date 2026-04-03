import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['info', 'warn', 'error'] });

async function test() {
    try {
        console.log('Testing connection to DB...');
        const userCount = await prisma.user.count();
        console.log(`Connection successful! Users in DB: ${userCount}`);
        const user = await prisma.user.findFirst();
        if (user) {
            console.log('Updating slug for user:', user.id);
            await prisma.user.update({
                where: { id: user.id },
                data: { slug: 'test-slug-' + Date.now() }
            });
            console.log('Update success!');
        }
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();

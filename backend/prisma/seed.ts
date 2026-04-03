import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create test user
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    const testUser = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            name: 'Test User',
            email: 'test@example.com',
            passwordHash: hashedPassword,
        },
    });

    console.log('✅ Test user created:', testUser.email);
    console.log('   Password: Test123!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

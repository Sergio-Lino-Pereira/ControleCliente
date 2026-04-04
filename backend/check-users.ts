import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Usuários ativos no banco:');
    for (const u of users) {
        console.log(`- Nome: ${u.name} | Email: ${u.email}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

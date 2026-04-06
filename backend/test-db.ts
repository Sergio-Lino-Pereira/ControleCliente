import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Total de usuários no banco: ${userCount}`);
    
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('Últimos 5 usuários:');
    console.table(users);
  } catch (error) {
    console.error('Erro ao acessar o banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

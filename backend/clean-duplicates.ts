import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Procurando profissionais duplicados...');
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const seen = new Set();
  let deletedCount = 0;

  for (const user of users) {
    const key = user.name?.toLowerCase().trim() || user.email; // Identify duplicates by name
    if (seen.has(key)) {
      console.log(`Deletando duplicado: ${user.name} (${user.email}) - ID: ${user.id}`);
      
      // Delete their appointments first (cascade normally, but just to be sure)
      await prisma.appointment.deleteMany({
        where: { userId: user.id }
      });

      // Delete their business hours
      await prisma.businessHours.deleteMany({
        where: { userId: user.id }
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });

      deletedCount++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Concluído! ${deletedCount} perfil(is) duplicado(s) removido(s) com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      isAdmin: true,
      profession: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

checkUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

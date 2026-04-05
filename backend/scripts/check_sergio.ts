import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'linopereira.sergio@gmail.com' }
  });
  console.log(JSON.stringify(user, null, 2));
}

checkUser()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

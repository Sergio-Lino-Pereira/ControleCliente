import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkColumns() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `;
  console.log(JSON.stringify(result, null, 2));
}

checkColumns()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

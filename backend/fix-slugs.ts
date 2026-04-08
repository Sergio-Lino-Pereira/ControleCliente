import prisma from './src/lib/prisma';
import { generateSlug } from './src/utils/slug.util';

async function main() {
  const users = await prisma.user.findMany({
    where: { slug: null }
  });

  console.log(`Encontrados ${users.length} usuários sem slug.`);

  for (const user of users) {
    const slug = generateSlug(user.name);
    await prisma.user.update({
      where: { id: user.id },
      data: { slug }
    });
    console.log(`Slug gerado para ${user.name}: ${slug}`);
  }

  console.log('Finalizado!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

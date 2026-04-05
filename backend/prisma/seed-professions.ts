import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const professions = [
  // Saúde
  { name: 'Médico', category: 'Saúde', services: ['Consulta Clínica', 'Retorno', 'Teleconsulta', 'Atestado Médico'] },
  { name: 'Dentista', category: 'Saúde', services: ['Limpeza Dental', 'Consulta', 'Clareamento', 'Canal', 'Restauração'] },
  { name: 'Psicólogo', category: 'Saúde', services: ['Sessão Individual', 'Sessão de Casal', 'Avaliação Psicológica', 'Terapia Online'] },
  { name: 'Fisioterapeuta', category: 'Saúde', services: ['Avaliação Fisioterapêutica', 'Sessão de Fisioterapia', 'Pilates Terapêutico', 'RPG'] },
  { name: 'Fonoaudiólogo', category: 'Saúde', services: ['Avaliação Fonoaudiológica', 'Sessão de Terapia', 'Disfagia', 'Motricidade Orofacial'] },

  // Educação
  { name: 'Professor Particular', category: 'Educação', services: ['Aula de Reforço', 'Prova e Vestibular', 'Idiomas', 'Concurso Público'] },
  { name: 'Coach Educacional', category: 'Educação', services: ['Orientação de Estudos', 'Plano de Carreiras', 'Mentoria Acadêmica'] },
  { name: 'Orientador Vocacional', category: 'Educação', services: ['Teste Vocacional', 'Sessão de Orientação', 'Plano de Carreira'] },

  // Beleza
  { name: 'Cabeleireiro', category: 'Beleza', services: ['Corte', 'Coloração', 'Escova Progressiva', 'Hidratação', 'Penteado'] },
  { name: 'Manicure & Pedicure', category: 'Beleza', services: ['Manicure', 'Pedicure', 'Esmaltação em Gel', 'Unhas de Fibra'] },
  { name: 'Esteticista', category: 'Beleza', services: ['Limpeza de Pele', 'Peeling', 'Drenagem Linfática', 'Massagem Relaxante'] },
  { name: 'Barbeiro', category: 'Beleza', services: ['Corte Masculino', 'Barba', 'Corte + Barba', 'Progressiva Masculina'] },

  // Nutrição
  { name: 'Nutricionista', category: 'Nutrição', services: ['Consulta Nutricional', 'Plano Alimentar', 'Acompanhamento Mensal', 'Nutrição Esportiva'] },

  // Negócios & Finanças
  { name: 'Contador', category: 'Negócios & Finanças', services: ['Abertura de Empresa', 'Imposto de Renda', 'Consultoria Contábil', 'Declaração MEI'] },
  { name: 'Advogado', category: 'Negócios & Finanças', services: ['Consulta Jurídica', 'Elaboração de Contratos', 'Processo Trabalhista', 'Divórcio'] },
  { name: 'Consultor de RH', category: 'Negócios & Finanças', services: ['Recrutamento', 'Avaliação de Desempenho', 'Treinamento', 'Cargos e Salários'] },
];

export async function seedProfessions() {
  console.log('🌱 Seeding professions and services...');

  for (const prof of professions) {
    const existing = await prisma.profession.findFirst({ where: { name: prof.name } });
    if (existing) continue;

    await prisma.profession.create({
      data: {
        name: prof.name,
        category: prof.category,
        services: {
          create: prof.services.map(s => ({ name: s })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${professions.length} professions`);
}

async function main() {
  await seedProfessions();
}

main().catch(console.error).finally(() => prisma.$disconnect());

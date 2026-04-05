import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding...');

  // 1. Limpar dados existentes (opcional, cuidado em prod)
  // await prisma.professionService.deleteMany();
  // await prisma.profession.deleteMany();

  const PROFESSIONS_DATA = [
    {
      name: 'Médico',
      category: 'Saúde',
      services: ['Consulta Geral', 'Retorno', 'Telemedicina']
    },
    {
      name: 'Dentista',
      category: 'Saúde',
      services: ['Limpeza', 'Avaliação', 'Clareamento', 'Extração']
    },
    {
      name: 'Fisioterapeuta',
      category: 'Saúde',
      services: ['Sessão de Fisioterapia', 'Avaliação Postural', 'RPG']
    },
    {
      name: 'Psicólogo',
      category: 'Saúde',
      services: ['Terapia Individual', 'Terapia de Casal', 'Avaliação Psicológica']
    },
    {
      name: 'Professor Particular',
      category: 'Educação',
      services: ['Aula de Reforço', 'Preparatório Concursos', 'Aula de Idiomas']
    },
    {
      name: 'Cabeleireiro',
      category: 'Beleza',
      services: ['Corte Masculino', 'Corte Feminino', 'Escova', 'Coloração']
    },
    {
      name: 'Manicure',
      category: 'Beleza',
      services: ['Pé e Mão', 'Alongamento em Gel', 'Esmaltação']
    },
    {
      name: 'Nutricionista',
      category: 'Nutrição',
      services: ['Bioimpedância', 'Plano Alimentar', 'Acompanhamento Esportivo']
    },
    {
      name: 'Personal Trainer',
      category: 'Bem-Estar',
      services: ['Treino Individual', 'Consultoria Online', 'Avaliação Física']
    },
    {
      name: 'Advogado',
      category: 'Jurídico',
      services: ['Consultoria Jurídica', 'Análise de Contratos', 'Audiência']
    },
    {
      name: 'Contador',
      category: 'Negócios & Finanças',
      services: ['Declaração IR', 'Abertura de Empresa', 'Assessoria Mensal']
    },
    {
      name: 'Veterinário',
      category: 'Pets',
      services: ['Consulta Pet', 'Vacinação', 'Castração']
    },
    {
      name: 'Fotógrafo',
      category: 'Eventos',
      services: ['Ensaio Externo', 'Evento Social', 'Cobertura Corporativa']
    },
    {
      name: 'Mecânico',
      category: 'Automotivo',
      services: ['Troca de Óleo', 'Revisão Geral', 'Alinhamento/Balanceamento']
    },
    {
      name: 'Eletricista',
      category: 'Manutenção',
      services: ['Instalação Básica', 'Manutenção Quadro', 'Projeto Elétrico']
    }
  ];

  for (const prof of PROFESSIONS_DATA) {
    const createdProf = await prisma.profession.upsert({
      where: { name: prof.name },
      update: { category: prof.category },
      create: {
        name: prof.name,
        category: prof.category,
      },
    });

    for (const serviceName of prof.services) {
      await prisma.professionService.upsert({
        where: {
          professionId_name: {
            professionId: createdProf.id,
            name: serviceName,
          }
        },
        update: {},
        create: {
          professionId: createdProf.id,
          name: serviceName,
        }
      });
    }
  }

  console.log('Seeding finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

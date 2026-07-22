/**
 * Seed de desenvolvimento do StockManager.
 *
 * Popula um tenant enxuto, mas suficiente para exercitar o fluxo inteiro:
 * um usuário por papel, eventos em PLANNING / IN_PROGRESS / COMPLETED,
 * locações ACTIVE / RETURNED, tarefas de galpão, divergência e manutenção.
 *
 * O estoque não é escrito à mão: `ajustarEstoque` recalcula total e disponível
 * a partir das linhas realmente criadas, então acrescentar um evento ou uma
 * locação aqui não exige refazer conta nenhuma.
 *
 * Como rodar:
 *   cd apps/api && pnpm seed
 *
 * ATENÇÃO: apaga todos os dados do domínio antes de inserir. Só em dev.
 */
require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL não definida. Configure o .env em apps/api.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const TENANT = '11111111-1111-1111-1111-111111111111';
const SENHA = 'senha123';
const ANO = new Date().getFullYear();
const tt = { tenantUuid: TENANT };

// Data relativa a hoje, para o seed nunca "envelhecer".
const dia = (offset, hora = 9) => {
  const data = new Date();
  data.setHours(hora, 0, 0, 0);
  data.setDate(data.getDate() + offset);
  return data;
};

async function limpar() {
  // Ordem respeita as FKs (filhos antes dos pais).
  await prisma.taskItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.divergenceItem.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.divergence.deleteMany();
  await prisma.eventItem.deleteMany();
  await prisma.event.deleteMany();
  await prisma.rentalItem.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Recalcula o estoque a partir do que foi criado, seguindo as regras do domínio:
 *   totalQuantity     = base - perdas registradas em divergência
 *   availableQuantity = total - reservas ativas - manutenção manual em aberto
 *
 * Reserva ativa = itens de eventos PLANNING/IN_PROGRESS e de locações
 * DRAFT/ACTIVE — adicionar item já reserva, independente do status.
 *
 * Por isso a seed só registra divergência em fluxo já encerrado: num fluxo
 * aberto a perda ainda está dentro da reserva e seria contada duas vezes.
 */
async function ajustarEstoque(base) {
  const [perdas, itensEvento, itensLocacao, manutencoes] = await Promise.all([
    prisma.divergenceItem.groupBy({
      by: ['itemId'],
      where: tt,
      _sum: { quantity: true },
    }),
    prisma.eventItem.findMany({
      where: { ...tt, event: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } },
      select: { itemId: true, plannedQuantity: true, returnedQuantity: true },
    }),
    prisma.rentalItem.findMany({
      where: { ...tt, rental: { status: { in: ['DRAFT', 'ACTIVE'] } } },
      select: { itemId: true, quantity: true, returnedQuantity: true },
    }),
    prisma.maintenance.findMany({
      where: { ...tt, divergenceId: null, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
      select: { itemId: true, quantity: true },
    }),
  ]);

  const perdaPorItem = new Map(perdas.map((p) => [p.itemId, p._sum.quantity ?? 0]));
  const reservado = new Map();
  const somar = (itemId, valor) =>
    reservado.set(itemId, (reservado.get(itemId) ?? 0) + valor);

  for (const ei of itensEvento) somar(ei.itemId, ei.plannedQuantity - ei.returnedQuantity);
  for (const ri of itensLocacao) somar(ri.itemId, ri.quantity - ri.returnedQuantity);
  for (const m of manutencoes) somar(m.itemId, m.quantity);

  for (const [itemId, baseTotal] of base) {
    const total = baseTotal - (perdaPorItem.get(itemId) ?? 0);
    await prisma.item.update({
      where: { id: itemId },
      data: { totalQuantity: total, availableQuantity: total - (reservado.get(itemId) ?? 0) },
    });
  }
}

async function main() {
  console.log('Limpando banco...');
  await limpar();

  const password = await bcrypt.hash(SENHA, 10);

  console.log('Criando usuários, categorias, itens e clientes...');
  const [admin, decorador, funcionario] = await Promise.all(
    [
      ['Ana Admin', 'admin@stockmanager.dev', 'ADMIN'],
      ['Diego Decorador', 'decorador@stockmanager.dev', 'DECORADOR'],
      ['Fábio Funcionário', 'funcionario@stockmanager.dev', 'FUNCIONARIO'],
    ].map(([name, email, role]) =>
      prisma.user.create({ data: { name, email, password, role, ...tt } }),
    ),
  );

  const [mobiliario, mesaPosta, iluminacao] = await Promise.all(
    ['Mobiliário', 'Mesa Posta', 'Iluminação'].map((name) =>
      prisma.category.create({ data: { name, ...tt } }),
    ),
  );

  // `base` é o acervo antes de qualquer perda; o disponível sai de ajustarEstoque().
  const catalogo = [
    ['cadeira', 'Cadeira Tiffany', mobiliario.id, 200, 45],
    ['mesa', 'Mesa Redonda 1,5m', mobiliario.id, 30, 120],
    ['taca', 'Taça de Cristal', mesaPosta.id, 400, 12],
    ['prato', 'Prato Raso Porcelana', mesaPosta.id, 300, 18],
    ['cordao', 'Cordão de LED 10m', iluminacao.id, 60, 30],
  ];

  const item = {};
  const baseTotais = new Map();
  for (const [chave, name, categoryId, base, unitCost] of catalogo) {
    item[chave] = await prisma.item.create({
      data: { name, categoryId, unitCost, totalQuantity: base, availableQuantity: base, ...tt },
    });
    baseTotais.set(item[chave].id, base);
  }

  const [bella, corporate] = await Promise.all(
    [
      ['Bella Festas & Eventos', '12.345.678/0001-90', 'Beatriz Lima'],
      ['Corporate Solutions Ltda', '98.765.432/0001-10', 'Carlos Mendes'],
    ].map(([companyName, taxId, contactName]) =>
      prisma.client.create({ data: { companyName, taxId, contactName, ...tt } }),
    ),
  );

  console.log('Criando eventos...');

  // 1) PLANNING — só reserva estoque, nada saiu do galpão ainda.
  await prisma.event.create({
    data: {
      eventName: 'Casamento Maria & João',
      startDate: dia(20, 18),
      endDate: dia(20, 23),
      eventLocation: 'Espaço Villa Garden',
      status: 'PLANNING',
      clientId: bella.id,
      responsibleId: decorador.id,
      ...tt,
      eventItems: {
        create: [
          { plannedQuantity: 60, itemId: item.cadeira.id, ...tt },
          { plannedQuantity: 80, itemId: item.taca.id, ...tt },
        ],
      },
    },
  });

  // 2) IN_PROGRESS com tarefa de saída PENDENTE.
  //    Cenário-chave: enquanto essa tarefa estiver aberta, POST /events/:id/concluir
  //    é recusado e o botão "Concluir" aparece desabilitado no front.
  const emAndamento = await prisma.event.create({
    data: {
      eventName: 'Confraternização Corporate Solutions',
      startDate: dia(1, 19),
      endDate: dia(1, 23),
      eventLocation: 'Rooftop Corporate Tower',
      status: 'IN_PROGRESS',
      clientId: corporate.id,
      responsibleId: decorador.id,
      ...tt,
      eventItems: {
        create: [
          { plannedQuantity: 40, itemId: item.cadeira.id, ...tt },
          { plannedQuantity: 10, itemId: item.mesa.id, ...tt },
          { plannedQuantity: 20, itemId: item.cordao.id, ...tt },
        ],
      },
    },
    include: { eventItems: true },
  });

  await prisma.task.create({
    data: {
      code: `TRB-${ANO}-0001`,
      type: 'SAIDA_GALPAO',
      status: 'PENDENTE',
      eventId: emAndamento.id,
      assignedToId: funcionario.id,
      createdById: decorador.id,
      ...tt,
      taskItems: {
        create: emAndamento.eventItems.map((ei) => ({
          requestedQuantity: ei.plannedQuantity,
          eventItemId: ei.id,
          ...tt,
        })),
      },
    },
  });

  // 3) COMPLETED — contagem final fechada com 2 cadeiras a menos.
  //    A falta virou divergência (baixa em totalQuantity) antes da tarefa fechar.
  const concluido = await prisma.event.create({
    data: {
      eventName: 'Aniversário 15 anos - Bella Festas',
      startDate: dia(-10, 20),
      endDate: dia(-10, 23),
      eventLocation: 'Buffet Encanto',
      status: 'COMPLETED',
      clientId: bella.id,
      responsibleId: decorador.id,
      ...tt,
      eventItems: {
        create: [
          { plannedQuantity: 50, shippedQuantity: 50, returnedQuantity: 48, itemId: item.cadeira.id, ...tt },
          { plannedQuantity: 10, shippedQuantity: 10, returnedQuantity: 10, itemId: item.mesa.id, ...tt },
        ],
      },
    },
    include: { eventItems: true },
  });

  const cadeiraConcluida = concluido.eventItems.find((ei) => ei.itemId === item.cadeira.id);

  await prisma.divergence.create({
    data: {
      source: 'EVENT',
      sourceId: concluido.id,
      status: 'PENDING',
      notes: 'Cadeiras não devolvidas pelo cliente após o evento.',
      createdById: decorador.id,
      ...tt,
      items: {
        create: [
          {
            quantity: 2,
            type: 'MISSING',
            notes: '2 cadeiras Tiffany não retornaram.',
            itemId: item.cadeira.id,
            sourceItemId: cadeiraConcluida.id,
            ...tt,
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      code: `TRB-${ANO}-0002`,
      type: 'ENTRADA_GALPAO',
      status: 'CONCLUIDA',
      completedAt: dia(-9, 10),
      notes: 'Contagem final do evento.',
      eventId: concluido.id,
      assignedToId: funcionario.id,
      createdById: decorador.id,
      ...tt,
      taskItems: {
        create: concluido.eventItems.map((ei) => ({
          requestedQuantity: ei.plannedQuantity,
          confirmedQuantity: ei.returnedQuantity,
          confirmed: true,
          eventItemId: ei.id,
          ...tt,
        })),
      },
    },
  });

  console.log('Criando locações e manutenção...');

  // ACTIVE — estoque reservado, devolução ainda não solicitada.
  await prisma.rental.create({
    data: {
      rentalCode: `LOC-${ANO}-0001`,
      startDate: dia(-2, 8),
      expectedReturn: dia(4, 18),
      location: 'Salão de Festas Condomínio Aurora',
      status: 'ACTIVE',
      clientId: bella.id,
      ...tt,
      rentalItems: {
        create: [
          { quantity: 100, itemId: item.prato.id, ...tt },
          { quantity: 60, itemId: item.taca.id, ...tt },
        ],
      },
    },
  });

  // RETURNED — contagem de devolução fechada com 2 taças a menos.
  const devolvida = await prisma.rental.create({
    data: {
      rentalCode: `LOC-${ANO}-0002`,
      startDate: dia(-20, 8),
      expectedReturn: dia(-15, 18),
      returnedAt: dia(-14, 10),
      location: 'Espaço Jardim das Acácias',
      notes: 'Devolvido com 2 taças a menos (cobradas do cliente).',
      status: 'RETURNED',
      clientId: corporate.id,
      ...tt,
      rentalItems: {
        create: [{ quantity: 40, returnedQuantity: 38, itemId: item.taca.id, ...tt }],
      },
    },
    include: { rentalItems: true },
  });

  await prisma.divergence.create({
    data: {
      source: 'RENTAL',
      sourceId: devolvida.id,
      status: 'PENDING',
      notes: 'Taças quebradas durante a locação.',
      createdById: decorador.id,
      ...tt,
      items: {
        create: [
          {
            quantity: 2,
            type: 'DAMAGED',
            itemId: item.taca.id,
            sourceItemId: devolvida.rentalItems[0].id,
            ...tt,
          },
        ],
      },
    },
  });

  // Manutenção manual: segura unidades fora do disponível sem mexer no total.
  await prisma.maintenance.create({
    data: {
      code: `MAN-${ANO}-0001`,
      status: 'EM_ANDAMENTO',
      type: 'LIMPEZA',
      quantity: 5,
      notes: 'Higienização de pratos.',
      itemId: item.prato.id,
      assignedToId: funcionario.id,
      createdById: admin.id,
      ...tt,
    },
  });

  console.log('Recalculando estoque...');
  await ajustarEstoque(baseTotais);

  const itensFinais = await prisma.item.findMany({
    where: tt,
    orderBy: { name: 'asc' },
    select: { name: true, totalQuantity: true, availableQuantity: true },
  });

  console.log('\n✅ Seed concluída.\n');
  console.log('Tenant:', TENANT);
  console.log('Senha de todos os usuários:', SENHA);
  console.table([
    { papel: 'ADMIN', email: admin.email },
    { papel: 'DECORADOR', email: decorador.email },
    { papel: 'FUNCIONARIO', email: funcionario.email },
  ]);
  console.table(
    itensFinais.map((i) => ({
      item: i.name,
      total: i.totalQuantity,
      disponível: i.availableQuantity,
    })),
  );
  console.log('3 eventos (PLANNING, IN_PROGRESS c/ tarefa pendente, COMPLETED)');
  console.log('2 locações (ACTIVE, RETURNED) · 2 divergências · 1 manutenção\n');
}

main()
  .catch((error) => {
    console.error('Erro ao rodar a seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

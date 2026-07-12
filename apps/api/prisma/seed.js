/**
 * Seed de desenvolvimento do StockManager.
 *
 * Popula um tenant completo para testar o fluxo ponta a ponta:
 * usuários (todos os papéis), categorias, itens, clientes, eventos em cada
 * status (incluindo conclusão com divergências) e locações em cada status.
 *
 * O estoque (`availableQuantity`) é calculado de forma consistente com as
 * regras de domínio: reservas de eventos PLANNING/IN_PROGRESS e locações
 * ACTIVE descontam do disponível; eventos/locações concluídos ou cancelados
 * já devolveram o estoque; faltas/avarias reduzem o total.
 *
 * Como rodar:
 *   cd apps/api && pnpm seed
 *
 * ATENÇÃO: apaga todos os dados existentes das tabelas do domínio antes de
 * inserir. Use apenas em ambiente de desenvolvimento.
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
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Tenant fixo para facilitar inspeção no banco durante os testes.
const TENANT = '11111111-1111-1111-1111-111111111111';
const PASSWORD_PLAIN = 'senha123';

const YEAR = new Date().getFullYear();
const day = (offsetDays, hour = 9) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

async function clearDatabase() {
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

async function main() {
  console.log('Limpando banco...');
  await clearDatabase();

  const password = await bcrypt.hash(PASSWORD_PLAIN, 10);

  // ---------------- Usuários (um por papel) ----------------
  console.log('Criando usuários...');
  const admin = await prisma.user.create({
    data: {
      name: 'Ana Admin',
      email: 'admin@stockmanager.dev',
      password,
      tenantUuid: TENANT,
      role: 'ADMIN',
    },
  });
  const decorador = await prisma.user.create({
    data: {
      name: 'Diego Decorador',
      email: 'decorador@stockmanager.dev',
      password,
      tenantUuid: TENANT,
      role: 'DECORADOR',
    },
  });
  const funcionario = await prisma.user.create({
    data: {
      name: 'Fábio Funcionário',
      email: 'funcionario@stockmanager.dev',
      password,
      tenantUuid: TENANT,
      role: 'FUNCIONARIO',
    },
  });

  // ---------------- Categorias ----------------
  console.log('Criando categorias...');
  const [mobiliario, decoracao, iluminacao, mesaPosta] = await Promise.all(
    [
      { name: 'Mobiliário', description: 'Mesas, cadeiras e sofás' },
      { name: 'Decoração', description: 'Arranjos, painéis e adornos' },
      { name: 'Iluminação', description: 'Luminárias, cordões e refletores' },
      { name: 'Mesa Posta', description: 'Louças, taças e talheres' },
    ].map((data) =>
      prisma.category.create({ data: { ...data, tenantUuid: TENANT } }),
    ),
  );

  // ---------------- Itens ----------------
  // O estoque entra já no estado final e consistente com as reservas ativas:
  //   available = total - (reservas de eventos PLANNING/IN_PROGRESS)
  //                     - (locações ACTIVE) - (manutenção manual)
  // e `total` já reflete faltas/avarias registradas em eventos/locações
  // concluídos. Os valores abaixo foram balanceados manualmente para casar
  // com os eventos, locações e manutenções criados mais adiante.
  console.log('Criando itens...');
  const itemsSeed = [
    { key: 'cadeiraTiffany', name: 'Cadeira Tiffany', categoryId: mobiliario.id, totalQuantity: 248, availableQuantity: 48, unitCost: 45.0 },
    { key: 'mesaRedonda', name: 'Mesa Redonda 1,5m', categoryId: mobiliario.id, totalQuantity: 40, availableQuantity: 15, unitCost: 120.0 },
    { key: 'sofaProvencal', name: 'Sofá Provençal', categoryId: mobiliario.id, totalQuantity: 8, availableQuantity: 8, unitCost: 480.0 },
    { key: 'arranjoFloral', name: 'Arranjo Floral Branco', categoryId: decoracao.id, totalQuantity: 57, availableQuantity: 57, unitCost: 75.0 },
    { key: 'painelFlores', name: 'Painel de Flores', categoryId: decoracao.id, totalQuantity: 12, availableQuantity: 10, unitCost: 320.0 },
    { key: 'cordaoLed', name: 'Cordão de LED 10m', categoryId: iluminacao.id, totalQuantity: 80, availableQuantity: 30, unitCost: 30.0 },
    { key: 'luminariaChao', name: 'Luminária de Chão', categoryId: iluminacao.id, totalQuantity: 25, availableQuantity: 19, unitCost: 150.0 },
    { key: 'tacaCristal', name: 'Taça de Cristal', categoryId: mesaPosta.id, totalQuantity: 498, availableQuantity: 278, unitCost: 12.0 },
    { key: 'pratoRaso', name: 'Prato Raso Porcelana', categoryId: mesaPosta.id, totalQuantity: 500, availableQuantity: 400, unitCost: 18.0 },
    { key: 'sousplat', name: 'Sousplat Dourado', categoryId: mesaPosta.id, totalQuantity: 300, availableQuantity: 295, unitCost: 22.0 },
  ];

  const items = {};
  for (const seed of itemsSeed) {
    const created = await prisma.item.create({
      data: {
        name: seed.name,
        categoryId: seed.categoryId,
        totalQuantity: seed.totalQuantity,
        availableQuantity: seed.availableQuantity,
        unitCost: seed.unitCost,
        tenantUuid: TENANT,
      },
    });
    items[seed.key] = created;
  }

  // ---------------- Clientes ----------------
  console.log('Criando clientes...');
  const [clienteBella, clienteCorp, clienteMaria] = await Promise.all(
    [
      { companyName: 'Bella Festas & Eventos', taxId: '12.345.678/0001-90', contactName: 'Beatriz Lima' },
      { companyName: 'Corporate Solutions Ltda', taxId: '98.765.432/0001-10', contactName: 'Carlos Mendes' },
      { companyName: 'Maria Silva (Casamento)', taxId: '123.456.789-00', contactName: 'Maria Silva' },
    ].map((data) =>
      prisma.client.create({ data: { ...data, tenantUuid: TENANT } }),
    ),
  );

  // ---------------- Eventos ----------------
  console.log('Criando eventos...');

  // 1) Evento em PLANEJAMENTO (reserva estoque)
  const eventoPlanning = await prisma.event.create({
    data: {
      eventName: 'Casamento Maria & João',
      startDate: day(20, 18),
      endDate: day(20, 23),
      eventLocation: 'Espaço Villa Garden - Salão Principal',
      status: 'PLANNING',
      tenantUuid: TENANT,
      clientId: clienteMaria.id,
      responsibleId: decorador.id,
      eventItems: {
        create: [
          { plannedQuantity: 120, itemId: items.cadeiraTiffany.id, tenantUuid: TENANT },
          { plannedQuantity: 15, itemId: items.mesaRedonda.id, tenantUuid: TENANT },
          { plannedQuantity: 2, itemId: items.painelFlores.id, tenantUuid: TENANT },
          { plannedQuantity: 120, itemId: items.tacaCristal.id, tenantUuid: TENANT },
        ],
      },
    },
  });
  // 2) Evento EM ANDAMENTO (estoque reservado + tarefa de saída pendente)
  const eventoInProgress = await prisma.event.create({
    data: {
      eventName: 'Confraternização Corporate Solutions',
      startDate: day(1, 19),
      endDate: day(1, 23),
      eventLocation: 'Rooftop Corporate Tower - 20º andar',
      status: 'IN_PROGRESS',
      tenantUuid: TENANT,
      clientId: clienteCorp.id,
      responsibleId: decorador.id,
      eventItems: {
        create: [
          { plannedQuantity: 80, shippedQuantity: 80, itemId: items.cadeiraTiffany.id, tenantUuid: TENANT },
          { plannedQuantity: 10, shippedQuantity: 10, itemId: items.mesaRedonda.id, tenantUuid: TENANT },
          { plannedQuantity: 30, shippedQuantity: 30, itemId: items.cordaoLed.id, tenantUuid: TENANT },
          { plannedQuantity: 6, shippedQuantity: 6, itemId: items.luminariaChao.id, tenantUuid: TENANT },
        ],
      },
    },
    include: { eventItems: true },
  });
  // Tarefa de saída do galpão (gerada ao iniciar o evento), ainda pendente.
  await prisma.task.create({
    data: {
      code: `TRB-${YEAR}-0001`,
      type: 'SAIDA_GALPAO',
      status: 'PENDENTE',
      tenantUuid: TENANT,
      eventId: eventoInProgress.id,
      assignedToId: funcionario.id,
      createdById: decorador.id,
      taskItems: {
        create: eventoInProgress.eventItems.map((ei) => ({
          requestedQuantity: ei.plannedQuantity,
          eventItemId: ei.id,
          tenantUuid: TENANT,
        })),
      },
    },
  });

  // 3) Evento CONCLUÍDO com conferência e divergências (falta + avaria)
  const eventoCompleted = await prisma.event.create({
    data: {
      eventName: 'Aniversário 15 anos - Bella Festas',
      startDate: day(-10, 20),
      endDate: day(-10, 23),
      eventLocation: 'Buffet Encanto - Salão Cristal',
      status: 'COMPLETED',
      tenantUuid: TENANT,
      clientId: clienteBella.id,
      responsibleId: decorador.id,
      eventItems: {
        create: [
          // 100 planejadas: 98 voltaram, 2 sumiram
          { plannedQuantity: 100, shippedQuantity: 100, returnedQuantity: 98, itemId: items.cadeiraTiffany.id, tenantUuid: TENANT },
          // 40 planejadas: 37 voltaram, 3 quebraram
          { plannedQuantity: 40, shippedQuantity: 40, returnedQuantity: 37, itemId: items.arranjoFloral.id, tenantUuid: TENANT },
          // 8 planejadas, todas voltaram
          { plannedQuantity: 8, shippedQuantity: 8, returnedQuantity: 8, itemId: items.sofaProvencal.id, tenantUuid: TENANT },
        ],
      },
    },
    include: { eventItems: true },
  });
  // Faltas (2 cadeiras) e avarias (3 arranjos) já estão refletidas no
  // totalQuantity inicial desses itens (ver tabela de itens acima).
  const eiCadeira = eventoCompleted.eventItems.find((ei) => ei.itemId === items.cadeiraTiffany.id);
  const eiArranjo = eventoCompleted.eventItems.find((ei) => ei.itemId === items.arranjoFloral.id);

  // Divergência de FALTA (cadeiras não devolvidas)
  await prisma.divergence.create({
    data: {
      source: 'EVENT',
      sourceId: eventoCompleted.id,
      status: 'PENDING',
      notes: 'Cadeiras não devolvidas pelo cliente após o evento.',
      tenantUuid: TENANT,
      createdById: decorador.id,
      items: {
        create: [
          {
            quantity: 2,
            type: 'MISSING',
            notes: '2 cadeiras Tiffany não retornaram.',
            itemId: items.cadeiraTiffany.id,
            sourceItemId: eiCadeira.id,
            tenantUuid: TENANT,
          },
        ],
      },
    },
  });

  // Divergência de AVARIA (arranjos quebrados) + manutenção associada
  const divergenciaAvaria = await prisma.divergence.create({
    data: {
      source: 'EVENT',
      sourceId: eventoCompleted.id,
      status: 'PENDING',
      notes: 'Arranjos florais danificados no transporte de volta.',
      tenantUuid: TENANT,
      createdById: decorador.id,
      items: {
        create: [
          {
            quantity: 3,
            type: 'DAMAGED',
            notes: '3 arranjos com vasos quebrados.',
            itemId: items.arranjoFloral.id,
            sourceItemId: eiArranjo.id,
            tenantUuid: TENANT,
          },
        ],
      },
    },
  });

  // Tarefa de entrada no galpão (gerada na conclusão), já concluída.
  await prisma.task.create({
    data: {
      code: `TRB-${YEAR}-0002`,
      type: 'ENTRADA_GALPAO',
      status: 'CONCLUIDA',
      completedAt: day(-9, 10),
      tenantUuid: TENANT,
      eventId: eventoCompleted.id,
      assignedToId: funcionario.id,
      createdById: decorador.id,
      taskItems: {
        create: eventoCompleted.eventItems
          .filter((ei) => ei.returnedQuantity > 0)
          .map((ei) => ({
            requestedQuantity: ei.returnedQuantity,
            confirmedQuantity: ei.returnedQuantity,
            confirmed: true,
            eventItemId: ei.id,
            tenantUuid: TENANT,
          })),
      },
    },
  });

  // 4) Evento CANCELADO (estoque já devolvido, não afeta disponível)
  await prisma.event.create({
    data: {
      eventName: 'Feira de Negócios (cancelado)',
      startDate: day(5, 8),
      endDate: day(6, 18),
      eventLocation: 'Centro de Convenções - Pavilhão B',
      status: 'CANCELLED',
      tenantUuid: TENANT,
      clientId: clienteCorp.id,
      responsibleId: decorador.id,
      eventItems: {
        create: [
          { plannedQuantity: 50, itemId: items.cadeiraTiffany.id, tenantUuid: TENANT },
        ],
      },
    },
  });

  // ---------------- Manutenções ----------------
  console.log('Criando manutenções...');
  // Gerada a partir da divergência de avaria (arranjos quebrados).
  await prisma.maintenance.create({
    data: {
      code: `MAN-${YEAR}-0001`,
      status: 'PENDENTE',
      type: 'REPARO',
      quantity: 3,
      notes: 'Reparar vasos dos arranjos florais avariados no evento.',
      tenantUuid: TENANT,
      itemId: items.arranjoFloral.id,
      divergenceId: divergenciaAvaria.id,
      assignedToId: funcionario.id,
      createdById: decorador.id,
    },
  });
  // Manutenção manual (limpeza) — decrementa disponível na criação.
  await prisma.maintenance.create({
    data: {
      code: `MAN-${YEAR}-0002`,
      status: 'EM_ANDAMENTO',
      type: 'LIMPEZA',
      quantity: 5,
      notes: 'Higienização de sousplats dourados.',
      tenantUuid: TENANT,
      itemId: items.sousplat.id,
      assignedToId: funcionario.id,
      createdById: admin.id,
    },
  });

  // ---------------- Locações ----------------
  console.log('Criando locações...');

  // Locação RASCUNHO (DRAFT) — não reserva estoque ainda
  await prisma.rental.create({
    data: {
      rentalCode: `LOC-${YEAR}-0001`,
      startDate: day(15, 8),
      expectedReturn: day(18, 18),
      location: 'Chácara Recanto Verde',
      notes: 'Orçamento em negociação.',
      status: 'DRAFT',
      tenantUuid: TENANT,
      clientId: clienteMaria.id,
      rentalItems: {
        create: [
          { quantity: 60, itemId: items.pratoRaso.id, tenantUuid: TENANT },
          { quantity: 60, itemId: items.sousplat.id, tenantUuid: TENANT },
        ],
      },
    },
  });

  // Locação ATIVA (ACTIVE) — reserva estoque
  await prisma.rental.create({
    data: {
      rentalCode: `LOC-${YEAR}-0002`,
      startDate: day(-2, 8),
      expectedReturn: day(4, 18),
      location: 'Salão de Festas Condomínio Aurora',
      notes: 'Entregue no local pelo cliente.',
      status: 'ACTIVE',
      tenantUuid: TENANT,
      clientId: clienteBella.id,
      rentalItems: {
        create: [
          { quantity: 100, itemId: items.tacaCristal.id, tenantUuid: TENANT },
          { quantity: 100, itemId: items.pratoRaso.id, tenantUuid: TENANT },
          { quantity: 20, itemId: items.cordaoLed.id, tenantUuid: TENANT },
        ],
      },
    },
  });
  // Locação DEVOLVIDA (RETURNED) — estoque já retornou, com devolução parcial
  await prisma.rental.create({
    data: {
      rentalCode: `LOC-${YEAR}-0003`,
      startDate: day(-20, 8),
      expectedReturn: day(-15, 18),
      returnedAt: day(-14, 10),
      location: 'Espaço Jardim das Acácias',
      notes: 'Devolvido com 2 taças a menos (cobradas do cliente).',
      status: 'RETURNED',
      tenantUuid: TENANT,
      clientId: clienteCorp.id,
      rentalItems: {
        create: [
          { quantity: 80, returnedQuantity: 78, itemId: items.tacaCristal.id, tenantUuid: TENANT },
          { quantity: 40, returnedQuantity: 40, itemId: items.pratoRaso.id, tenantUuid: TENANT },
        ],
      },
    },
  });
  // 2 taças não voltaram: já refletido no totalQuantity inicial da taça.

  console.log('\n✅ Seed concluída com sucesso!\n');
  console.log('Tenant:', TENANT);
  console.log('Login (senha para todos):', PASSWORD_PLAIN);
  console.table([
    { papel: 'ADMIN', email: admin.email },
    { papel: 'DECORADOR', email: decorador.email },
    { papel: 'FUNCIONARIO', email: funcionario.email },
  ]);
  console.log('Resumo:');
  console.log('  4 categorias, 10 itens, 3 clientes');
  console.log('  4 eventos: PLANNING, IN_PROGRESS (c/ tarefa), COMPLETED (c/ divergências), CANCELLED');
  console.log('  3 locações: DRAFT, ACTIVE, RETURNED');
  console.log('  2 manutenções, 2 divergências\n');
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

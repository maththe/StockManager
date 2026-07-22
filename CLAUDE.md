# CLAUDE.md — StockManager

## O que é este projeto

StockManager é um sistema **multi-tenant** de gestão de estoque para eventos e locações.

| App | Stack |
|-----|-------|
| `apps/api` | NestJS 11 · Prisma · PostgreSQL · JWT |
| `apps/web` | React 19 · React Router 7 (SSR) · TanStack Query · Tailwind 4 · shadcn/ui |

**Idioma do produto: PT-BR.** Todo texto de UI, label, mensagem de erro e comentário visível ao usuário deve estar em português.

---

## Checklist obrigatório antes de qualquer mudança

Percorra nesta ordem antes de escrever código:

- [ ] A mudança afeta **tenant**, **autenticação** ou **estoque**? → leia as seções correspondentes abaixo antes de continuar.
- [ ] Envolve um endpoint novo? → crie também o hook TanStack no frontend.
- [ ] Envolve mutation que toca estoque? → invalide caches de `items`, `events` e/ou `rentals`.
- [ ] Muda schema Prisma? → sincronize DTO, type frontend e hook.
- [ ] Toca `EventsService` ou `RentalsService`? → preserve todos os blocos `$transaction`.

---

## Como rodar

```bash
# API
cd apps/api && pnpm install && pnpm start:dev
# Variáveis: DATABASE_URL, JWT_SECRET, PORT (padrão 3000)

# Web
cd apps/web && pnpm install && pnpm dev
# API configurável via VITE_API_URL (padrão: http://localhost:3000)
# Outros: pnpm build | pnpm typecheck | pnpm format
```

---

## Arquitetura

### Backend — pontos críticos

- `AuthGuard` é **global**. Rotas públicas atuais: `POST /auth/login` e `POST /users`.
- Token JWT carrega: `sub`, `email`, `tenantUuid`.
- Controllers extraem tenant assim: `(req as any).user.tenantUuid`.
- `PrismaService` usa `@prisma/adapter-pg` com `pg.Pool`.
- **Não há** `ValidationPipe` global nem `class-validator`; validação vive nos services.
- O diretório é `src/Itens` com **I maiúsculo** — preserve sempre.

**Módulos em `app.module.ts`:** `auth` · `users` · `Itens` · `categories` · `events` · `clients` · `rentals`

### Frontend — pontos críticos

- Rotas declaradas em `apps/web/app/routes.ts`.
- Entry point real: `routes/home.tsx` → renderiza `routes/users/components/login.tsx`.
- Cadastro público em `/register` (`routes/users/RegisterPage.tsx`) usa `POST /users`.
- Acesso à API: `apps/web/app/services/tanStackQuery/` (não acesse Axios diretamente nas rotas).
- Token: `localStorage['access_token']`, injetado por interceptor em `services/axios/api.ts`.
  Resposta 401 limpa a sessão e redireciona para o login (interceptor de response).
- `DashboardLayout` tem guarda de autenticação e botão de logout (`clearSession`).
- Alias de import: `~/`.
- `QueryClient`: `staleTime` 5 min, `retry` 1.

---

## Regras de domínio — nunca quebre

### Multi-tenant

Toda entidade abaixo **deve** ser filtrada por `tenantUuid`:

`users` · `categories` · `items` · `events` · `event_items` · `rentals` · `rental_items` · `divergences`

> Ao criar qualquer feature de estoque, evento ou locação, escope por tenant sem exceção.

### Estoque — regras de `availableQuantity`

Toda alteração em `availableQuantity` deve ser **transacional**. As regras vigentes:

| Ação | Efeito |
|------|--------|
| Adicionar item a evento/locação | Reserva estoque imediatamente |
| Remover item de evento/locação | Devolve estoque |
| Cancelar evento ou locação | Devolve todo estoque pendente |
| Concluir a contagem de devolução da locação | Devolve o contado (o que faltou já saiu na divergência) |
| Registrar divergência (falta/avaria) | Abate a perda de `totalQuantity` na hora |
| Concluir a contagem final do evento | Devolve o contado (o que faltou já saiu na divergência) |

Campos a revisar sempre que tocar `EventsService` ou `RentalsService`:
`availableQuantity` · `totalQuantity` · `returnedQuantity` · `divergences`

### Eventos — conclusão em duas etapas (a conferência é do galpão)

```
1. POST /events/:id/concluir            (ADMIN/DECORADOR)
   └─ NÃO conclui o evento e NÃO toca no estoque.
      REJEITA se houver qualquer tarefa PENDENTE no evento.
      Com o quadro limpo, cria a tarefa ENTRADA_GALPAO de contagem
      final, com a quantidade esperada por item.

2. POST /divergences/tasks/:taskId       (só se faltou / voltou avariado)
   └─ Registra a perda, dá baixa em totalQuantity e reduz a quantidade
      esperada da tarefa. Sem isso a contagem não fecha.

3. PATCH /tasks/:id/concluir            (funcionário que contou)
   └─ EventCountService.liquidarContagemFinal:
      devolve availableQuantity pelo contado, atualiza returnedQuantity e
      move o evento para COMPLETED. Não mexe em totalQuantity nem cria
      divergência — isso já aconteceu na etapa 2.
```

Regras que sustentam esse fluxo:

- `PATCH /events/:id` com `status: COMPLETED` é **rejeitado**. Não recrie um caminho que conclua evento sem contagem do galpão.
- **Evento com tarefa pendente não vai para a contagem final.** `solicitarContagemFinal` lista as tarefas `PENDENTE` do evento e recusa a operação citando os códigos; o admin tem que concluir ou cancelar cada uma antes. A rota nunca cancela tarefas por conta própria. O front espelha isso desabilitando o botão "Concluir" em `EventDetailsPage`.
- **Nenhuma tarefa fecha com falta silenciosa**, nem a contagem final. A regra é única para todas: só conclui com `confirmedQuantity === requestedQuantity - divergedQuantity`. O que não voltou tem que virar divergência antes — é o registro dela que abaixa o esperado.
- **Nenhuma tarefa fecha sem o "ok" item a item.** `PATCH /tasks/:id/concluir` exige `taskItem.confirmed === true` em **todas** as linhas e recusa listando o que falta conferir. Concluir não confere nada por conta própria — quem confere é `PATCH /tasks/:id/itens/:taskItemId/confirmar`, no galpão. O front espelha isso desabilitando "Finalizar contagem"/"Confirmar saída" em `TaskDetailsPage`.
- `divergedQuantity` é derivado (soma dos `DivergenceItem` daquele `eventItem`/`rentalItem`), calculado em `TasksService.somarDivergenciasPorTaskItem` e devolvido em cada `taskItem` por `GET /tasks` e `GET /tasks/:id`. Não é coluna do banco.
- `PATCH /tasks/:id/itens/:taskItemId/confirmar` **não aceita quantidade**: o backend impõe a esperada.
- `EventCountService` vive em módulo próprio (`EventCountModule`) porque `EventsModule` já depende de `TasksModule`; importar no sentido inverso criaria ciclo.
- Um mesmo item pode acumular mais de uma divergência (ex.: falta na saída + avaria na volta); as validações sempre comparam com o esperado restante, nunca com `requestedQuantity` cru.

### Locações — restrições

- `rentalCode` gerado como `LOC-YYYY-####` por tenant.
- **Nunca** mude status para `RETURNED` ou `CANCELLED` via `PATCH /rentals/:id` diretamente — use as rotas dedicadas.
- A devolução segue o **mesmo desenho da conclusão de evento**: `PATCH /rentals/:id/return` NÃO devolve estoque — **rejeita se houver qualquer tarefa `PENDENTE` na locação** (citando os códigos; nunca cancela tarefa por conta própria) e cria a tarefa `ENTRADA_GALPAO` de contagem (identificada por `type === ENTRADA_GALPAO && rentalId != null`). O front espelha isso desabilitando "Devolver locação" em `RentalDetailsPage`. Concluir essa tarefa dispara `RentalCountService.liquidarDevolucao` (módulo próprio `RentalCountModule`, pelo mesmo motivo anti-ciclo do `EventCountModule`): devolve o contado a `availableQuantity`, atualiza `returnedQuantity` e move a locação para `RETURNED`. Se não há itens pendentes, a rota encerra a locação direto, sem tarefa (`task: null` na resposta).
- Devoluções parciais manuais (`PATCH /rentals/:id/items/:rentalItemId` com `returnedQuantity`) continuam existindo para retornos antecipados; a contagem final cobre apenas o que ainda não voltou.
- Itens de locações encerradas são **não editáveis**.

---

## Convenções de código

### Backend

```ts
// Extrair tenant no controller
const { tenantUuid } = (req as any).user;

// Sanitizar usuário (nunca retornar password nem tenantUuid)
const { password, tenantUuid, ...safeUser } = user;

// Busca com matchesSearch (ignora acentos): users e clients
// Busca com Prisma contains: items, categories, events, rentals

// Rotas de usuário
GET  /users/lista      // listagem (não GET /users)
POST /users/tenant     // criação dentro do tenant
```

### Frontend

```ts
// Estrutura de hook por recurso
apps/web/app/services/tanStackQuery/
  use[Recurso]Query.ts   // leitura
  use[Recurso]Mutation.ts // escrita

// Feedback de mutations
import { mutationToast } from '~/services/mutationToast';

// Invalidar após mutation
queryClient.invalidateQueries({ queryKey: ['items'] });
queryClient.invalidateQueries({ queryKey: ['events'] });
```

**UI:** use `Card`, `Dialog`, gradientes e estados visuais com Tailwind/shadcn. Siga os padrões visuais existentes.

**Tipos de domínio:** `apps/web/app/types/`

---

## Sincronização obrigatória ao mudar contrato

Sempre que alterar um endpoint ou model, atualize **todos** estes pontos juntos:

1. `apps/api/prisma/schema.prisma`
2. DTO do backend (`*.dto.ts`)
3. `apps/web/app/types/`
4. Hook TanStack Query correspondente
5. Invalidações de cache relevantes

---

## Inconsistências conhecidas — não piore, não ignore

Estas inconsistências **já existem**. Não as propague ao adicionar código novo:

| # | Problema | Localização |
|---|---------|-------------|
| 1 | `apps/api/package.json` tem `test` placeholder; não há suíte configurada | — |
| 2 | Imagens de itens são salvas como data URL base64 (~350KB) no campo `imageUrl`; cada `GET /items` trafega todas as imagens | `items` / `ItemImageUploadDialog` |
| 3 | Faltam `RolesGuard` nas rotas de `users`, `JWT_SECRET` tem fallback hardcoded e CORS usa `origin: '*'` com `credentials: true` | `src/users/` · `src/auth/` · `main.ts` |

> Resolvidas em jul/2026: `GET /users/me` existe no backend; `LoginPage.tsx` vazio foi removido; as colunas de variantes de imagem foram consolidadas em `image_url`; `clients` é multi-tenant.

---

## Arquivos-chave — leia antes de mexer na área

| Área | Arquivo |
|------|---------|
| Módulo raiz | `apps/api/src/app.module.ts` |
| Autenticação | `apps/api/src/auth/auth.guard.ts` |
| Banco de dados | `apps/api/src/services/prisma.service.ts` |
| Schema | `apps/api/prisma/schema.prisma` |
| Lógica de eventos | `apps/api/src/events/events.service.ts` |
| Contagem final / fechamento do evento | `apps/api/src/events/event-count.service.ts` |
| Lógica de locações | `apps/api/src/rentals/rentals.service.ts` |
| Contagem de devolução / fechamento da locação | `apps/api/src/rentals/rental-count.service.ts` |
| Rotas web | `apps/web/app/routes.ts` |
| Root da SPA | `apps/web/app/root.tsx` |
| Instância Axios | `apps/web/app/services/axios/api.ts` |
| Hooks de query | `apps/web/app/services/tanStackQuery/` |

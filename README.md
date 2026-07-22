# StockManager

Sistema multi-tenant de gestão de estoque para **eventos e locações** — o tipo de operação em que o mesmo item sai do galpão, volta parcialmente, volta avariado, ou não volta. O núcleo do projeto é garantir que a quantidade disponível de cada item permaneça correta ao longo desse ciclo, sob concorrência e sem baixa silenciosa.

Projeto full-stack construído do zero: modelagem de domínio, API, autenticação multi-tenant, regras transacionais de estoque, frontend e deploy.

> **Demo:** _(adicionar URL do deploy)_

## Stack

| Camada | Tecnologias |
| ------ | ----------- |
| Backend | NestJS 11, TypeScript, Prisma 7 (`@prisma/adapter-pg` + `pg.Pool`), PostgreSQL, JWT, bcrypt |
| Frontend | React 19, React Router 7 (modo SPA), TanStack Query 5, Tailwind 4, shadcn/ui + Radix, React Hook Form, Axios |
| Infra | Render (Postgres + API) e Vercel (front) |

`apps/api` e `apps/web` são projetos **independentes** — não há workspace na raiz. Cada um instala e builda por conta própria.

## O problema de domínio

Um item de estoque tem três quantidades que precisam concordar entre si o tempo todo:

- `totalQuantity` — quanto existe de fato no patrimônio
- `availableQuantity` — quanto está livre para reservar agora
- `returnedQuantity` — quanto já voltou de um evento/locação específico

Toda operação que mexe nisso roda dentro de `$transaction`. As regras vigentes:

| Ação | Efeito no estoque |
| ---- | ----------------- |
| Adicionar item a evento/locação | Reserva imediatamente |
| Remover item de evento/locação | Devolve |
| Cancelar evento ou locação | Devolve todo o pendente |
| Registrar divergência (falta/avaria) | Abate a perda de `totalQuantity` na hora |
| Concluir a contagem de devolução | Devolve **o contado** — o que faltou já saiu na divergência |

## Decisões de projeto

As partes que exigiram mais do que um CRUD:

### Conclusão em duas etapas — quem confere é o galpão

A tentação óbvia é deixar o admin marcar o evento como concluído. Isso permite fechar evento sem ninguém ter contado o que voltou, e o estoque passa a mentir.

O fluxo real separa a decisão administrativa da conferência física:

```
1. POST /events/:id/concluir           (ADMIN/DECORADOR)
   └─ NÃO conclui e NÃO toca no estoque. Rejeita se houver tarefa PENDENTE.
      Cria a tarefa ENTRADA_GALPAO com a quantidade esperada por item.

2. POST /divergences/tasks/:taskId     (só se faltou ou voltou avariado)
   └─ Registra a perda, baixa totalQuantity e reduz o esperado da tarefa.

3. PATCH /tasks/:id/concluir           (quem contou, no galpão)
   └─ Devolve availableQuantity pelo contado e move o evento para COMPLETED.
```

`PATCH /events/:id` com `status: COMPLETED` é **rejeitado** — não existe atalho para fechar evento sem contagem. A devolução de locações segue exatamente o mesmo desenho.

### Nenhuma tarefa fecha com falta silenciosa

Uma regra única, válida para toda tarefa: só conclui com `confirmedQuantity === requestedQuantity - divergedQuantity`. O que não voltou **tem** que virar divergência antes — é o registro dela que abaixa o esperado e, junto, o patrimônio.

Além disso, concluir não confere nada por conta própria: `PATCH /tasks/:id/concluir` exige `confirmed === true` em todas as linhas e recusa listando o que falta. A confirmação item a item é uma rota separada, feita no galpão, e **não aceita quantidade** — o backend impõe a esperada. O front espelha a regra desabilitando o botão, mas a autoridade é do servidor.

### `divergedQuantity` é derivado, não é coluna

Somado a partir dos `DivergenceItem` em tempo de leitura. Um mesmo item pode acumular mais de uma divergência (falta na saída + avaria na volta), e uma coluna materializada seria mais um número para sair de sincronia com a fonte da verdade. As validações sempre comparam com o **esperado restante**, nunca com o `requestedQuantity` cru.

### Módulos de contagem separados para quebrar ciclo

`EventsModule` já depende de `TasksModule`. Como a conclusão da tarefa precisa liquidar a contagem do evento, importar no sentido inverso criaria dependência circular. A liquidação vive em `EventCountModule` / `RentalCountModule`, módulos próprios que ambos os lados podem importar.

### Secret do JWT sem fallback

`getJwtSecret()` lança e derruba a aplicação se `JWT_SECRET` não estiver definida, em vez de cair num valor padrão. Com um default no código, um deploy que esquecesse a variável subiria assinando tokens com uma chave pública — e qualquer pessoa com acesso ao repositório poderia forjar sessão de qualquer tenant. Falhar na subida é o comportamento seguro.

### Isolamento multi-tenant

O `tenantUuid` vem do JWT, nunca do payload. Toda entidade de domínio é filtrada por ele: `users`, `categories`, `items`, `events`, `event_items`, `rentals`, `rental_items`, `divergences`. O `AuthGuard` é global — rotas públicas são a exceção explícita (`POST /auth/login` e o cadastro inicial).

### SPA, não SSR

`react-router.config.ts` tem `ssr: false` e nenhuma rota usa `loader`/`action`. O build gera estáticos puros, o que torna o deploy na Vercel trivial e mantém o front vivo enquanto a API free da Render hiberna. É uma decisão registrada, não um acidente: adicionar um `loader` exige revisitar o deploy junto.

## Modelo de dados

`User` · `Category` · `Client` · `Item` · `Event` / `EventItem` · `Rental` / `RentalItem` · `Divergence` / `DivergenceItem` · `Task` / `TaskItem` · `Maintenance`

## Rodando localmente

**Requisitos:** Node 20+, pnpm, PostgreSQL.

```bash
# API — http://localhost:3000
cd apps/api
cp .env.example .env      # DATABASE_URL e JWT_SECRET são obrigatórias
pnpm install
pnpm prisma migrate dev
pnpm start:dev

# Web — http://localhost:5173
cd apps/web
cp .env.example .env      # VITE_API_URL
pnpm install
pnpm dev
```

`VITE_API_URL` é lida em tempo de **build** (prefixo `VITE_`): mudá-la em produção exige novo deploy.

Deploy completo (Render + Vercel) em [`DEPLOY.md`](DEPLOY.md).

## Estado atual e próximos passos

Funcionando: multi-tenant com RBAC, catálogo de itens e categorias, clientes, eventos e locações ponta a ponta, tarefas de galpão com conferência item a item, divergências, manutenção e dashboard.

Em aberto:

- **Suíte de testes** — não há nenhuma configurada. As regras de liquidação de contagem são a maior candidata a testes unitários, por serem o ponto onde um bug corrompe estoque silenciosamente.
- **Imagens de itens em base64** — hoje gravadas como data URL (~350 KB) no campo `imageUrl`, o que faz cada `GET /items` trafegar todas as imagens. Migrar para storage externo com URL.
- **Validação centralizada** — não há `ValidationPipe` global nem `class-validator`; a validação vive espalhada pelos services.

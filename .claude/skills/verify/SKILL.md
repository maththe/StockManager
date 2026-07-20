# Verificar StockManager de ponta a ponta

## Subir o stack

```powershell
# API (NestJS). CUIDADO: costuma haver uma instância antiga do usuário na porta 3000
# (nest falha com EADDRINUSE e as requisições batem no código VELHO sem avisar).
# Use outra porta — $env:PORT vence o PORT=3000 do .env (dotenv não sobrescreve env existente):
$env:PORT = '3001'; pnpm --dir apps/api start:dev

# Web (React Router dev). Aponte para a API de verificação:
$env:VITE_API_URL = 'http://localhost:3001'; pnpm --dir apps/web dev
# Se 5173 estiver em uso (dev server do usuário), o Vite sobe em 5174.
```

Confirme que a SUA API respondeu: `tail` no output procurando `EADDRINUSE` antes de confiar em qualquer resposta da porta.

## Criar dados de teste (via API)

Gotchas de payload (não há ValidationPipe; os nomes vêm dos services):

- Login e criação de usuário usam o campo **`senha`**, não `password`:
  `POST /users` (público, cria tenant + ADMIN) → `{name, email, senha}`
  `POST /users/tenant` (autenticado) → cria FUNCIONARIO no tenant
  `POST /auth/login` → `{email, senha}` → `{access_token}`
- Cadeia mínima para uma divergência PENDING:
  1. `POST /categories {name}` → `POST /items {name, totalQuantity, availableQuantity, unitCost, categoryId}`
  2. `POST /clients {companyName, taxId}` → `POST /events {eventName, startDate, eventLocation, clientId}`
  3. `POST /events/:id/items {itemId, plannedQuantity}` (falha com "Estoque insuficiente" se plannedQuantity > availableQuantity)
  4. `POST /tasks/evento/:eventId {items:[{eventItemId, requestedQuantity}]}` (ADMIN/DECORADOR; requestedQuantity não pode exceder o restante do eventItem)
  5. `GET /tasks/:id` → os itens vêm na chave **`taskItems`** (não `items`); pegue `taskItems[0].id`
  6. `POST /divergences/tasks/:taskId {notes, items:[{taskItemId, confirmedQuantity, missingQuantity, damagedQuantity, notes}]}` — soma deve bater com requestedQuantity; pode ser feito por FUNCIONARIO

## Fluxos que valem dirigir na UI

- Login em `/` → dashboard. Menu lateral: Divergências fica entre Tarefas e Manutenções.
- FUNCIONARIO em `/dashboard/divergences/:id` pendente: sem botão "Resolver", texto "Aguardando resolução...".
- ADMIN/DECORADOR: botão verde "Resolver divergência" → AlertDialog → status vira "Resolvida", seção "Manutenções geradas" (itens DAMAGED) com link para a manutenção ("via divergência").
- `PATCH /divergences/:id/resolver` direto com token FUNCIONARIO deve dar 403; repetido com ADMIN, 400 "ja foi resolvida".

## Gotchas gerais

- Não imprima `apps/api/.env` no transcript (contém JWT_SECRET/DATABASE_URL).
- No Git Bash do Windows, corpos JSON via curl: use `--data @arquivo.json` (aspas inline se perdem).
- Tokens JWT continuam válidos entre instâncias da API (mesmo secret/DB).

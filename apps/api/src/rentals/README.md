# Locação (Rentals)

Módulo responsável por contratos de locação de itens do estoque. Uma **locação** (`Rental`) reserva uma quantidade de um ou mais itens para um cliente, em um intervalo de datas, e movimenta o saldo `availableQuantity` do item conforme os itens são adicionados, devolvidos ou cancelados.

Todas as operações são multi-tenant: cada requisição usa o `tenantUuid` do usuário autenticado para isolar dados.

## Modelos

### `Rental`
Cabeçalho da locação.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador. |
| `rentalCode` | string | Código de negócio único por tenant (`@@unique([tenantUuid, rentalCode])`). |
| `startDate` | DateTime | Data/hora de início. |
| `expectedReturn` | DateTime | Data/hora prevista de devolução. Deve ser `>= startDate`. |
| `returnedAt` | DateTime? | Preenchido automaticamente quando a locação é marcada como devolvida. |
| `location` | string? | Local de entrega/uso. |
| `notes` | string? | Observações livres. |
| `status` | `RentalStatus` | Estado atual (ver abaixo). Default `DRAFT`. |
| `clientId` | uuid | Cliente da locação. |

### `RentalItem`
Linha de item dentro de uma locação. Único por `(rentalId, itemId)` — não dá pra repetir o mesmo item na mesma locação; aumente a `quantity` em vez disso.

| Campo | Descrição |
|---|---|
| `quantity` | Quantidade reservada. Inteiro `> 0`. |
| `returnedQuantity` | Quantidade já devolvida. Inteiro `>= 0` e `<= quantity`. Default `0`. |

## Status (`RentalStatus`)

```
DRAFT ──┐
        ├─► ACTIVE ──► RETURNED   (via PATCH /rentals/:id/return)
        │      │
        │      └─────► CANCELLED  (via PATCH /rentals/:id/cancel)
        │
        └────────────► CANCELLED  (via PATCH /rentals/:id/cancel)
```

- **DRAFT / ACTIVE**: locação editável. Aceita criar/alterar/remover itens.
- **RETURNED**: encerrada por devolução. Não aceita mais alterações de itens.
- **CANCELLED**: encerrada por cancelamento. Não aceita mais alterações de itens.

Regras importantes do `PATCH /rentals/:id`:
- Não dá pra setar `status` diretamente para `CANCELLED` ou `RETURNED` — use as rotas dedicadas (`/cancel` e `/return`), que rodam em transação e ajustam estoque.
- Não dá pra reabrir uma locação `CANCELLED` ou `RETURNED`.

## Impacto no estoque (`Item.availableQuantity`)

Toda mutação que afeta saldo roda dentro de uma transação Prisma (`$transaction`) para garantir consistência entre `RentalItem` e `Item`.

| Ação | Efeito em `availableQuantity` |
|---|---|
| Adicionar item à locação (`POST /rentals/:id/items`) | `-quantity` |
| Aumentar a `quantity` de um item (`PATCH .../items/:rentalItemId`) | `-(delta)` |
| Diminuir a `quantity` de um item | `+(delta)` |
| Aumentar a `returnedQuantity` | `+(delta)` |
| Diminuir a `returnedQuantity` | `-(delta)` |
| Remover item da locação (`DELETE .../items/:rentalItemId`) | `+(quantity - returnedQuantity)` (devolve o que ainda estava em campo) |
| Marcar locação como devolvida (`PATCH /rentals/:id/return`) | Para cada item: `+(quantity - returnedQuantity)` e seta `returnedQuantity = quantity` |
| Cancelar locação (`PATCH /rentals/:id/cancel`) | Para cada item: `+(quantity - returnedQuantity)` (não toca em `returnedQuantity`) |

Validação: qualquer aumento de quantidade reservada falha com `400` se `Item.availableQuantity` for insuficiente.

## Endpoints

Todos sob `/rentals`, autenticados (o `tenantUuid` vem do usuário no `req.user`).

### Cabeçalho

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/rentals` | Cria locação (sem itens). |
| `GET` | `/rentals` | Lista do tenant. Aceita `?search=` filtrando `rentalCode`, `location` e `client.companyName` (case-insensitive). |
| `GET` | `/rentals/:id` | Busca uma locação com cliente e itens. |
| `PATCH` | `/rentals/:id` | Atualiza dados do cabeçalho (datas, cliente, notas, etc.). |
| `PATCH` | `/rentals/:id/cancel` | Encerra como `CANCELLED` e devolve estoque pendente. |
| `PATCH` | `/rentals/:id/return` | Encerra como `RETURNED`, devolve estoque pendente e seta `returnedAt = now()`. |
| `DELETE` | `/rentals/:id` | Exclui locação. Falha se ainda houver `rentalItems` — remova-os antes. |

### Itens

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/rentals/:id/items` | Adiciona um item (`{ itemId, quantity }`). Falha se locação encerrada, estoque insuficiente ou item já presente. |
| `PATCH` | `/rentals/:id/items/:rentalItemId` | Atualiza `quantity` e/ou `returnedQuantity`. Falha se locação encerrada ou se `returnedQuantity > quantity`. |
| `DELETE` | `/rentals/:id/items/:rentalItemId` | Remove item da locação e devolve o saldo pendente ao estoque. |

## Fluxo típico

1. `POST /rentals` cria o contrato em `DRAFT` apenas com cabeçalho.
2. `POST /rentals/:id/items` adiciona cada item — o estoque do item é reservado nesse momento.
3. Quando a retirada acontece, mude o status para `ACTIVE` via `PATCH /rentals/:id`.
4. Devoluções parciais: `PATCH /rentals/:id/items/:rentalItemId` ajustando `returnedQuantity` (o estoque volta proporcionalmente).
5. Devolução total: `PATCH /rentals/:id/return` — fecha tudo, devolve o que faltava e carimba `returnedAt`.
6. Caso a locação não aconteça: `PATCH /rentals/:id/cancel` — devolve estoque sem registrar devolução efetiva.

## Erros comuns

- `400 Estoque insuficiente para o item selecionado.` — `quantity` solicitada maior que `availableQuantity`.
- `400 Este item já foi adicionado à locação.` — use `PATCH .../items/:rentalItemId` para alterar.
- `400 Não é possível alterar itens de uma locação encerrada.` — locação está `RETURNED` ou `CANCELLED`.
- `400 Remova os itens da locação antes de excluí-la.` — chame `DELETE .../items/:rentalItemId` em cada linha antes do `DELETE /rentals/:id`.
- `400 Use as ações de cancelar ou devolver para encerrar a locação.` — `PATCH /rentals/:id` não aceita transição para `CANCELLED`/`RETURNED`.
- `400 A data de devolução deve ser maior ou igual à data inicial.` — `expectedReturn < startDate`.

## Frontend

A tela está em `apps/web/app/routes/rentals/RentalsPage.tsx` e consome essas rotas via os hooks em `apps/web/app/services/tanStackQuery/rentals`.

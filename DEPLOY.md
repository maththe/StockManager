# Deploy — Postgres + API na Render, front na Vercel

O repositório não tem `package.json` na raiz: `apps/api` e `apps/web` são
projetos independentes. Por isso **cada plataforma precisa apontar para o
subdiretório certo** — é a configuração que mais causa falha no primeiro deploy.

---

## 1. Banco — Render › New › Postgres

Anote as duas URLs que a Render mostra:

| URL | Onde usar |
|-----|-----------|
| **Internal Database URL** | `DATABASE_URL` do serviço da API (mesma região, não sai para a internet) |
| **External Database URL** | rodar migration/seed da sua máquina — exige `?sslmode=require` |

> O plano gratuito de Postgres da Render **expira** e o banco é removido. Confirme
> o prazo vigente no painel ao criar. Não é um banco para dados que importam:
> tenha o `pnpm seed` como caminho de recriação.

## 2. API — Render › New › Web Service

| Campo | Valor |
|-------|-------|
| Root Directory | `apps/api` |
| Runtime | Node |
| Build Command | `pnpm install && pnpm build && pnpm migrate:deploy` |
| Start Command | `pnpm start:prod` |
| Health Check Path | `/health` |

Variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Internal Database URL do passo 1 |
| `JWT_SECRET` | valor aleatório — `openssl rand -base64 48` |
| `CORS_ORIGINS` | a URL da Vercel (passo 3) |

Não defina `PORT`: a Render injeta a dela, e `main.ts` já ouve em `0.0.0.0`.

`CORS_ORIGINS` só existe depois do passo 3 — suba a API primeiro, faça o front,
depois volte e preencha. Sem ela a API aceita qualquer origem, o que serve para
destravar o primeiro deploy mas não deve ficar assim.

**A hibernação de 15 min é real e afeta o banco também**: a primeira chamada
depois do sono leva ~30–50 s. `GET /health` é público justamente para isso —
dá para acordar a API sem passar pelo login.

## 3. Front — Vercel › Add New › Project

| Campo | Valor |
|-------|-------|
| Root Directory | `apps/web` |
| Framework Preset | Other |

O `apps/web/vercel.json` já define build, diretório de saída (`build/client`) e o
rewrite de SPA que faz `/dashboard/...` funcionar em acesso direto e refresh.

Variável de ambiente:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL pública da API na Render, sem barra no fim |

> `VITE_*` é **embutida no bundle durante o build**. Trocar o valor no painel não
> muda nada no site já publicado: é preciso um redeploy.

Depois do primeiro deploy, volte na Render e preencha `CORS_ORIGINS` com o
domínio que a Vercel gerou.

## 4. Primeiro acesso

`pnpm migrate:deploy` cria as tabelas mas não cria usuário. Duas opções:

- cadastro público em `/register` (usa `POST /users`, cria o tenant); ou
- popular dados de demonstração a partir da sua máquina:

```bash
cd apps/api
DATABASE_URL="<External Database URL>?sslmode=require" pnpm seed
```

⚠️ `pnpm seed` **apaga todas as tabelas do domínio** antes de inserir.

---

## Verificação

```bash
curl https://<api>.onrender.com/health          # {"status":"ok",...}
curl -i https://<api>.onrender.com/events       # 401 — AuthGuard é global
```

No navegador, abra `https://<front>.vercel.app/dashboard/events` direto na barra
de endereço: tem que carregar (rewrite de SPA) e não dar 404.

---

## Pontos que vão morder

| # | Ponto |
|---|-------|
| 1 | Imagens de item são data URL base64 (~350 KB) numa coluna. O Postgres gratuito é pequeno e `GET /items` trafega todas as imagens de uma vez — some rápido tanto o disco quanto a paciência no cold start. |
| 2 | `apps/web/Dockerfile` está morto: usa `npm ci` sem `package-lock.json` (o projeto é pnpm) e aponta para `build/server`, que não existe mais em modo SPA. Não use; pode apagar. |
| 3 | Rotas de `users` não têm `RolesGuard` (ver CLAUDE.md). Continua valendo em produção. |

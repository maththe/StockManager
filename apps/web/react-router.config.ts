import type { Config } from '@react-router/dev/config';

// SPA: o build gera só estáticos em build/client, sem servidor Node.
//
// É o que sustenta o deploy na Vercel sem hibernação — não há função
// serverless para acordar. E não perdemos nada: nenhuma rota usa loader ou
// action, todo o carregamento de dados é client-side (TanStack Query + axios)
// e a sessão vive no localStorage, que o servidor não enxergaria de qualquer
// forma. Se um dia entrar loader/action de verdade, volte para `ssr: true` e
// adote o preset @vercel/react-router.
export default {
  ssr: false,
} satisfies Config;

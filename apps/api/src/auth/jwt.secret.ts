import 'dotenv/config';

// Fonte única da secret do JWT — assinatura (AuthModule) e verificação
// (AuthGuard) precisam usar exatamente a mesma.
//
// Sem fallback de propósito: com um valor padrão no código, um deploy que
// esquecesse de definir JWT_SECRET subiria assinando tokens com uma chave
// pública, e qualquer pessoa com acesso ao repositório poderia forjar sessão
// de qualquer tenant. É preferível a API não subir.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET não definida. Configure a variável de ambiente antes de iniciar a API.',
    );
  }

  return secret;
}

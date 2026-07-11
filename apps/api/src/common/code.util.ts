/**
 * Calcula o próximo código sequencial (`PREFIXO-0001`) comparando o sufixo
 * numérico de forma numérica — ordenação de texto quebra ao passar de 9999
 * ("10000" < "9999" lexicograficamente).
 */
export function nextSequentialCode(prefix: string, existingCodes: string[]): string {
  let max = 0;

  for (const code of existingCodes) {
    const match = code.match(/(\d+)$/);
    if (!match) continue;

    const value = Number.parseInt(match[1], 10);
    if (value > max) max = value;
  }

  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

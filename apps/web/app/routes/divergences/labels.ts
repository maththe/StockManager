import type { Divergence } from '~/services/tanStackQuery/divergences';

export const SOURCE_LABEL: Record<string, string> = {
  EVENT: 'Evento',
  RENTAL: 'Locação',
  MANUAL: 'Manual',
  MAINTENANCE: 'Manutenção',
};

export const TYPE_LABEL = {
  MISSING: 'Faltante',
  DAMAGED: 'Avariado',
} as const;

export const STATUS_LABEL: Record<Divergence['status'], string> = {
  PENDING: 'Pendente',
  RESOLVED: 'Resolvida',
};

export const STATUS_CLASS: Record<Divergence['status'], string> = {
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVED:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

export const sumByType = (
  divergence: Divergence,
  type: 'MISSING' | 'DAMAGED',
) =>
  divergence.items
    .filter((item) => item.type === type)
    .reduce((total, item) => total + item.quantity, 0);

// Total de unidades perdidas, somando faltantes e avariados.
export const sumUnits = (divergence: Divergence) =>
  divergence.items.reduce((total, item) => total + item.quantity, 0);

// Título da divergência: o nome da origem é o que identifica o registro.
// Sem origem resolvida, cai no rótulo genérico da fonte.
export const sourceTitle = (divergence: Divergence) =>
  divergence.sourceRef?.label ??
  SOURCE_LABEL[divergence.source] ??
  divergence.source;

export const sourceHref = (source: string, sourceId?: string) => {
  if (!sourceId) return null;
  if (source === 'EVENT') return `/dashboard/events/${sourceId}`;
  if (source === 'RENTAL') return `/dashboard/rentals/${sourceId}`;
  return null;
};

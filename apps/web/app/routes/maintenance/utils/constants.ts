import { CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';

import type { MaintenanceStatus } from '~/types/maintenance';

export const UNASSIGNED = '__unassigned__';

export const statusLabel: Record<MaintenanceStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const statusClassName: Record<MaintenanceStatus, string> = {
  PENDENTE:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EM_ANDAMENTO:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONCLUIDA:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const statusIcon: Record<MaintenanceStatus, typeof Clock> = {
  PENDENTE: Clock,
  EM_ANDAMENTO: PlayCircle,
  CONCLUIDA: CheckCircle2,
  CANCELADA: XCircle,
};

/** Ordem de progresso. CANCELADA fica fora do fluxo linear. */
export const stepOrder: Record<MaintenanceStatus, number> = {
  PENDENTE: 0,
  EM_ANDAMENTO: 1,
  CONCLUIDA: 2,
  CANCELADA: -1,
};

/** Etapas exibidas no stepper de progresso. */
export const progressSteps: MaintenanceStatus[] = [
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDA',
];

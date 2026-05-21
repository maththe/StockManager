import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import {
  MAINTENANCE_TYPE_LABEL,
  type Maintenance,
} from '~/types/maintenance';

import { statusClassName, statusIcon, statusLabel } from '../utils/constants';

interface MaintenanceHeaderProps {
  maintenance: Maintenance;
  isActive: boolean;
  isConcluding: boolean;
  isCancelling: boolean;
  onConclude: () => void;
  onCancel: () => void;
}

export function MaintenanceHeader({
  maintenance,
  isActive,
  isConcluding,
  isCancelling,
  onConclude,
  onCancel,
}: MaintenanceHeaderProps) {
  const StatusIcon = statusIcon[maintenance.status];

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to="/dashboard/maintenance"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Manutenções
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">{maintenance.code}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              {maintenance.code}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[maintenance.status]}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusLabel[maintenance.status]}
            </span>
            <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
              {MAINTENANCE_TYPE_LABEL[maintenance.type]}
            </span>
            {maintenance.divergenceId && (
              <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                via divergência
              </span>
            )}
          </div>
          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight">
            {maintenance.item?.name ?? '—'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {maintenance.quantity} unidade(s) em manutenção
          </p>
        </div>

        {isActive && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={onCancel}
              disabled={isCancelling}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={onConclude}
              disabled={isConcluding}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Concluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

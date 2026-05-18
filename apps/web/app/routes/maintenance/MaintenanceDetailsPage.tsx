import { ArrowLeft, CheckCircle2, Loader2, Settings, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  useMaintenance,
  useConcluirMaintenance,
  useCancelarMaintenance,
} from '~/services/tanStackQuery/maintenance';
import type { MaintenanceStatus } from '~/types/maintenance';

const statusLabel: Record<MaintenanceStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const statusClassName: Record<MaintenanceStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONCLUIDA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function MaintenanceDetailsPage() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const { data: maintenance, isLoading } = useMaintenance(maintenanceId ?? '');
  const concluir = useConcluirMaintenance();
  const cancelar = useCancelarMaintenance();

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!maintenance) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/maintenance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Manutenções
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Manutenção não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isActive = maintenance.status === 'PENDENTE' || maintenance.status === 'EM_ANDAMENTO';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/dashboard/maintenance" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Manutenções
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{maintenance.code}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold text-muted-foreground">{maintenance.code}</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[maintenance.status]}`}>
                {statusLabel[maintenance.status]}
              </span>
              {maintenance.divergenceId && (
                <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  via divergência
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
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
                onClick={() => setCancelDialog(true)}
                disabled={cancelar.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmDialog(true)}
                disabled={concluir.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item</span>
              <span className="font-medium">{maintenance.item?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantidade</span>
              <span className="font-medium">{maintenance.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Responsável</span>
              <span className="font-medium">{maintenance.assignedTo?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado por</span>
              <span className="font-medium">{maintenance.createdBy?.name ?? '—'}</span>
            </div>
            {maintenance.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concluída em</span>
                <span className="font-medium">
                  {new Date(maintenance.completedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {maintenance.notes && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{maintenance.notes}</p>
            </CardContent>
          </Card>
        )}

        {maintenance.divergence && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="text-base text-orange-800 dark:text-orange-300">
                Origem — Divergência
              </CardTitle>
              <CardDescription>
                Esta manutenção foi gerada automaticamente ao resolver uma divergência com itens avariados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenance.divergence.notes && (
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {maintenance.divergence.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stepper */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5" />
            Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'] as const).map((step, idx) => {
              const stepOrder = { PENDENTE: 0, EM_ANDAMENTO: 1, CONCLUIDA: 2, CANCELADA: -1 };
              const currentOrder = stepOrder[maintenance.status] ?? 0;
              const isDone = stepOrder[step] <= currentOrder;
              return (
                <div key={step} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div className={`h-0.5 w-8 ${isDone ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-xs ${isDone ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {statusLabel[step]}
                  </span>
                </div>
              );
            })}
            {maintenance.status === 'CANCELADA' && (
              <span className="ml-2 text-xs text-destructive font-medium">Cancelada</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir manutenção?</AlertDialogTitle>
            <AlertDialogDescription>
              O item será devolvido ao estoque disponível. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await concluir.mutateAsync(maintenance.id);
                setConfirmDialog(false);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Concluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar manutenção?</AlertDialogTitle>
            <AlertDialogDescription>
              {maintenance.divergenceId
                ? 'O item permanecerá fora do estoque disponível (avaria não resolvida).'
                : 'O item será devolvido ao estoque disponível.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await cancelar.mutateAsync(maintenance.id);
                setCancelDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar manutenção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

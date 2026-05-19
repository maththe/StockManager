import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Package, XCircle } from 'lucide-react';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useTask, useConcluirTask, useCancelarTask } from '~/services/tanStackQuery/tasks';
import type { ConfirmTaskItemInput, TaskItem } from '~/types/task';

const statusLabel = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
} as const;

const statusClassName = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONCLUIDA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
} as const;

function ItemRow({
  taskItem,
  confirmedQuantity,
  onChange,
  locked,
}: {
  taskItem: TaskItem;
  confirmedQuantity: number;
  onChange: (qty: number) => void;
  locked: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/50 p-4">
      <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {taskItem.eventItem.item.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Solicitado nesta tarefa:{' '}
          <span className="font-semibold text-foreground">
            {taskItem.requestedQuantity}
          </span>{' '}
          · Planejado total do evento: {taskItem.eventItem.plannedQuantity}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {taskItem.confirmed && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Confirmado</Label>
          <Input
            type="number"
            min={0}
            max={taskItem.requestedQuantity}
            value={confirmedQuantity}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={locked}
            className="h-8 w-20 text-center"
          />
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { data: task, isLoading } = useTask(taskId ?? '');
  const concluir = useConcluirTask();
  const cancelar = useCancelarTask();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cancelDialog, setCancelDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Tarefas
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Tarefa não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const locked = task.status !== 'PENDENTE';
  const taskItems = task.taskItems ?? [];

  const getQty = (ti: TaskItem) => {
    if (quantities[ti.id] !== undefined) return quantities[ti.id];
    if (ti.confirmed) return ti.confirmedQuantity;
    return ti.requestedQuantity;
  };

  const handleConfirm = async () => {
    const items: ConfirmTaskItemInput[] = taskItems.map((ti) => ({
      taskItemId: ti.id,
      confirmedQuantity: getQty(ti),
    }));
    await concluir.mutateAsync({ id: task.id, data: { items } });
    setConfirmDialog(false);
  };

  const handleCancel = async () => {
    await cancelar.mutateAsync(task.id);
    setCancelDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/dashboard/tasks" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Tarefas
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{task.code}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-muted-foreground">{task.code}</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[task.status]}`}>
                {statusLabel[task.status]}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Saída do Galpão — {task.event?.eventName}
            </h1>
            {task.assignedTo && (
              <p className="mt-1 text-sm text-muted-foreground">
                Responsável: {task.assignedTo.name}
              </p>
            )}
          </div>

          {!locked && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setCancelDialog(true)}
                disabled={cancelar.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar tarefa
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmDialog(true)}
                disabled={concluir.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar saída
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens a confirmar
          </CardTitle>
          <CardDescription>
            Informe a quantidade de cada item que saiu fisicamente do galpão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {taskItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>
          ) : (
            taskItems.map((ti) => (
              <ItemRow
                key={ti.id}
                taskItem={ti}
                confirmedQuantity={getQty(ti)}
                onChange={(qty) => setQuantities((prev) => ({ ...prev, [ti.id]: qty }))}
                locked={locked}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída do galpão?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso registrará que os itens saíram fisicamente do galpão. A tarefa ficará concluída e não poderá ser editada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa será marcada como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

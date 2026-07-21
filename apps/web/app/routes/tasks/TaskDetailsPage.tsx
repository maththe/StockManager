import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
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
import { QuantityField } from '~/components/Form/QuantityInput';
import { Label } from '~/components/ui/label';
import { useCreateTaskDivergence } from '~/services/tanStackQuery/divergences';
import {
  useCancelarTask,
  useConcluirTask,
  useConfirmarTaskItem,
  useTask,
} from '~/services/tanStackQuery/tasks';
import type {
  ConfirmTaskItemInput,
  CreateTaskDivergenceInput,
  TaskItem,
} from '~/types/task';
import {
  TaskDivergenceDialog,
  type TaskDivergenceCandidate,
} from './TaskDivergenceDialog';
import {
  getTaskItemName,
  getTaskItemPlanned,
  getTaskSource,
} from './task-helpers';

const statusLabel = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada',
} as const;

const statusClassName = {
  PENDENTE:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONCLUIDA:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
} as const;

function ItemRow({
  taskItem,
  confirmedQuantity,
  onChange,
  onToggleConfirm,
  toggling,
  locked,
  isEntrada,
  isContagemFinal,
}: {
  taskItem: TaskItem;
  confirmedQuantity: number;
  onChange: (qty: number) => void;
  onToggleConfirm: (confirmed: boolean) => void;
  toggling: boolean;
  locked: boolean;
  isEntrada: boolean;
  isContagemFinal: boolean;
}) {
  const plannedTotal = getTaskItemPlanned(taskItem);
  const ConfirmIcon = isEntrada ? PackageCheck : Truck;
  const confirmLabel = isContagemFinal
    ? 'Registrar contagem'
    : isEntrada
      ? 'Confirmar retorno'
      : 'Confirmar no caminhao';
  const confirmedLabel = isContagemFinal
    ? 'Contagem registrada'
    : isEntrada
      ? 'Retorno confirmado'
      : 'No caminhao';
  const countMatches = confirmedQuantity === taskItem.requestedQuantity;
  // Na contagem final o número contado é o dado que interessa: pode divergir.
  const canConfirmItem = isContagemFinal || countMatches;
  const isFaltando = isContagemFinal && confirmedQuantity < taskItem.requestedQuantity;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/50 p-4">
      <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {getTaskItemName(taskItem)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isEntrada ? 'Retorno declarado pelo decorador' : 'Solicitado nesta tarefa'}:{' '}
          <span className="font-semibold text-foreground">
            {taskItem.requestedQuantity}
          </span>
          {plannedTotal !== null && (
            <> · Total reservado: {plannedTotal}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {locked && taskItem.confirmed && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">
            {locked ? 'Confirmado' : isContagemFinal ? 'Quantos voltaram' : 'Contado'}
          </Label>
          <QuantityField
            value={confirmedQuantity}
            minimum={0}
            maximum={taskItem.requestedQuantity}
            size="compact"
            className="w-36"
            onChange={(value) =>
              onChange(Math.max(0, Number.parseInt(value, 10) || 0))
            }
            disabled={locked || taskItem.confirmed}
          />
        </div>
        {!locked &&
          (taskItem.confirmed ? (
            <div className="flex flex-col items-end gap-1.5 self-end">
              {isFaltando ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Faltaram {taskItem.requestedQuantity - confirmedQuantity}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {confirmedLabel}
                </span>
              )}
              <Button
                variant="outline"
                size="default"
                className="h-8 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onToggleConfirm(false)}
                disabled={toggling}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Desfazer
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="h-11 self-end gap-2 border-green-300 px-4 text-sm font-semibold text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-500/40 dark:text-green-400 dark:hover:bg-green-950/40 dark:hover:text-green-300"
              onClick={() => onToggleConfirm(true)}
              disabled={toggling || !canConfirmItem}
              title={
                canConfirmItem
                  ? undefined
                  : 'So e possivel confirmar o item com a quantidade exata solicitada. Se houver problema, crie uma divergencia.'
              }
            >
              <ConfirmIcon className="h-5 w-5" />
              {confirmLabel}
            </Button>
          ))}
      </div>
    </div>
  );
}

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { data: task, isLoading } = useTask(taskId ?? '');
  const concluir = useConcluirTask();
  const cancelar = useCancelarTask();
  const confirmarItem = useConfirmarTaskItem();
  const createDivergence = useCreateTaskDivergence();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cancelDialog, setCancelDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [divergenceDialog, setDivergenceDialog] = useState(false);

  const locked = task?.status !== 'PENDENTE';
  const taskItems = task?.taskItems ?? [];
  const isEntrada = task?.type === 'ENTRADA_GALPAO';
  const isRentalTask = Boolean(task?.rentalId ?? task?.rental);
  // Contagem final do evento: é ela que apura o retorno, fecha o evento e
  // transforma o que não voltou em divergência.
  const isContagemFinal = isEntrada && !isRentalTask;
  const typeTitle = isContagemFinal
    ? 'Contagem final do evento'
    : isEntrada
      ? 'Entrada no Galpao'
      : 'Saida do Galpao';
  const confirmActionLabel = isContagemFinal
    ? 'Finalizar contagem'
    : isEntrada
      ? 'Confirmar entrada'
      : 'Confirmar saida';
  const confirmDialogTitle = isContagemFinal
    ? 'Finalizar a contagem do evento?'
    : isEntrada
      ? 'Confirmar entrada no galpao?'
      : 'Confirmar saida do galpao?';
  const confirmDialogDescription = isContagemFinal
    ? 'Os itens contados voltam ao estoque e o evento sera concluido. Tudo que nao voltou vira uma divergencia pendente para o admin classificar. A tarefa nao podera ser editada depois.'
    : isEntrada
      ? 'Isso registrara que os itens retornaram fisicamente ao galpao. A tarefa ficara concluida e nao podera ser editada.'
      : 'Isso registrara que os itens sairam fisicamente do galpao. A tarefa ficara concluida e nao podera ser editada.';
  const itemsCardDescription = isContagemFinal
    ? 'Conte o que realmente voltou do evento e registre item a item. A diferenca vira divergencia automaticamente.'
    : isEntrada
      ? 'Confirme cada item conforme ele retorna fisicamente ao galpao.'
      : 'Confirme cada item conforme ele entra no caminhao. Ao final, conclua a tarefa.';

  const getQty = (taskItem: TaskItem) => {
    if (taskItem.confirmed) return taskItem.confirmedQuantity;
    if (quantities[taskItem.id] !== undefined) return quantities[taskItem.id];
    return taskItem.requestedQuantity;
  };

  const confirmedCount = taskItems.filter((ti) => ti.confirmed).length;

  const quantityErrors = useMemo(
    () =>
      taskItems
        .map((taskItem) => {
          const quantity = getQty(taskItem);

          if (!Number.isInteger(quantity) || quantity < 0) {
            return `${getTaskItemName(taskItem)}: a quantidade deve ser um inteiro maior ou igual a zero.`;
          }

          if (quantity > taskItem.requestedQuantity) {
            return `${getTaskItemName(taskItem)}: a quantidade nao pode ser maior que ${taskItem.requestedQuantity}.`;
          }

          return null;
        })
        .filter(Boolean) as string[],
    [taskItems, quantities],
  );

  const divergenceCandidates = useMemo<TaskDivergenceCandidate[]>(
    () =>
      taskItems
        .map((taskItem) => {
          const confirmedQuantity = getQty(taskItem);
          const difference = taskItem.requestedQuantity - confirmedQuantity;

          if (difference <= 0) return null;

          return {
            taskItem,
            confirmedQuantity,
            difference,
          };
        })
        .filter(Boolean) as TaskDivergenceCandidate[],
    [taskItems, quantities],
  );

  // Na contagem final a diferença é o resultado esperado do trabalho: ela não
  // bloqueia a conclusão, vira divergência automática no backend.
  const canConfirm =
    !locked &&
    !concluir.isPending &&
    quantityErrors.length === 0 &&
    (isContagemFinal || divergenceCandidates.length === 0);
  const canCreateDivergence =
    !locked &&
    !isContagemFinal &&
    !createDivergence.isPending &&
    quantityErrors.length === 0 &&
    divergenceCandidates.length > 0;

  const handleConfirm = async () => {
    if (!task) return;
    const items: ConfirmTaskItemInput[] = taskItems.map((taskItem) => ({
      taskItemId: taskItem.id,
      confirmedQuantity: getQty(taskItem),
    }));
    await concluir.mutateAsync({ id: task.id, data: { items } });
    setConfirmDialog(false);
  };

  const handleToggleItem = async (taskItem: TaskItem, confirmed: boolean) => {
    if (!task) return;
    await confirmarItem.mutateAsync({
      taskId: task.id,
      taskItemId: taskItem.id,
      confirmed,
      // Fora da contagem final o backend impõe a quantidade solicitada.
      confirmedQuantity: isContagemFinal ? getQty(taskItem) : undefined,
    });
    // Descarta a contagem local para o item voltar a refletir o servidor.
    setQuantities((current) => {
      const { [taskItem.id]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleCreateDivergence = async (data: CreateTaskDivergenceInput) => {
    if (!task) return;
    await createDivergence.mutateAsync({ taskId: task.id, data });
    setDivergenceDialog(false);
  };

  const handleCancel = async () => {
    if (!task) return;
    await cancelar.mutateAsync(task.id);
    setCancelDialog(false);
  };

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
            <CardTitle className="text-destructive">
              Tarefa nao encontrada
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/dashboard/tasks"
            className="flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tarefas
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{task.code}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-muted-foreground">
                {task.code}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[task.status]}`}
              >
                {statusLabel[task.status]}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {typeTitle} — {getTaskSource(task).label}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              {getTaskSource(task).href && (
                <Link
                  to={getTaskSource(task).href!}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {isRentalTask ? 'Ver locação' : 'Ver evento'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {task.assignedTo && (
                <p className="text-sm text-muted-foreground">
                  Responsavel: {task.assignedTo.name}
                </p>
              )}
            </div>
          </div>

          {!locked && (
            <div className="flex flex-wrap gap-2">
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
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-500/40 dark:text-amber-400 dark:hover:bg-amber-950/40 dark:hover:text-amber-300"
                onClick={() => setDivergenceDialog(true)}
                disabled={!canCreateDivergence}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Criar uma divergencia
              </Button>
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => setConfirmDialog(true)}
                disabled={!canConfirm}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {confirmActionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!locked && quantityErrors.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Revise as quantidades informadas
          </div>
          <div className="mt-2 space-y-1">
            {quantityErrors.map((error) => (
              <p key={error} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {!locked &&
        quantityErrors.length === 0 &&
        divergenceCandidates.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              A tarefa nao pode ser concluida com quantidade diferente da solicitada
            </div>
            <p className="mt-2 text-sm">
              Ajuste a contagem para bater com o solicitado ou use{' '}
              <span className="font-semibold">Criar uma divergencia</span> para
              relatar o problema encontrado.
            </p>
          </div>
        )}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens a confirmar
            {taskItems.length > 0 && (
              <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {confirmedCount}/{taskItems.length} confirmados
              </span>
            )}
          </CardTitle>
          <CardDescription>{itemsCardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {taskItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item registrado.
            </p>
          ) : (
            taskItems.map((taskItem) => (
              <ItemRow
                key={taskItem.id}
                taskItem={taskItem}
                confirmedQuantity={getQty(taskItem)}
                onChange={(quantity) =>
                  setQuantities((current) => ({
                    ...current,
                    [taskItem.id]: quantity,
                  }))
                }
                onToggleConfirm={(confirmed) =>
                  handleToggleItem(taskItem, confirmed)
                }
                toggling={confirmarItem.isPending}
                locked={locked}
                isEntrada={isEntrada}
                isContagemFinal={isContagemFinal}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogDescription}
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

      <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A tarefa sera marcada como
              cancelada.
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

      <TaskDivergenceDialog
        open={divergenceDialog}
        onOpenChange={setDivergenceDialog}
        candidates={divergenceCandidates}
        isLoading={createDivergence.isPending}
        onSubmit={handleCreateDivergence}
      />
    </div>
  );
}

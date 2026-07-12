import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Edit3,
  FileDown,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  PackagePlus,
  Play,
  PlusSquare,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { showErrorToast, showSuccessToast } from '~/components/ui/toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useClients } from '~/services/tanStackQuery/clients';
import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import {
  useCancelEvent,
  useCompleteEvent,
  useDeleteEvent,
  useDeleteEventItem,
  useEvent,
  useEventItems,
  useStartEvent,
  useUpdateEvent,
  useUpdateEventItem,
} from '~/services/tanStackQuery/events';
import { useUsers } from '~/services/tanStackQuery/users';
import { getCurrentUser, hasRole } from '~/services/auth/currentUser';
import type {
  CompleteEventItemInput,
  CreateEventInput,
  Event,
  UpdateEventInput,
} from '~/types/event';
import type { CreatePartialTaskInput } from '~/types/task';

import { EventCompleteDialog } from './components/EventCompleteDialog';
import { EventFormDialog } from './components/EventFormDialog';
import { EventItemDivergenceBadges } from './components/EventItemDivergenceBadges';
import { EventStatusStepper } from './components/EventStatusStepper';
import { PartialTaskDialog } from './components/PartialTaskDialog';
import { useCreatePartialTask, useTasks } from '~/services/tanStackQuery/tasks';
import { EventItemEditDialog } from './components/EventItemEditDialog';
import { ItemThumbnail } from './components/ItemThumbnail';
import { downloadEventPdf } from './utils/eventPdf';
import {
  formatEventDate,
  getDivergenceQuantity,
  groupEventItemsByCategory,
  type SelectedEventItem,
} from './utils/utils';

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading: isLoadingEvents } = useEvent(eventId);
  const { data: eventItems = [], isLoading: isLoadingItems } =
    useEventItems(eventId);
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const { data: tasks = [] } = useTasks();
  const eventTasks = useMemo(
    () => tasks.filter((t) => t.eventId === eventId),
    [tasks, eventId],
  );

  const currentUser = useMemo(() => getCurrentUser(), []);
  const canManageTasks = hasRole(currentUser, 'ADMIN', 'DECORADOR');

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();
  const completeEvent = useCompleteEvent();
  const startEvent = useStartEvent();
  const createPartialTask = useCreatePartialTask();
  const updateEventItem = useUpdateEventItem();
  const deleteEventItem = useDeleteEventItem();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [partialTaskDialogOpen, setPartialTaskDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'cancel' | 'complete' | 'delete' | 'start';
    event: Event;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SelectedEventItem | null>(
    null,
  );
  const [deletingItemTarget, setDeletingItemTarget] =
    useState<SelectedEventItem | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleSubmitEdit = async (
    data: CreateEventInput | UpdateEventInput,
  ) => {
    if (!event) return;
    await updateEvent.mutateAsync({ id: event.id, data });
    setEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteEvent.mutateAsync(id);
      navigate('/dashboard/events');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      await cancelEvent.mutateAsync(id);
    } finally {
      setCancellingId(null);
    }
  };

  const handleComplete = async (id: string, completionItems: CompleteEventItemInput[]) => {
    try {
      setCompletingId(id);
      await completeEvent.mutateAsync({ id, completionItems });
    } finally {
      setCompletingId(null);
    }
  };

  const handleStart = async (id: string) => {
    try {
      setStartingId(id);
      await startEvent.mutateAsync(id);
    } finally {
      setStartingId(null);
    }
  };

  const handleCreatePartialTask = async (data: CreatePartialTaskInput) => {
    if (!event) return;
    await createPartialTask.mutateAsync({ eventId: event.id, data });
    setPartialTaskDialogOpen(false);
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;
    const targetEvent = pendingAction.event;

    if (pendingAction.type === 'delete') {
      await handleDelete(targetEvent.id);
    } else if (pendingAction.type === 'start') {
      await handleStart(targetEvent.id);
    } else if (pendingAction.type === 'cancel') {
      await handleCancel(targetEvent.id);
    }

    setPendingAction(null);
  };

  const handleSaveItemQuantity = async (
    eventItemId: string,
    plannedQuantity: number,
  ) => {
    if (!event) return;
    await updateEventItem.mutateAsync({
      eventId: event.id,
      eventItemId,
      data: { plannedQuantity },
    });
    setEditingItem(null);
  };

  const handleConfirmRemoveItem = async () => {
    if (!event || !deletingItemTarget) return;
    try {
      setRemovingItemId(deletingItemTarget.id);
      await deleteEventItem.mutateAsync({
        eventId: event.id,
        eventItemId: deletingItemTarget.id,
      });
      setDeletingItemTarget(null);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!event) return;

    try {
      setIsGeneratingPdf(true);
      downloadEventPdf(event, groupedItems);
      showSuccessToast('PDF do evento gerado com sucesso.');
    } catch (error) {
      console.error('Erro ao gerar PDF do evento.', error);
      showErrorToast('Erro ao gerar PDF do evento.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const groupedItems = useMemo(
    () => groupEventItemsByCategory(eventItems, itemMap, categoryMap),
    [eventItems, itemMap, categoryMap],
  );

  const totalReservedUnits = useMemo(
    () =>
      eventItems.reduce(
        (total, current) => total + (current.plannedQuantity ?? 0),
        0,
      ),
    [eventItems],
  );

  const itemsWithDivergences = useMemo(
    () =>
      eventItems.filter(
        (eventItem) =>
          getDivergenceQuantity(eventItem, 'MISSING') > 0 ||
          getDivergenceQuantity(eventItem, 'DAMAGED') > 0,
      ),
    [eventItems],
  );

  if (isLoadingEvents) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/events">
            <Button
              variant="outline"
              size="icon"
              className="border-border/50 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Evento não encontrado
          </h1>
        </div>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              Erro ao carregar evento
            </CardTitle>
            <CardDescription>
              O evento solicitado não existe ou não está disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/events">
              <Button variant="outline" className="border-border/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para eventos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManageItems =
    event.status === 'PLANNING' || event.status === 'IN_PROGRESS';
  const canAddItems = canManageItems;
  const lockedEventItemIds = new Set(
    eventTasks
      .filter((task) => task.status !== 'CANCELADA')
      .flatMap((task) => (task.taskItems ?? []).map((ti) => ti.eventItemId)),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-5 py-6 shadow-sm dark:from-background dark:via-card dark:to-muted/20 sm:px-7">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            to="/dashboard/events"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Eventos
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-foreground">
            {event.eventName}
          </span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {event.eventName}
              </h1>
            </div>
            <div className="mt-3">
              <EventStatusStepper status={event.status} />
            </div>
          </div>

          {/* Action buttons — eventos concluídos são imutáveis, sem ações */}
          <div className="flex flex-wrap items-center gap-2">
            {event.status === 'CANCELLED' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setPendingAction({ type: 'delete', event })}
                disabled={deletingId === event.id || Boolean(pendingAction)}
              >
                {deletingId === event.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir
              </Button>
            ) : event.status === 'COMPLETED' ? null : (
              <>
                {event.status === 'PLANNING' && canManageTasks && (
                  <span
                    title={
                      eventItems.length === 0
                        ? 'Adicione ao menos um item reservado para iniciar o evento.'
                        : undefined
                    }
                  >
                    <Button
                      type="button"
                      size="sm"
                      className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
                      onClick={() =>
                        setPendingAction({ type: 'start', event })
                      }
                      disabled={
                        eventItems.length === 0 ||
                        startingId === event.id ||
                        Boolean(pendingAction)
                      }
                    >
                      {startingId === event.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Iniciar evento
                    </Button>
                  </span>
                )}
                {event.status === 'IN_PROGRESS' && canManageTasks && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
                    onClick={() =>
                      setPendingAction({ type: 'complete', event })
                    }
                    disabled={
                      completingId === event.id || Boolean(pendingAction)
                    }
                  >
                    {completingId === event.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Concluir
                  </Button>
                )}
                {eventItems.length > 0 && canManageTasks && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-primary/40 text-primary transition-colors hover:bg-primary/10"
                    onClick={() => setPartialTaskDialogOpen(true)}
                    disabled={Boolean(pendingAction)}
                  >
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Criar tarefa parcial
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border/60"
                      aria-label="Mais ações"
                      disabled={Boolean(pendingAction)}
                    >
                      {cancellingId === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canManageTasks && (
                      <DropdownMenuItem
                        onSelect={() => setEditDialogOpen(true)}
                      >
                        <Edit2 />
                        Editar evento
                      </DropdownMenuItem>
                    )}
                    {event.status === 'PLANNING' && canManageTasks && (
                      <DropdownMenuItem
                        onSelect={() =>
                          setPendingAction({ type: 'complete', event })
                        }
                      >
                        <CheckCircle2 />
                        Concluir evento
                      </DropdownMenuItem>
                    )}
                    {canManageTasks && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onSelect={() =>
                        setPendingAction({ type: 'cancel', event })
                      }
                    >
                      <Ban />
                      Cancelar evento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Cliente
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {event.client?.companyName ?? 'Cliente não associado'}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Local
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {event.eventLocation}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Data
            </div>
            <div className="mt-1.5 text-sm font-medium text-foreground">
              {formatEventDate(event.startDate)}
              {event.endDate && (
                <span className="text-muted-foreground">
                  {' até '}
                  {formatEventDate(event.endDate)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <UserRound className="h-3.5 w-3.5 text-primary" />
              Responsável
            </div>
            <div className="mt-1.5 truncate text-sm font-medium text-foreground">
              {event.responsible?.name ?? 'Sem responsável definido'}
            </div>
          </div>
        </div>
      </div>

      {/* Divergências da conferência */}
      {event.status === 'COMPLETED' && itemsWithDivergences.length > 0 && (
        <Card className="border-amber-300/40 bg-amber-50/60 shadow-sm dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Divergências da conferência
            </CardTitle>
            <CardDescription>
              Itens com faltas ou avarias registradas na conclusão do evento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {itemsWithDivergences.map((entry) => {
              const missingQuantity = getDivergenceQuantity(entry, 'MISSING');
              const damagedQuantity = getDivergenceQuantity(entry, 'DAMAGED');
              const hasPending = entry.divergences?.some(
                (divergence) => divergence.status === 'PENDING',
              );
              const notes = entry.divergences?.find(
                (divergence) => divergence.notes,
              )?.notes;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-amber-200/60 bg-background/70 p-3 dark:border-amber-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">
                      {entry.item.name}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        hasPending
                          ? 'bg-destructive/10 text-destructive ring-1 ring-destructive/30'
                          : 'bg-accent/10 text-accent ring-1 ring-accent/30'
                      }`}
                    >
                      {hasPending ? 'Pendente' : 'Resolvida'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {missingQuantity > 0 && (
                      <span>
                        {missingQuantity}{' '}
                        {missingQuantity === 1 ? 'faltante' : 'faltantes'}
                      </span>
                    )}
                    {missingQuantity > 0 && damagedQuantity > 0 && ' • '}
                    {damagedQuantity > 0 && (
                      <span>
                        {damagedQuantity}{' '}
                        {damagedQuantity === 1 ? 'avariado' : 'avariados'}
                      </span>
                    )}
                    {' • '}Retornaram {entry.returnedQuantity} de{' '}
                    {entry.plannedQuantity}
                  </div>
                  {notes && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {notes}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Items section */}
      <Card className="border border-border/60 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/40 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Package className="h-5 w-5 text-primary" />
              Itens reservados
            </CardTitle>
            <CardDescription className="mt-1">
              {eventItems.length === 0
                ? 'Nenhum item reservado ainda neste evento.'
                : `${eventItems.length} ${eventItems.length === 1 ? 'item reservado' : 'itens reservados'} • ${totalReservedUnits} ${totalReservedUnits === 1 ? 'unidade' : 'unidades'} no total`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePdf}
              disabled={isLoadingItems || isGeneratingPdf}
              className="border-border/60 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {isGeneratingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Gerar PDF
            </Button>
            <Button
              onClick={() =>
                navigate(`/dashboard/events/${event.id}/items`)
              }
              disabled={!canAddItems}
              className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Selecionar itens
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoadingItems ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : groupedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/40 px-6 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div className="text-lg font-semibold text-foreground">
                Nenhum item reservado
              </div>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Abra o catálogo para adicionar itens do estoque a este evento.
                É necessário reservar itens antes de iniciar o evento.
              </p>
              {canAddItems && (
                <Button
                  onClick={() =>
                    navigate(`/dashboard/events/${event.id}/items`)
                  }
                  className="mt-5 bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Selecionar itens
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedItems.map((group) => (
                <section key={group.categoryName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.categoryName}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((entry) => {
                      const isRemoving = removingItemId === entry.id;
                      const isLockedByTask = lockedEventItemIds.has(entry.id);
                      const isCompletedEvent = event.status === 'COMPLETED';
                      return (
                        <div
                          key={entry.id}
                          className="group rounded-xl border border-border/50 bg-background/60 p-3 shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-background hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted/40">
                            <ItemThumbnail
                              item={entry.inventoryItem ?? entry.item}
                              categoryName={group.categoryName}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                              {entry.item.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                              {group.categoryName}
                            </div>
                            {isCompletedEvent && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {entry.shippedQuantity > 0 && (
                                  <>Enviados {entry.shippedQuantity} • </>
                                )}
                                Retornaram {entry.returnedQuantity} de{' '}
                                {entry.plannedQuantity}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-shrink-0 items-baseline gap-1 rounded-lg bg-primary/10 px-3 py-1.5 ring-1 ring-primary/20">
                            <span className="text-lg font-bold leading-none tabular-nums text-primary">
                              {entry.plannedQuantity}
                            </span>
                            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                              un.
                            </span>
                          </div>

                          <div className="flex flex-shrink-0 flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              onClick={() => setEditingItem(entry)}
                              disabled={
                                !canManageItems || isLockedByTask || isRemoving
                              }
                              title={
                                isLockedByTask
                                  ? 'Item vinculado a uma tarefa ativa. Cancele a tarefa para editar.'
                                  : undefined
                              }
                              aria-label={`Editar quantidade de ${entry.item.name}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingItemTarget(entry)}
                              disabled={
                                !canManageItems || isLockedByTask || isRemoving
                              }
                              title={
                                isLockedByTask
                                  ? 'Item vinculado a uma tarefa ativa. Cancele a tarefa para remover.'
                                  : undefined
                              }
                              aria-label={`Excluir ${entry.item.name}`}
                            >
                              {isRemoving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                          </div>

                          {isCompletedEvent && (
                            <div className="mt-2 empty:mt-0 empty:hidden">
                              <EventItemDivergenceBadges eventItem={entry} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={event}
        clients={clients}
        users={users}
        onSubmit={handleSubmitEdit}
        isLoading={updateEvent.isPending}
      />

      <AlertDialog
        open={Boolean(pendingAction) && pendingAction?.type !== 'complete'}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === 'delete'
                ? 'Excluir evento?'
                : pendingAction?.type === 'start'
                  ? 'Iniciar evento?'
                  : 'Cancelar evento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'delete'
                ? `Esta ação removerá permanentemente o evento "${pendingAction.event.eventName}".`
                : pendingAction?.type === 'start'
                  ? `Ao iniciar "${pendingAction.event.eventName}", uma tarefa de saída do galpão com todos os itens será criada e o status mudará para Em andamento.`
                  : `Ao cancelar "${pendingAction?.event.eventName}", todos os itens reservados voltarão ao estoque.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(deletingId || cancellingId || startingId)}
            >
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPendingAction}
              disabled={Boolean(deletingId || cancellingId || startingId)}
            >
              {deletingId || cancellingId || startingId
                ? 'Processando...'
                : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PartialTaskDialog
        open={partialTaskDialogOpen}
        onOpenChange={setPartialTaskDialogOpen}
        eventItems={eventItems}
        eventTasks={eventTasks}
        funcionarios={users.filter(
          (u) => u.role === 'FUNCIONARIO' || u.role === 'DECORADOR',
        )}
        isLoading={createPartialTask.isPending}
        onSubmit={handleCreatePartialTask}
      />

      <EventCompleteDialog
        open={pendingAction?.type === 'complete'}
        event={pendingAction?.type === 'complete' ? pendingAction.event : null}
        isLoading={Boolean(completingId)}
        onConfirm={async (completionItems) => {
          if (pendingAction?.type !== 'complete') return;
          await handleComplete(pendingAction.event.id, completionItems);
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />

      <EventItemEditDialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        eventItem={editingItem}
        categoryName={
          editingItem?.inventoryItem
            ? (categoryMap.get(editingItem.inventoryItem.categoryId) ??
              'Sem categoria')
            : 'Sem categoria'
        }
        isSaving={updateEventItem.isPending}
        onSave={handleSaveItemQuantity}
      />

      <AlertDialog
        open={Boolean(deletingItemTarget)}
        onOpenChange={(open) => {
          if (!open) setDeletingItemTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item do evento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItemTarget &&
                `O item "${deletingItemTarget.item.name}" será removido deste evento e suas ${deletingItemTarget.plannedQuantity} unidade(s) voltarão ao estoque.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(removingItemId)}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveItem}
              disabled={Boolean(removingItemId)}
            >
              {removingItemId ? 'Removendo...' : 'Remover item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

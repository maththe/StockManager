import { useMemo, useState } from "react";
import { Ban, Boxes, CalendarDays, Edit2, Loader2, MapPin, Plus, Trash2, Warehouse } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useClients, useCreateClient } from "~/services/tanStackQuery/clients";
import { useCancelEvent, useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from "~/services/tanStackQuery/events";
import type { Event } from "~/types/event";
import { ClientFormDialog } from "./ClientFormDialog";
import { EventFormDialog } from "./EventFormDialog";
import { EventItemsDialog } from "./EventItemsDialog";

const statusLabel: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
};

const statusClassName: Record<string, string> = {
  PLANNING: "bg-secondary/10 text-secondary ring-1 ring-secondary/30 dark:bg-secondary/20 dark:text-secondary",
  IN_PROGRESS: "bg-primary/10 text-primary ring-1 ring-primary/30 dark:bg-primary/20 dark:text-primary",
  COMPLETED: "bg-accent/10 text-accent ring-1 ring-accent/30 dark:bg-accent/20 dark:text-accent",
  CANCELLED: "bg-destructive/10 text-destructive ring-1 ring-destructive/30 dark:bg-destructive/20 dark:text-destructive",
};

const statsCardClassName = [
  "border shadow-sm",
  "bg-gradient-to-br from-card to-muted/20",
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export function EventsList() {
  const navigate = useNavigate();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [eventItemsDialogOpen, setEventItemsDialogOpen] = useState(false);
  const [itemsEvent, setItemsEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();
  const createClient = useCreateClient();

  const stats = useMemo(() => {
    return {
      total: events.length,
      active: events.filter((event) => event.status === "IN_PROGRESS").length,
      planning: events.filter((event) => event.status === "PLANNING").length,
    };
  }, [events]);

  const handleOpenDialog = (event?: Event) => {
    setEditingEvent(event ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: any) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, data });
    } else {
      await createEvent.mutateAsync(data);
    }
    handleCloseDialog();
  };

  const handleCreateClient = async (data: any) => {
    await createClient.mutateAsync(data);
  };

  const handleManageItems = (event: Event) => {
    setItemsEvent(event);
    setEventItemsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este evento?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteEvent.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este evento? Todos os itens reservados voltarão ao estoque.")) {
      return;
    }

    try {
      setCancellingId(id);
      await cancelEvent.mutateAsync(id);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={[...statsCardClassName, "border-primary/20"].join(" ")}>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary">Total de eventos</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={[...statsCardClassName, "border-secondary/20"].join(" ")}>
          <CardHeader className="pb-2">
            <CardDescription className="text-secondary">Em planejamento</CardDescription>
            <CardTitle className="text-3xl text-secondary">{stats.planning}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={[...statsCardClassName, "border-accent/20"].join(" ")}>
          <CardHeader className="pb-2">
            <CardDescription className="text-accent">Em andamento</CardDescription>
            <CardTitle className="text-3xl text-accent">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5" />
              Agenda de Eventos
            </CardTitle>
            <CardDescription>Clique em um evento para abrir a tela com os itens reservados</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/dashboard/items">
              <Button variant="outline">
                <Warehouse className="mr-2 h-4 w-4" />
                Itens
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setClientDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center backdrop-blur-sm">
              <div className="text-lg font-semibold">Nenhum evento cadastrado</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Crie o primeiro evento e vincule-o a um cliente para comecar a operacao.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboard/events/${event.id}/items`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/dashboard/events/${event.id}/items`);
                    }
                  }}
                  className="rounded-2xl border border-border/80 bg-card/70 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold">{event.eventName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Cliente: {event.client?.companyName ?? "-"}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClassName[event.status]}`}>
                      {statusLabel[event.status]}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <div>{formatDate(event.startDate)} ate {formatDate(event.endDate)}</div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.eventLocation}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-amber-600 hover:text-amber-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(event.id);
                      }}
                      disabled={event.status === "CANCELLED" || cancellingId === event.id}
                    >
                      {cancellingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(event);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageItems(event);
                      }}
                    >
                      <Boxes className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(event.id);
                      }}
                      disabled={deletingId === event.id}
                    >
                      {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
            return;
          }
          setDialogOpen(open);
        }}
        event={editingEvent}
        clients={clients}
        onSubmit={handleSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      <ClientFormDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSubmit={handleCreateClient}
        isLoading={createClient.isPending}
      />

      <EventItemsDialog
        open={eventItemsDialogOpen}
        onOpenChange={(open) => {
          setEventItemsDialogOpen(open);
          if (!open) {
            setItemsEvent(null);
          }
        }}
        event={itemsEvent}
      />
    </div>
  );
}

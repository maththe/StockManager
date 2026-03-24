import { useMemo, useState } from "react";
import { CalendarDays, Edit2, Loader2, Plus, Trash2, Warehouse } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { useClients, useCreateClient } from "~/services/tanStackQuery/clients";
import { useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from "~/services/tanStackQuery/events";
import type { Event } from "~/types/event";
import { ClientFormDialog } from "./ClientFormDialog";
import { EventFormDialog } from "./EventFormDialog";

const statusLabel: Record<string, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const statusClassName: Record<string, string> = {
  PLANNING: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  IN_PROGRESS: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

export function EventsList() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createClient = useCreateClient();

  const stats = useMemo(() => {
    return {
      total: events.length,
      active: events.filter((event) => event.status === "IN_PROGRESS").length,
      planning: events.filter((event) => event.status === "PLANNING").length,
    };
  }, [events]);

  const handleOpenDialog = (event?: Event) => {
    setSelectedEvent(event ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: any) => {
    if (selectedEvent) {
      await updateEvent.mutateAsync({ id: selectedEvent.id, data });
    } else {
      await createEvent.mutateAsync(data);
    }
    handleCloseDialog();
  };

  const handleCreateClient = async (data: any) => {
    await createClient.mutateAsync(data);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-linear-to-br from-sky-100 via-white to-cyan-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total de eventos</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-linear-to-br from-amber-100 via-white to-orange-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Em planejamento</CardDescription>
            <CardTitle className="text-3xl">{stats.planning}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-linear-to-br from-emerald-100 via-white to-lime-50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Em andamento</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
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
            <CardDescription>Gerencie locações, datas e clientes dos eventos</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/dashboard">
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

        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center backdrop-blur-sm">
              <div className="text-lg font-semibold">Nenhum evento cadastrado</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Crie o primeiro evento e vincule-o a um cliente para começar a operação.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={event.id} className={index % 2 === 0 ? "bg-background/30" : "bg-muted/10 hover:bg-muted/20"}>
                      <TableCell className="font-medium">{event.eventName}</TableCell>
                      <TableCell>{event.client?.companyName ?? "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(event.startDate)}
                        <br />
                        {formatDate(event.endDate)}
                      </TableCell>
                      <TableCell>{event.eventLocation}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClassName[event.status]}`}>
                          {statusLabel[event.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(event)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                          >
                            {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        event={selectedEvent}
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
    </div>
  );
}

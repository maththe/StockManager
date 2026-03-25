import { useEffect, useState } from "react";
import { ArrowLeft, Boxes, Loader2, Plus, Save, MapPin, Users, AlertCircle, Package } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useEventItems, useEvents, useUpdateEventItem } from "~/services/tanStackQuery/events";
import { EventItemsDialog } from "./components/EventItemsDialog";
import type { EventItem } from "~/types/event";

function getPlannedQuantityBounds(eventItem: EventItem) {
  const minimum = Math.max(1, eventItem.shippedQuantity, eventItem.returnedQuantity);
  const maximum = eventItem.item.availableQuantity + eventItem.plannedQuantity;
  return { minimum, maximum };
}

function getPlannedQuantityError(eventItem: EventItem, value: string) {
  const nextValue = Number(value);
  const { minimum, maximum } = getPlannedQuantityBounds(eventItem);

  if (!Number.isFinite(nextValue) || !Number.isInteger(nextValue)) {
    return "Informe um numero inteiro.";
  }

  if (nextValue < minimum) {
    if (eventItem.returnedQuantity > eventItem.shippedQuantity) {
      return `A quantidade planejada deve ser pelo menos ${minimum} para cobrir os itens retornados.`;
    }

    if (eventItem.shippedQuantity > 0) {
      return `A quantidade planejada deve ser pelo menos ${minimum} para cobrir os itens enviados.`;
    }

    return "A quantidade planejada deve ser maior que zero.";
  }

  if (nextValue > maximum) {
    return `Estoque insuficiente. O maximo permitido para este evento e ${maximum}.`;
  }

  return null;
}

export default function EventReservedItemsPage() {
  const [eventItemsDialogOpen, setEventItemsDialogOpen] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const { eventId } = useParams();
  const { data: events = [], isLoading: isLoadingEvents } = useEvents();
  const { data: eventItems = [], isLoading: isLoadingItems } = useEventItems(eventId);
  const updateEventItem = useUpdateEventItem();

  const event = events.find((currentEvent) => currentEvent.id === eventId);

  useEffect(() => {
    setDraftQuantities(
      Object.fromEntries(
        eventItems.map((eventItem) => [eventItem.id, String(eventItem.plannedQuantity)]),
      ),
    );
  }, [eventItems]);

  const handleSaveQuantity = async (eventItem: EventItem) => {
    if (!eventId) {
      return;
    }

    const draftValue = draftQuantities[eventItem.id] ?? String(eventItem.plannedQuantity);
    const error = getPlannedQuantityError(eventItem, draftValue);

    if (error) {
      return;
    }

    const nextValue = Number(draftValue);

    if (nextValue === eventItem.plannedQuantity) {
      return;
    }

    try {
      setSavingItemId(eventItem.id);
      await updateEventItem.mutateAsync({
        eventId,
        eventItemId: eventItem.id,
        data: {
          plannedQuantity: nextValue,
        },
      });
    } finally {
      setSavingItemId(null);
    }
  };

  if (isLoadingEvents) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evento nao encontrado</CardTitle>
          <CardDescription>O evento solicitado nao existe ou nao esta disponivel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/events">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para eventos
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Cabeçalho com Informações do Evento */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{event.eventName}</h1>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-muted-foreground/60" />
                <span className="font-medium">Cliente:</span>
                <span>{event.client?.companyName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground/60" />
                <span className="font-medium">Local:</span>
                <span>{event.eventLocation}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setEventItemsDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-sm transition"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar itens
            </Button>
            <Link to="/dashboard/events">
              <Button variant="outline" className="transition">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Card de Itens */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-muted-foreground" />
                Itens Reservados
              </CardTitle>
              <CardDescription>
                {eventItems.length} {eventItems.length === 1 ? "item" : "itens"} vinculado{eventItems.length !== 1 ? "s" : ""} a este evento
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingItems ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Carregando itens...</p>
            </div>
          ) : eventItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="rounded-lg bg-muted p-3 mb-3">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Nenhum item reservado</p>
              <p className="text-xs text-muted-foreground text-center">
                Adicione itens ao evento clicando no botão acima
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {eventItems.map((eventItem) => (
                (() => {
                  const draftValue = draftQuantities[eventItem.id] ?? String(eventItem.plannedQuantity);
                  const error = getPlannedQuantityError(eventItem, draftValue);
                  const isSaving = savingItemId === eventItem.id;
                  const isDirty = Number(draftValue) !== eventItem.plannedQuantity;
                  const { minimum, maximum } = getPlannedQuantityBounds(eventItem);
                  const isLowStock = eventItem.item.availableQuantity < 5;

                  return (
                    <div
                      key={eventItem.id}
                      className={`p-5 transition-colors ${error ? "bg-destructive/5" : "hover:bg-muted/30"}`}
                    >
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                        {/* Informações do Item */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground text-base">
                                  {eventItem.item.name}
                                </h3>
                                {isLowStock && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    Baixo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">SKU: {eventItem.item.skuCode}</p>
                            </div>
                          </div>

                          {/* Info Cards */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg bg-muted p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Planejado</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-foreground">{draftValue}</span>
                                <span className="text-xs text-muted-foreground">unid.</span>
                              </div>
                            </div>
                            <div className="rounded-lg bg-primary/10 p-3">
                              <div className="text-xs font-medium text-primary mb-1">Enviado</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-primary">{eventItem.shippedQuantity}</span>
                                <span className="text-xs text-primary/70">unid.</span>
                              </div>
                            </div>
                            <div className="rounded-lg bg-accent/10 p-3">
                              <div className="text-xs font-medium text-accent mb-1">Retornado</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-accent">{eventItem.returnedQuantity}</span>
                                <span className="text-xs text-accent/70">unid.</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <div className="rounded bg-muted px-2.5 py-1">
                              Estoque: {eventItem.item.availableQuantity} {isLowStock && "⚠"}
                            </div>
                            <div className="rounded bg-muted px-2.5 py-1">
                              Máximo: {maximum}
                            </div>
                            <div className="rounded bg-muted px-2.5 py-1">
                              Mínimo: {minimum}
                            </div>
                          </div>

                          {error && (
                            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span className="font-medium">{error}</span>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-2 lg:items-end">
                          <div className="space-y-2 w-full lg:w-48">
                            <label className="text-xs font-semibold text-foreground block">
                              Ajustar quantidade
                            </label>
                            <Input
                              type="number"
                              min={minimum}
                              max={maximum}
                              value={draftValue}
                              onChange={(e) =>
                                setDraftQuantities((current) => ({
                                  ...current,
                                  [eventItem.id]: e.target.value,
                                }))
                              }
                              disabled={isSaving}
                              className={`h-10 text-center ${isDirty && !error ? "border-primary/30 bg-primary/5" : error ? "border-destructive/30 bg-destructive/5" : ""}`}
                            />
                            {isDirty && !error && (
                              <p className="text-xs text-primary font-medium flex items-center justify-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span>
                                Modificado
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="w-full lg:w-auto transition"
                            onClick={() => handleSaveQuantity(eventItem)}
                            disabled={Boolean(error) || !isDirty || isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EventItemsDialog
        open={eventItemsDialogOpen}
        onOpenChange={setEventItemsDialogOpen}
        event={event}
      />
    </div>
  );
}

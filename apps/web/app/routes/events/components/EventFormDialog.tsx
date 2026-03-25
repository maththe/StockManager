import { FormProvider, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { InputForm } from "~/components/Form/InputForm";
import { SelectForm } from "~/components/Form/SelectForm";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import type { Client } from "~/types/client";
import type { CreateEventInput, Event, EventStatus, UpdateEventInput } from "~/types/event";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  clients: Client[];
  onSubmit: (data: CreateEventInput | UpdateEventInput) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions: Array<{ value: EventStatus; label: string }> = [
  { value: "PLANNING", label: "Planejamento" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

const toDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toIsoString = (value: string) => new Date(value).toISOString();

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  clients,
  onSubmit,
  isLoading = false,
}: EventFormDialogProps) {
  const form = useForm<CreateEventInput>({
    values: event
      ? {
        eventName: event.eventName,
        startDate: toDateTimeLocal(event.startDate),
        endDate: toDateTimeLocal(event.endDate),
        eventLocation: event.eventLocation,
        status: event.status,
        clientId: event.clientId,
        inventoryCountConfirmed: false,
      }
      : {
        eventName: "",
        startDate: "",
        endDate: "",
        eventLocation: "",
        status: "PLANNING",
        clientId: "",
        inventoryCountConfirmed: false,
      },
  });

  const currentStatus = form.watch("status");
  const needsInventoryConfirmation = currentStatus === "COMPLETED" && event?.status !== "COMPLETED";

  const handleSubmit = async (data: CreateEventInput) => {
    await onSubmit({
      ...data,
      startDate: toIsoString(data.startDate),
      endDate: toIsoString(data.endDate),
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl bg-card/75 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-4 py-2">
            <InputForm name="eventName" label="Nome do evento" placeholder="Ex: Feira corporativa" required />
            <InputForm name="eventLocation" label="Local" placeholder="Centro de convenções" required />

            <div className="grid gap-4 md:grid-cols-2">
              <InputForm name="startDate" label="Início" type="datetime-local" required />
              <InputForm name="endDate" label="Fim" type="datetime-local" required />
            </div>

            {needsInventoryConfirmation && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Antes de concluir o evento, confirme que a contagem física dos itens foi realizada.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      id="inventoryCountConfirmed"
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      {...form.register("inventoryCountConfirmed", {
                        validate: (value) =>
                          value || "Confirme a contagem dos itens para finalizar o evento.",
                      })}
                    />
                    <Label htmlFor="inventoryCountConfirmed" className="cursor-pointer text-sm text-destructive">
                      Confirmo que realizei a contagem dos itens e validei o retorno ao estoque.
                    </Label>
                  </div>
                  {form.formState.errors.inventoryCountConfirmed && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.inventoryCountConfirmed.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <SelectForm
                name="status"
                label="Status"
                options={statusOptions}
                placeholder="Selecione o status"
                required
              />
              <SelectForm
                name="clientId"
                label="Cliente"
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.companyName,
                }))}
                placeholder="Selecione um cliente"
                required
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-secondary text-white" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

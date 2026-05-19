import { useEffect, useMemo, useState } from 'react';
import { Loader2, PackagePlus } from 'lucide-react';

import { QuantityField } from '~/components/Form/QuantityInput';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import type { EventItem } from '~/types/event';
import type { CreatePartialTaskInput, Task } from '~/types/task';
import type { User } from '~/types/user';

interface PartialTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventItems: EventItem[];
  eventTasks: Task[];
  funcionarios: User[];
  isLoading: boolean;
  onSubmit: (data: CreatePartialTaskInput) => Promise<void>;
}

interface ItemDraft {
  selected: boolean;
  quantity: string;
}

export function PartialTaskDialog({
  open,
  onOpenChange,
  eventItems,
  eventTasks,
  funcionarios,
  isLoading,
  onSubmit,
}: PartialTaskDialogProps) {
  const alreadyRequestedByEventItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of eventTasks) {
      if (task.status === 'CANCELADA') continue;
      for (const taskItem of task.taskItems ?? []) {
        const current = map.get(taskItem.eventItemId) ?? 0;
        map.set(taskItem.eventItemId, current + taskItem.requestedQuantity);
      }
    }
    return map;
  }, [eventTasks]);

  const remainingByEventItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const ei of eventItems) {
      const already = alreadyRequestedByEventItemId.get(ei.id) ?? 0;
      map.set(ei.id, Math.max(0, ei.plannedQuantity - already));
    }
    return map;
  }, [eventItems, alreadyRequestedByEventItemId]);

  const availableEventItems = useMemo(
    () => eventItems.filter((ei) => (remainingByEventItemId.get(ei.id) ?? 0) > 0),
    [eventItems, remainingByEventItemId],
  );

  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const next: Record<string, ItemDraft> = {};
    for (const ei of availableEventItems) {
      next[ei.id] = {
        selected: false,
        quantity: String(remainingByEventItemId.get(ei.id) ?? 0),
      };
    }
    setDrafts(next);
    setAssignedToId('');
    setNotes('');
  }, [open, availableEventItems, remainingByEventItemId]);

  const toggleSelected = (eventItemId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [eventItemId]: {
        ...prev[eventItemId],
        selected: !prev[eventItemId]?.selected,
      },
    }));
  };

  const setQuantity = (eventItemId: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [eventItemId]: {
        selected: prev[eventItemId]?.selected ?? false,
        quantity: value,
      },
    }));
  };

  const selectedItems = Object.entries(drafts)
    .filter(([, draft]) => draft.selected)
    .map(([eventItemId, draft]) => ({
      eventItemId,
      requestedQuantity: Number(draft.quantity),
    }));

  const hasInvalidQuantity = selectedItems.some((it) => {
    const remaining = remainingByEventItemId.get(it.eventItemId) ?? 0;
    return (
      !Number.isInteger(it.requestedQuantity) ||
      it.requestedQuantity <= 0 ||
      it.requestedQuantity > remaining
    );
  });

  const canSubmit =
    !isLoading && selectedItems.length > 0 && !hasInvalidQuantity;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      items: selectedItems,
      assignedToId: assignedToId || null,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-border/60 bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="h-5 w-5 text-primary" />
            Criar tarefa parcial
          </DialogTitle>
          <DialogDescription>
            Selecione os itens e quantidades que vão sair do galpão nesta tarefa.
            Você pode criar várias tarefas parciais para o mesmo evento.
          </DialogDescription>
        </DialogHeader>

        {availableEventItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Todos os itens deste evento já foram atribuídos a tarefas. Não há
            quantidade restante para criar uma nova tarefa parcial.
          </div>
        ) : (
          <div className="space-y-3">
            {availableEventItems.map((eventItem) => {
              const remaining = remainingByEventItemId.get(eventItem.id) ?? 0;
              const already =
                alreadyRequestedByEventItemId.get(eventItem.id) ?? 0;
              const draft = drafts[eventItem.id] ?? {
                selected: false,
                quantity: String(remaining),
              };
              const quantityNumber = Number(draft.quantity);
              const isInvalid =
                draft.selected &&
                (!Number.isInteger(quantityNumber) ||
                  quantityNumber <= 0 ||
                  quantityNumber > remaining);

              return (
                <div
                  key={eventItem.id}
                  className={`flex items-center gap-3 rounded-xl border bg-card/60 p-3 transition ${
                    draft.selected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`partial-${eventItem.id}`}
                    checked={draft.selected}
                    onChange={() => toggleSelected(eventItem.id)}
                    disabled={isLoading}
                    className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`partial-${eventItem.id}`}
                      className="block truncate text-sm font-semibold text-foreground"
                    >
                      {eventItem.item.name}
                    </Label>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Planejado: {eventItem.plannedQuantity} · Já em tarefas:{' '}
                      {already} · Restante: {remaining}
                    </div>
                  </div>
                  <div className="w-32">
                    <QuantityField
                      id={`partial-qty-${eventItem.id}`}
                      value={draft.quantity}
                      minimum={1}
                      maximum={remaining}
                      disabled={!draft.selected || isLoading}
                      size="compact"
                      onChange={(value) => setQuantity(eventItem.id, value)}
                    />
                    {isInvalid && (
                      <div className="mt-1 text-[0.7rem] text-destructive">
                        Inválido (1 a {remaining})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="partial-task-assignee">
                  Responsável (opcional)
                </Label>
                <select
                  id="partial-task-assignee"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sem responsável definido</option>
                  {funcionarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="partial-task-notes">Notas (opcional)</Label>
                <textarea
                  id="partial-task-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                  placeholder="Instruções para quem vai retirar os itens"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackagePlus className="mr-2 h-4 w-4" />
            )}
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

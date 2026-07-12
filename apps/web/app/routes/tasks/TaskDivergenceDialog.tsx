import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { QuantityField } from '~/components/Form/QuantityInput';
import { Label } from '~/components/ui/label';
import type { CreateTaskDivergenceInput, TaskItem } from '~/types/task';
import { getTaskItemName } from './task-helpers';

export interface TaskDivergenceCandidate {
  taskItem: TaskItem;
  confirmedQuantity: number;
  difference: number;
}

interface DivergenceDraft {
  missingQuantity: number;
  damagedQuantity: number;
  notes: string;
}

interface TaskDivergenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: TaskDivergenceCandidate[];
  isLoading: boolean;
  onSubmit: (data: CreateTaskDivergenceInput) => Promise<void>;
}

export function TaskDivergenceDialog({
  open,
  onOpenChange,
  candidates,
  isLoading,
  onSubmit,
}: TaskDivergenceDialogProps) {
  const [notes, setNotes] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DivergenceDraft>>({});

  useEffect(() => {
    if (!open) return;

    setNotes('');
    setDrafts(
      Object.fromEntries(
        candidates.map((candidate) => [
          candidate.taskItem.id,
          {
            missingQuantity: candidate.difference,
            damagedQuantity: 0,
            notes: '',
          },
        ]),
      ),
    );
  }, [candidates, open]);

  const errors = useMemo(
    () =>
      candidates
        .map((candidate) => {
          const draft = drafts[candidate.taskItem.id];
          const missingQuantity = draft?.missingQuantity ?? 0;
          const damagedQuantity = draft?.damagedQuantity ?? 0;
          const total = missingQuantity + damagedQuantity;

          if (total !== candidate.difference) {
            return `${getTaskItemName(candidate.taskItem)}: faltante + avariado deve ser igual a ${candidate.difference}.`;
          }

          return null;
        })
        .filter(Boolean) as string[],
    [candidates, drafts],
  );

  const canSubmit =
    !isLoading && candidates.length > 0 && errors.length === 0;

  const handleDraftChange = (
    taskItemId: string,
    field: keyof DivergenceDraft,
    value: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [taskItemId]: {
        ...current[taskItemId],
        [field]:
          field === 'notes'
            ? value
            : Math.max(0, Number.parseInt(value, 10) || 0),
      },
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await onSubmit({
      notes: notes.trim() || undefined,
      items: candidates.map((candidate) => {
        const draft = drafts[candidate.taskItem.id];
        return {
          taskItemId: candidate.taskItem.id,
          confirmedQuantity: candidate.confirmedQuantity,
          missingQuantity: draft?.missingQuantity ?? 0,
          damagedQuantity: draft?.damagedQuantity ?? 0,
          notes: draft?.notes?.trim() || undefined,
        };
      }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-border/60 bg-background sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Criar uma divergencia
          </DialogTitle>
          <DialogDescription>
            Relate a diferenca encontrada na tarefa. A tarefa continua pendente
            ate que a quantidade contada bata com a solicitada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {candidates.map((candidate) => {
            const draft = drafts[candidate.taskItem.id];
            return (
              <div
                key={candidate.taskItem.id}
                className="rounded-xl border border-border/60 bg-card/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">
                      {getTaskItemName(candidate.taskItem)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Solicitado: {candidate.taskItem.requestedQuantity} ·
                      Contado: {candidate.confirmedQuantity} · Divergencia:{' '}
                      {candidate.difference}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Faltantes
                    <QuantityField
                      value={draft?.missingQuantity ?? 0}
                      minimum={0}
                      maximum={candidate.difference}
                      size="compact"
                      onChange={(value) =>
                        handleDraftChange(
                          candidate.taskItem.id,
                          'missingQuantity',
                          value,
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-muted-foreground">
                    Avariados
                    <QuantityField
                      value={draft?.damagedQuantity ?? 0}
                      minimum={0}
                      maximum={candidate.difference}
                      size="compact"
                      onChange={(value) =>
                        handleDraftChange(
                          candidate.taskItem.id,
                          'damagedQuantity',
                          value,
                        )
                      }
                    />
                  </label>
                </div>

                <Label className="mt-3 block space-y-1 text-xs font-medium text-muted-foreground">
                  Observacoes
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Descreva o problema encontrado"
                    value={draft?.notes ?? ''}
                    onChange={(event) =>
                      handleDraftChange(
                        candidate.taskItem.id,
                        'notes',
                        event.target.value,
                      )
                    }
                  />
                </Label>
              </div>
            );
          })}

          <Label className="block space-y-1 text-xs font-medium text-muted-foreground">
            Observacao geral
            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Contexto geral da divergencia"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Label>

          {errors.length > 0 && (
            <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              {errors.map((error) => (
                <p key={error} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            type="button"
            className="bg-amber-500 text-black hover:bg-amber-400"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Criar divergencia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

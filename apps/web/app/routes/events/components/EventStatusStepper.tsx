import { Ban, CheckCircle2, ClipboardList, Play } from 'lucide-react';

import { cn } from '~/lib/utils';
import type { EventStatus } from '~/types/event';

const lifecycleSteps: Array<{
  status: EventStatus;
  label: string;
  icon: typeof ClipboardList;
}> = [
  { status: 'PLANNING', label: 'Planejamento', icon: ClipboardList },
  { status: 'IN_PROGRESS', label: 'Em andamento', icon: Play },
  { status: 'COMPLETED', label: 'Concluído', icon: CheckCircle2 },
];

const statusToIndex: Record<EventStatus, number> = {
  PLANNING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: -1,
};

export function EventStatusStepper({ status }: { status: EventStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
        <Ban className="h-3.5 w-3.5" />
        Evento cancelado — itens devolvidos ao estoque
      </div>
    );
  }

  const currentIndex = statusToIndex[status];

  return (
    <div className="flex items-center gap-1.5">
      {lifecycleSteps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.status} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition',
                isCompleted && 'bg-accent/15 text-accent',
                isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                isPending && 'bg-muted/60 text-muted-foreground',
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < lifecycleSteps.length - 1 && (
              <div
                className={cn(
                  'h-px w-4 sm:w-6',
                  index < currentIndex ? 'bg-accent/60' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

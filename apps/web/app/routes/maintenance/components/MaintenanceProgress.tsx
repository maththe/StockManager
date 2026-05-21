import { Check, Settings, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { Maintenance } from '~/types/maintenance';

import { progressSteps, statusIcon, statusLabel, stepOrder } from '../utils/constants';

interface MaintenanceProgressProps {
  status: Maintenance['status'];
}

export function MaintenanceProgress({ status }: MaintenanceProgressProps) {
  const isCancelled = status === 'CANCELADA';
  const currentOrder = stepOrder[status] ?? 0;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-5 w-5" />
          Progresso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCancelled ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            <XCircle className="h-5 w-5" />
            Manutenção cancelada
          </div>
        ) : (
          <div className="flex items-center">
            {progressSteps.map((step, idx) => {
              const StepIcon = statusIcon[step];
              const isComplete = stepOrder[step] < currentOrder;
              const isCurrent = stepOrder[step] === currentOrder;
              const isActive = isComplete || isCurrent;

              return (
                <div
                  key={step}
                  className={idx === 0 ? 'flex items-center' : 'flex flex-1 items-center'}
                >
                  {idx > 0 && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        isComplete || isCurrent ? 'bg-green-500' : 'bg-border'
                      }`}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                        isComplete
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-green-500 text-white ring-4 ring-green-500/20'
                            : 'border-2 border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        isActive
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {statusLabel[step]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

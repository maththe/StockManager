import { AlertTriangle, PackageX } from 'lucide-react';

import type { EventItem } from '~/types/event';
import { getDivergenceQuantity } from '../utils/utils';

export function EventItemDivergenceBadges({
  eventItem,
}: {
  eventItem: EventItem;
}) {
  const missingQuantity = getDivergenceQuantity(eventItem, 'MISSING');
  const damagedQuantity = getDivergenceQuantity(eventItem, 'DAMAGED');
  const divergenceNotes = eventItem.divergences?.find(
    (divergence) => divergence.notes,
  )?.notes;

  if (missingQuantity <= 0 && damagedQuantity <= 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5">
      <div className="flex items-center gap-2 border-b border-destructive/10 px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        <span className="text-xs font-semibold text-destructive">
          Divergências registradas
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          {missingQuantity > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              <PackageX className="h-3.5 w-3.5" />
              Faltantes
              <span className="tabular-nums">{missingQuantity}</span>
            </span>
          )}
          {damagedQuantity > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avariados
              <span className="tabular-nums">{damagedQuantity}</span>
            </span>
          )}
        </div>
        {divergenceNotes && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {divergenceNotes}
          </p>
        )}
      </div>
    </div>
  );
}

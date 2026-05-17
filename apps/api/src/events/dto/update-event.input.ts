import { EventStatus } from '@prisma/client';

export class CompleteEventItemInput {
  eventItemId!: string;
  returnedQuantity!: number;
  missingQuantity?: number;
  damagedQuantity?: number;
  notes?: string;
}

export class UpdateEventInput {
  eventName?: string;
  startDate?: string;
  endDate?: string | null;
  eventLocation?: string;
  status?: EventStatus;
  clientId?: string;
  responsibleId?: string | null;
  inventoryCountConfirmed?: boolean;
  completionItems?: CompleteEventItemInput[];
}

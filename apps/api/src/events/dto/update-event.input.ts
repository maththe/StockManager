import { EventStatus } from '@prisma/client';

export class UpdateEventInput {
  eventName?: string;
  startDate?: string;
  endDate?: string;
  eventLocation?: string;
  status?: EventStatus;
  clientId?: string;
  inventoryCountConfirmed?: boolean;
}

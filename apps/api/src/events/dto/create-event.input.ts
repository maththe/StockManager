import { EventStatus } from '@prisma/client';

export class CreateEventInput {
  eventName!: string;
  startDate!: string;
  endDate?: string | null;
  eventLocation!: string;
  status?: EventStatus;
  clientId!: string;
  responsibleId?: string | null;
  inventoryCountConfirmed?: boolean;
}

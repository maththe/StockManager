import { EventStatus } from '@prisma/client';

export class CreateEventInput {
  eventName!: string;
  startDate!: string;
  endDate!: string;
  eventLocation!: string;
  status?: EventStatus;
  clientId!: string;
  responsibleId?: string | null;
  inventoryCountConfirmed?: boolean;
}

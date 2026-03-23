import { EventStatus } from '@prisma/client';

export class CreateEventInput {
  eventName!: string;
  startDate!: string;
  endDate!: string;
  eventLocation!: string;
  status?: EventStatus;
  clientId!: string;
}

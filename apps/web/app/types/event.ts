export type EventStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EventClient {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
}

export interface Event {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  eventLocation: string;
  status: EventStatus;
  tenantUuid: string;
  clientId: string;
  client: EventClient;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  eventName: string;
  startDate: string;
  endDate: string;
  eventLocation: string;
  status: EventStatus;
  clientId: string;
}

export interface UpdateEventInput {
  eventName?: string;
  startDate?: string;
  endDate?: string;
  eventLocation?: string;
  status?: EventStatus;
  clientId?: string;
}

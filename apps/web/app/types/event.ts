export type EventStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EventClient {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
}

export interface EventItem {
  id: string;
  eventId: string;
  itemId: string;
  plannedQuantity: number;
  shippedQuantity: number;
  returnedQuantity: number;
  tenantUuid: string;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string;
    skuCode: string;
    availableQuantity: number;
    totalQuantity: number;
  };
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
  eventItems?: EventItem[];
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
  inventoryCountConfirmed?: boolean;
}

export interface UpdateEventInput {
  eventName?: string;
  startDate?: string;
  endDate?: string;
  eventLocation?: string;
  status?: EventStatus;
  clientId?: string;
  inventoryCountConfirmed?: boolean;
}

export interface CreateEventItemInput {
  itemId: string;
  plannedQuantity: number;
}

export interface UpdateEventItemInput {
  plannedQuantity?: number;
  shippedQuantity?: number;
  returnedQuantity?: number;
}

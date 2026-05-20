export type EventStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EventClient {
  id: string;
  companyName: string;
  taxId: string;
  contactName?: string | null;
}

export interface EventResponsible {
  id: string;
  name: string;
  email: string;
}

export type DivergenceType = 'MISSING' | 'DAMAGED';
export type DivergenceStatus = 'PENDING' | 'RESOLVED';

export interface EventItemDivergence {
  id: string;
  quantity: number;
  type: DivergenceType;
  status: DivergenceStatus;
  notes?: string | null;
  tenantUuid: string;
  eventItemId: string;
  sourceItemId?: string | null;
  createdAt: string;
  updatedAt: string;
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
  divergences?: EventItemDivergence[];
  item: {
    id: string;
    name: string;
    imageUrl?: string | null;
    availableQuantity: number;
    totalQuantity: number;
  };
}

export interface Event {
  id: string;
  eventName: string;
  startDate: string;
  endDate?: string | null;
  eventLocation: string;
  status: EventStatus;
  tenantUuid: string;
  clientId: string;
  responsibleId?: string | null;
  client: EventClient;
  responsible?: EventResponsible | null;
  eventItems?: EventItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  eventName: string;
  startDate: string;
  endDate?: string | null;
  eventLocation: string;
  status?: EventStatus;
  clientId: string;
  responsibleId?: string | null;
  inventoryCountConfirmed?: boolean;
  completionItems?: CompleteEventItemInput[];
}

export interface CompleteEventItemInput {
  eventItemId: string;
  returnedQuantity: number;
  missingQuantity?: number;
  damagedQuantity?: number;
  notes?: string;
}

export interface UpdateEventInput {
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

export interface CreateEventItemInput {
  itemId: string;
  plannedQuantity: number;
}

export interface UpdateEventItemInput {
  plannedQuantity?: number;
  shippedQuantity?: number;
  returnedQuantity?: number;
}

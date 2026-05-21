export type TaskStatus = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';
export type TaskType = 'SAIDA_GALPAO' | 'ENTRADA_GALPAO';

export interface TaskItemEventItem {
  id: string;
  plannedQuantity: number;
  item: { id: string; name: string };
}

export interface TaskItem {
  id: string;
  requestedQuantity: number;
  confirmedQuantity: number;
  confirmed: boolean;
  notes?: string;
  eventItemId: string;
  eventItem: TaskItemEventItem;
}

export interface TaskEvent {
  id: string;
  eventName: string;
  startDate?: string;
}

export interface TaskUser {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  code: string;
  type: TaskType;
  status: TaskStatus;
  notes?: string;
  tenantUuid: string;
  eventId: string;
  event?: TaskEvent;
  assignedTo?: TaskUser;
  taskItems?: TaskItem[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskInput {
  assignedToId?: string | null;
  notes?: string;
}

export interface ConfirmTaskItemInput {
  taskItemId: string;
  confirmedQuantity: number;
  notes?: string;
}

export interface ConfirmTaskInput {
  items: ConfirmTaskItemInput[];
}

export interface CreateTaskDivergenceItemInput {
  taskItemId: string;
  confirmedQuantity: number;
  missingQuantity?: number;
  damagedQuantity?: number;
  notes?: string;
}

export interface CreateTaskDivergenceInput {
  notes?: string;
  items: CreateTaskDivergenceItemInput[];
}

export interface CreatePartialTaskItemInput {
  eventItemId: string;
  requestedQuantity: number;
  notes?: string;
}

export interface CreatePartialTaskInput {
  items: CreatePartialTaskItemInput[];
  assignedToId?: string | null;
  notes?: string;
}

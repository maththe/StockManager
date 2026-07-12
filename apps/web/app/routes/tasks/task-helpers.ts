import type { Task, TaskItem } from '~/types/task';

// Nome do item da linha da tarefa, independente da origem (evento ou locação).
export function getTaskItemName(taskItem: TaskItem): string {
  return (
    taskItem.eventItem?.item.name ??
    taskItem.rentalItem?.item.name ??
    'Item'
  );
}

// Quantidade total planejada/locada do item na origem, para exibir como referência.
export function getTaskItemPlanned(taskItem: TaskItem): number | null {
  if (taskItem.eventItem) return taskItem.eventItem.plannedQuantity;
  if (taskItem.rentalItem) return taskItem.rentalItem.quantity;
  return null;
}

// Origem da tarefa: título exibível e link para a tela correspondente.
export function getTaskSource(task: Task): {
  label: string;
  href: string | null;
} {
  if (task.rental) {
    const client = task.rental.client?.companyName;
    return {
      label: client
        ? `${task.rental.rentalCode} · ${client}`
        : task.rental.rentalCode,
      href: `/dashboard/rentals/${task.rental.id}`,
    };
  }

  if (task.event) {
    return {
      label: task.event.eventName,
      href: `/dashboard/events/${task.event.id}`,
    };
  }

  return { label: '—', href: null };
}

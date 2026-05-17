import type { Rental, RentalStatus } from '~/types/rental';

export const rentalStatusLabel: Record<RentalStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Em locação',
  RETURNED: 'Devolvida',
  CANCELLED: 'Cancelada',
};

export const rentalStatusDescription: Record<RentalStatus, string> = {
  DRAFT: 'Reserva sendo montada. Itens já estão separados no estoque.',
  ACTIVE: 'Itens entregues ao cliente. Aguardando devolução.',
  RETURNED: 'Locação finalizada. Itens retornaram ao estoque.',
  CANCELLED: 'Locação cancelada. Itens devolvidos ao estoque.',
};

export const rentalStatusClassName: Record<RentalStatus, string> = {
  DRAFT: 'bg-secondary/10 text-secondary ring-1 ring-secondary/30',
  ACTIVE: 'bg-primary/10 text-primary ring-1 ring-primary/30',
  RETURNED: 'bg-accent/10 text-accent ring-1 ring-accent/30',
  CANCELLED: 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
};

export const rentalLifecycleOrder: RentalStatus[] = [
  'DRAFT',
  'ACTIVE',
  'RETURNED',
];

export const isRentalClosed = (status: RentalStatus) =>
  status === 'RETURNED' || status === 'CANCELLED';

export const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const toIsoString = (value: string) => new Date(value).toISOString();

export const formatRentalDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const summarizeRentalItems = (rental: Rental) => {
  const totalUnits = rental.rentalItems.reduce(
    (total, current) => total + current.quantity,
    0,
  );
  const returnedUnits = rental.rentalItems.reduce(
    (total, current) => total + current.returnedQuantity,
    0,
  );
  return { totalUnits, returnedUnits, pending: totalUnits - returnedUnits };
};

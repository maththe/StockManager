import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Hash,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router';
import type { Rental } from '~/types/rental';
import {
  formatRentalDate,
  rentalStatusClassName,
  rentalStatusLabel,
} from '../utils/rental-helpers';

interface RentalItemsHeaderProps {
  rental: Rental | null;
}

export function RentalItemsHeader({ rental }: RentalItemsHeaderProps) {
  const rentalDetailsHref = rental
    ? `/dashboard/rentals/${rental.id}`
    : '/dashboard/rentals';

  return (
    <header className="border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 px-4 py-5 dark:from-background dark:via-card dark:to-muted/20 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          to={rentalDetailsHref}
          aria-label={
            rental
              ? `Voltar para a locação ${rental.rentalCode}`
              : 'Voltar para a locação'
          }
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-x-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar para a locação
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {rental?.client.companyName ?? 'Carregando...'}
            </h1>
            {rental?.status && (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${rentalStatusClassName[rental.status]}`}
              >
                {rentalStatusLabel[rental.status]}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {rental?.rentalCode && (
              <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                <Hash className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {rental.rentalCode}
              </span>
            )}
            {rental?.startDate && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {formatRentalDate(rental.startDate)}
                {' – '}
                {formatRentalDate(rental.returnedAt ?? rental.expectedReturn)}
              </span>
            )}
            {rental?.location && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {rental.location}
              </span>
            )}
            {rental?.client?.contactName && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 flex-shrink-0 text-primary/60" />
                {rental.client.contactName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

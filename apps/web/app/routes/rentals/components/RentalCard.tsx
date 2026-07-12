import {
  Building2,
  CalendarClock,
  Hash,
  MapPin,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { cn } from '~/lib/utils';
import type { Rental } from '~/types/rental';

import {
  formatRentalDate,
  isRentalClosed,
  rentalStatusClassName,
  rentalStatusLabel,
  summarizeRentalItems,
} from '../utils/rental-helpers';

interface RentalCardProps {
  rental: Rental;
}

export function RentalCard({ rental }: RentalCardProps) {
  const navigate = useNavigate();
  const closed = isRentalClosed(rental.status);
  const { totalUnits, pending } = summarizeRentalItems(rental);

  const openRental = () => {
    navigate(`/dashboard/rentals/${rental.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openRental}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRental();
        }
      }}
      className={cn(
        'group cursor-pointer rounded-xl border border-border/50 bg-card/50 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30',
        closed && 'opacity-75',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
            <Building2 className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="line-clamp-1">{rental.client.companyName}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-xs font-semibold text-muted-foreground">
            <Hash className="h-3 w-3" />
            {rental.rentalCode}
          </div>
        </div>
        <span
          className={cn(
            'inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
            rentalStatusClassName[rental.status],
          )}
        >
          {rentalStatusLabel[rental.status]}
        </span>
      </div>

      <div className="space-y-2 border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {formatRentalDate(rental.startDate)}
            {' até '}
            {formatRentalDate(rental.returnedAt ?? rental.expectedReturn)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {rental.location || 'Local não informado'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {rental.rentalItems.length === 0
              ? 'Nenhum item reservado'
              : `${rental.rentalItems.length} ${rental.rentalItems.length === 1 ? 'item' : 'itens'} • ${totalUnits} un.${!closed && pending > 0 ? ` • ${pending} pendente${pending === 1 ? '' : 's'}` : ''}`}
          </span>
        </div>
      </div>
    </div>
  );
}

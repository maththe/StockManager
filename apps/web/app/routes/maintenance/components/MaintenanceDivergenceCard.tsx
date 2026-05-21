import { AlertTriangle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import type { Maintenance } from '~/types/maintenance';

interface MaintenanceDivergenceCardProps {
  divergence: NonNullable<Maintenance['divergence']>;
}

export function MaintenanceDivergenceCard({
  divergence,
}: MaintenanceDivergenceCardProps) {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-orange-800 dark:text-orange-300">
          <AlertTriangle className="h-4 w-4" />
          Origem — Divergência
        </CardTitle>
        <CardDescription>
          Esta manutenção foi gerada automaticamente ao resolver uma divergência
          com itens avariados.
        </CardDescription>
      </CardHeader>
      {divergence.notes && (
        <CardContent>
          <p className="text-sm leading-relaxed text-orange-700 dark:text-orange-300">
            {divergence.notes}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

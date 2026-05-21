import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { Maintenance } from '~/types/maintenance';

interface MaintenanceNotesCardProps {
  notes: NonNullable<Maintenance['notes']>;
}

export function MaintenanceNotesCard({ notes }: MaintenanceNotesCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{notes}</p>
      </CardContent>
    </Card>
  );
}

import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export function MaintenanceDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-6">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

export function MaintenanceNotFound() {
  return (
    <div className="space-y-4">
      <Link to="/dashboard/maintenance">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Manutenções
        </Button>
      </Link>
      <Card className="border-destructive/30 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Manutenção não encontrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verifique se o endereço está correto ou volte para a lista de
            manutenções.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

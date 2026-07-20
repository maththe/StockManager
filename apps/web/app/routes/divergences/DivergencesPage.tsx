import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PackageX,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  useDivergences,
  type Divergence,
} from '~/services/tanStackQuery/divergences';
import {
  SOURCE_LABEL,
  STATUS_CLASS,
  STATUS_LABEL,
  formatDateTime,
  sumByType,
} from './labels';

function DivergenceCard({ divergence }: { divergence: Divergence }) {
  const missingQuantity = sumByType(divergence, 'MISSING');
  const damagedQuantity = sumByType(divergence, 'DAMAGED');

  return (
    <Link to={`/dashboard/divergences/${divergence.id}`}>
      <Card className="cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[divergence.status]}`}
                >
                  {STATUS_LABEL[divergence.status]}
                </span>
                <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                  {SOURCE_LABEL[divergence.source] ?? divergence.source}
                </span>
              </div>
              <CardTitle className="mt-2 flex flex-wrap gap-2 text-base">
                {missingQuantity > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                    <PackageX className="h-3.5 w-3.5" />
                    Faltantes
                    <span className="tabular-nums">{missingQuantity}</span>
                  </span>
                )}
                {damagedQuantity > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Avariados
                    <span className="tabular-nums">{damagedQuantity}</span>
                  </span>
                )}
              </CardTitle>
            </div>
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatDateTime(divergence.occurredAt)}</span>
            {divergence.createdBy && (
              <span className="truncate text-xs">
                {divergence.createdBy.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DivergencesPage() {
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'RESOLVED'
  >('ALL');

  const { data: divergences = [], isLoading } = useDivergences();

  const stats = useMemo(
    () => ({
      total: divergences.length,
      pending: divergences.filter((d) => d.status === 'PENDING').length,
      resolved: divergences.filter((d) => d.status === 'RESOLVED').length,
    }),
    [divergences],
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return divergences;
    return divergences.filter((d) => d.status === statusFilter);
  }, [divergences, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Divergências</h1>
        <p className="text-sm text-muted-foreground">
          Faltas e avarias registradas em eventos e locações.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <Timer className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.pending}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Pendentes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/10">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.resolved}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Resolvidas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as 'ALL' | 'PENDING' | 'RESOLVED')
          }
        >
          <SelectTrigger className="w-48 border-border/60">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="RESOLVED">Resolvidas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} divergência(s)
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <CardTitle className="text-muted-foreground">
                Nenhuma divergência encontrada
              </CardTitle>
              <CardDescription className="mt-1">
                Divergências são registradas ao confirmar tarefas ou concluir
                eventos com faltas e avarias.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((divergence) => (
            <DivergenceCard key={divergence.id} divergence={divergence} />
          ))}
        </div>
      )}
    </div>
  );
}

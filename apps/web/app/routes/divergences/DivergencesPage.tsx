import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Package,
  PackageX,
  Settings,
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
  TYPE_LABEL,
  formatDate,
  formatDateTime,
  sourceTitle,
  sumByType,
  sumUnits,
} from './labels';

const ITEMS_VISIVEIS = 3;

function DivergenceCard({ divergence }: { divergence: Divergence }) {
  const missingQuantity = sumByType(divergence, 'MISSING');
  const damagedQuantity = sumByType(divergence, 'DAMAGED');
  const totalUnits = sumUnits(divergence);
  const itensVisiveis = divergence.items.slice(0, ITEMS_VISIVEIS);
  const itensRestantes = divergence.items.length - itensVisiveis.length;
  const manutencoes = divergence.maintenances?.length ?? 0;
  const isPending = divergence.status === 'PENDING';

  return (
    <Link to={`/dashboard/divergences/${divergence.id}`} className="group">
      <Card className="flex h-full cursor-pointer flex-col border-border/60 transition-all group-hover:border-primary/40 group-hover:shadow-md">
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

              {/* O que identifica a divergência é a origem: qual evento/locação. */}
              <CardTitle className="mt-2 truncate text-base">
                {sourceTitle(divergence)}
              </CardTitle>
              {(divergence.sourceRef?.clientName ||
                divergence.sourceRef?.date) && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {divergence.sourceRef?.clientName && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {divergence.sourceRef.clientName}
                    </span>
                  )}
                  {divergence.sourceRef?.clientName &&
                    divergence.sourceRef?.date &&
                    ' · '}
                  {divergence.sourceRef?.date &&
                    formatDate(divergence.sourceRef.date)}
                </p>
              )}
            </div>
            <AlertTriangle
              className={`mt-1 h-5 w-5 shrink-0 ${isPending ? 'text-yellow-500' : 'text-muted-foreground/50'}`}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              {divergence.items.length} item(ns) · {totalUnits} un.
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 pt-0">
          {/* Quais itens: sem isso o card não diz o que se perdeu. */}
          <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-2.5">
            {itensVisiveis.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0 truncate text-foreground">
                  {item.item.name}
                </span>
                <span
                  className={`shrink-0 font-medium tabular-nums ${
                    item.type === 'MISSING'
                      ? 'text-destructive'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {TYPE_LABEL[item.type]} {item.quantity}
                </span>
              </div>
            ))}
            {itensRestantes > 0 && (
              <p className="text-xs text-muted-foreground">
                +{itensRestantes} item(ns)
              </p>
            )}
          </div>

          {divergence.notes && (
            <p className="line-clamp-2 text-xs italic text-muted-foreground">
              “{divergence.notes}”
            </p>
          )}

          {manutencoes > 0 && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <Settings className="h-3.5 w-3.5" />
              {manutencoes} manutenção(ões)
            </span>
          )}

          <div className="mt-auto space-y-0.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
            <p className="truncate">
              Registrada em {formatDateTime(divergence.occurredAt)}
              {divergence.createdBy && ` por ${divergence.createdBy.name}`}
            </p>
            {!isPending && divergence.resolvedAt && (
              <p className="truncate text-green-700 dark:text-green-400">
                Resolvida em {formatDateTime(divergence.resolvedAt)}
                {divergence.resolvedBy && ` por ${divergence.resolvedBy.name}`}
              </p>
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

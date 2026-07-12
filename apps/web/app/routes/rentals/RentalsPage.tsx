import { useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';

import { StatCard } from '~/components/StatCard';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useClients } from '~/services/tanStackQuery/clients';
import { useCreateRental, useRentals } from '~/services/tanStackQuery/rentals';
import type {
  CreateRentalInput,
  UpdateRentalInput,
  RentalStatus,
} from '~/types/rental';

import { RentalCard } from './components/RentalCard';
import { RentalFormDialog } from './components/RentalFormDialog';

const statusFilters: Array<{ value: RentalStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'ACTIVE', label: 'Em locação' },
  { value: 'RETURNED', label: 'Devolvidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

export default function RentalsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rentals = [], isLoading } = useRentals(search);
  const { data: clients = [] } = useClients();

  const createRental = useCreateRental();

  const stats = useMemo(
    () => ({
      total: rentals.length,
      draft: rentals.filter((rental) => rental.status === 'DRAFT').length,
      active: rentals.filter((rental) => rental.status === 'ACTIVE').length,
      returned: rentals.filter((rental) => rental.status === 'RETURNED').length,
    }),
    [rentals],
  );

  const filteredRentals = useMemo(() => {
    if (statusFilter === 'ALL') return rentals;
    return rentals.filter((rental) => rental.status === statusFilter);
  }, [rentals, statusFilter]);

  const handleOpenCreate = () => {
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateRentalInput | UpdateRentalInput) => {
    await createRental.mutateAsync(data as CreateRentalInput);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locações</h1>
          <p className="mt-1.5 max-w-xl text-muted-foreground">
            Gerencie o ciclo completo: rascunho, retirada, devolução e cancelamentos.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-secondary font-medium text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Locação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Sparkles}
          tone="muted"
        />
        <StatCard
          label="Rascunhos"
          value={stats.draft}
          icon={PackageOpen}
          tone="secondary"
        />
        <StatCard
          label="Em locação"
          value={stats.active}
          icon={CalendarClock}
          tone="primary"
        />
        <StatCard
          label="Devolvidas"
          value={stats.returned}
          icon={CheckCircle2}
          tone="accent"
        />
      </div>

      {/* List */}
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-bold">Contratos de locação</CardTitle>
            <CardDescription>
              Acompanhe cada contrato e os itens reservados no estoque.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por código, cliente ou local..."
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as RentalStatus | 'ALL')
              }
            >
              <SelectTrigger aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando locações...
            </div>
          ) : rentals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
              <PackageOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
              <div className="mb-2 text-lg font-semibold text-foreground">
                Nenhuma locação cadastrada
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Crie a primeira locação para começar a controlar contratos e estoque.
              </p>
              <Button
                onClick={handleOpenCreate}
                className="bg-gradient-to-r from-primary to-secondary text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Locação
              </Button>
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
              Nenhuma locação encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredRentals.map((rental) => (
                <RentalCard key={rental.id} rental={rental} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RentalFormDialog
        open={dialogOpen}
        rental={null}
        clients={clients}
        isLoading={createRental.isPending}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}


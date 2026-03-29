import { useDeferredValue, useMemo, useState } from 'react';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { matchesSearch } from '~/lib/search';
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '~/services/tanStackQuery/clients';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '~/types/client';
import { ClientFormDialog } from '~/routes/clients/components/ClientFormDialog';

export function ClientsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim() || undefined;

  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const filteredClients = useMemo(
    () =>
      clients.filter((client) =>
        matchesSearch(
          [client.companyName, client.taxId, client.contactName],
          normalizedSearch,
        ),
      ),
    [clients, normalizedSearch],
  );

  const handleOpenDialog = (client?: Client) => {
    setSelectedClient(client ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedClient(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: CreateClientInput | UpdateClientInput) => {
    if (selectedClient) {
      await updateClient.mutateAsync({
        id: selectedClient.id,
        data,
      });
    } else {
      await createClient.mutateAsync(data as CreateClientInput);
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteClient.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Gerenciar Clientes</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Total de {filteredClients.length} cliente
              {filteredClients.length !== 1 ? 's' : ''} cadastrado
              {filteredClients.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar clientes..."
                className="w-full sm:w-80 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Nenhum cliente encontrado
              </div>
              <div className="text-muted-foreground">
                Crie um novo cliente ou ajuste o filtro de pesquisa.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/5 to-background shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/30">
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">CNPJ/CPF</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Contato</TableHead>
                    <TableHead className="text-center font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground py-4">
                        {client.companyName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-4 hidden sm:table-cell">
                        {client.taxId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-4 hidden md:table-cell">
                        {client.contactName || '-'}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(client)}
                            className="border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                          >
                            {deletingId === client.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
        client={selectedClient}
        onSubmit={handleSubmit}
        isLoading={createClient.isPending || updateClient.isPending}
      />
    </div>
  );
}

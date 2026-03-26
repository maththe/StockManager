import { useDeferredValue, useMemo, useState } from "react";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { matchesSearch } from "~/lib/search";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "~/services/tanStackQuery/clients";
import type { Client, CreateClientInput, UpdateClientInput } from "~/types/client";
import { ClientFormDialog } from "~/routes/events/components/ClientFormDialog";

export function ClientsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
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
        matchesSearch([client.companyName, client.taxId, client.contactName], normalizedSearch),
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
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
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
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Clientes</CardTitle>
            <CardDescription>
              {filteredClients.length} cliente{filteredClients.length !== 1 ? "s" : ""} listado{filteredClients.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar clientes..."
              className="w-72 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30"
            />

            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center backdrop-blur-sm">
              <div className="text-lg font-semibold">Nenhum cliente encontrado</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Crie um novo cliente ou ajuste o filtro de pesquisa.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-center">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, index) => (
                    <TableRow key={client.id} className={index % 2 === 0 ? "bg-background/30" : "bg-muted/10 hover:bg-muted/20"}>
                      <TableCell className="font-medium">{client.companyName}</TableCell>
                      <TableCell>{client.taxId}</TableCell>
                      <TableCell>{client.contactName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(client)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                          >
                            {deletingId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

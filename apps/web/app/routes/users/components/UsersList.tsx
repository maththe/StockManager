import { useDeferredValue, useMemo, useState } from "react";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { matchesSearch } from "~/lib/search";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "~/services/tanStackQuery/users";
import type { CreateUserInput, UpdateUserInput, User } from "~/types/user";
import { UserFormDialog } from "./UserFormDialog";

export function UsersList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim() || undefined;

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => matchesSearch([user.name, user.email], normalizedSearch)),
    [normalizedSearch, users],
  );

  const handleOpenDialog = (user?: User) => {
    setSelectedUser(user ?? null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    if (selectedUser) {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data,
      });
    } else {
      await createUser.mutateAsync(data as CreateUserInput);
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuario?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteUser.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Usuarios</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} listado{filteredUsers.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar usuarios..."
              className="w-72 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring/30"
            />

            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-primary to-secondary text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuario
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center backdrop-blur-sm">
              <div className="text-lg font-semibold">Nenhum usuario encontrado</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Cadastre um novo usuario ou ajuste o filtro de pesquisa.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id} className={index % 2 === 0 ? "bg-background/30" : "bg-muted/10 hover:bg-muted/20"}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
        user={selectedUser}
        onSubmit={handleSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
      />
    </div>
  );
}

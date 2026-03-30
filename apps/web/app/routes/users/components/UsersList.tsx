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
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '~/services/tanStackQuery/users';
import type { CreateUserInput, UpdateUserInput, User } from '~/types/user';
import { UserFormDialog } from './UserFormDialog';

export function UsersList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim() || undefined;

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesSearch([user.name, user.email], normalizedSearch),
      ),
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
    if (!confirm('Tem certeza que deseja excluir este usuario?')) {
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
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              Gerenciar Usuários
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Total de {filteredUsers.length} usuário
              {filteredUsers.length !== 1 ? 's' : ''} cadastrado
              {filteredUsers.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar usuários..."
                className="w-full sm:w-80 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Nenhum usuário encontrado
              </div>
              <div className="text-muted-foreground">
                Cadastre um novo usuário ou ajuste o filtro de pesquisa.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/5 to-background shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/30">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground py-4">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-4 hidden sm:table-cell">
                        {user.email}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                            className="border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDelete(user.id)}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
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

import { useState } from 'react';
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
import {
  useCategories,
  useDeleteCategory,
} from '~/services/tanStackQuery/Itens/categories';
import { CategoriesDialog } from './CategoriesDialog';
import type { Category } from '~/types/category';

export function CategoriesList() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useCategories(
    search || undefined,
  );
  const deleteCategory = useDeleteCategory();

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedCategory(null);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Gerenciar Categorias</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Total de {categories.length} categor
              {categories.length !== 1 ? 'ias' : 'ia'} cadastrada
              {categories.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar categorias..."
                className="w-full sm:w-64 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nova Categoria
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Nenhuma categoria encontrada
              </div>
              <div className="text-muted-foreground">
                Clique em "Nova Categoria" para começar a organizar seus itens.
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/5 to-background shadow-sm">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-muted/30">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Descrição</TableHead>
                    <TableHead className="text-center font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow
                      key={category.id}
                      className="border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground py-4">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-4 hidden sm:table-cell">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(category)}
                            className="border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                          >
                            {deletingId === category.id ? (
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

      <CategoriesDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        category={selectedCategory}
      />
    </div>
  );
}

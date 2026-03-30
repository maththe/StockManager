import { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  useCategories,
  useDeleteCategory,
} from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';
import type { Category } from '~/types/category';
import { CategoriesDialog } from '~/routes/categories/components/CategoriesDialog';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: items = [] } = useItems();
  const deleteCategory = useDeleteCategory();

  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.categoryId]) {
        acc[item.categoryId] = [];
      }
      acc[item.categoryId].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

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

  const handleDelete = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      setDeletingId(categoryId);
      await deleteCategory.mutateAsync(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Inventário</h1>
        <p className="text-muted-foreground">
          Gerencie suas categorias e visualize os itens em estoque
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          Total:{' '}
          <span className="font-semibold text-foreground">
            {categories.length}
          </span>{' '}
          categoria{categories.length !== 1 ? 's' : ''}
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-14 w-14 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma categoria criada
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
              Crie sua primeira categoria para começar a organizar seus itens
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-to-r from-primary to-secondary text-white font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const categoryItems = itemsByCategory[category.id] || [];
            const totalQuantity = categoryItems.reduce(
              (sum, item) => sum + item.availableQuantity,
              0,
            );

            return (
              <Card
                key={category.id}
                className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/50 bg-card/50 hover:bg-card/70 backdrop-blur-sm"
                onClick={() => navigate(`/dashboard/inventory/${category.id}`)}
              >
                <CardHeader className="pb-4 border-b border-border/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(category);
                        }}
                        className="h-8 w-8 p-0 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDelete(category.id, e)}
                        disabled={deletingId === category.id}
                        className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Itens
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {categoryItems.length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Disponíveis
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {totalQuantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Clique para visualizar detalhes
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CategoriesDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        category={selectedCategory}
      />
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ItemsList } from '~/routes/items/components/itemsList';
import { useCategories } from '~/services/tanStackQuery/Itens/categories';
import { useItems } from '~/services/tanStackQuery/Itens/items';

export default function CategoryDetailsPage() {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: items = [] } = useItems();

  const category = categories.find((cat) => cat.id === categoryId);
  const categoryItems = items.filter((item) => item.categoryId === categoryId);

  if (categoriesLoading) {
    return <div className="py-8 text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!category) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/inventory')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-destructive">Categoria nao encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-border/50 hover:bg-muted"
            onClick={() => navigate('/dashboard/inventory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {categoryItems.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-accent">
              Quantidade Disponivel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">
              {categoryItems.reduce(
                (sum, item) => sum + item.availableQuantity,
                0,
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-secondary">
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">
              R${' '}
              {categoryItems
                .reduce(
                  (sum, item) =>
                    sum + item.availableQuantity * Number(item.unitCost),
                  0,
                )
                .toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <ItemsList
        categoryId={category.id}
        title="Itens"
        description={`${categoryItems.length} item${categoryItems.length !== 1 ? 'ns' : ''} nesta categoria`}
        searchPlaceholder="Pesquisar por nome..."
        emptyTitle="Nenhum item nesta categoria"
        emptyDescription='Clique em "Novo Item" para adicionar um item.'
        showSubtotalColumn
        cardClassName="border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm"
        tableWrapperClassName="overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/5 to-background shadow-sm"
      />
    </div>
  );
}

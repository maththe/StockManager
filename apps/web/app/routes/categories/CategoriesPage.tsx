import { CategoriesList } from './components/CategoriesList';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
        <p className="text-muted-foreground">
          Gerencie as categorias de produtos do seu inventário
        </p>
      </div>
      <CategoriesList />
    </div>
  );
}

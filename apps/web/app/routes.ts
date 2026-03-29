import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('dashboard', 'routes/dashboard/DashboardLayout.tsx', [
    index('routes/dashboard/DashboardIndexRedirect.tsx'),
    route('inventory', 'routes/inventory/InventoryPage.tsx'),
    route('inventory/:categoryId', 'routes/inventory/CategoryDetailsPage.tsx'),
    route('categories', 'routes/categories/CategoriesPage.tsx'),
    route('items', 'routes/items/ItemsPage.tsx'),
    route('clients', 'routes/clients/ClientsPage.tsx'),
    route('users', 'routes/users/UsersPage.tsx'),
    route('events', 'routes/events/EventsLayout.tsx', [
      index('routes/events/EventsPage.tsx'),
      route(':eventId/items', 'routes/events/EventReservedItemsPage.tsx'),
    ]),
  ]),
] satisfies RouteConfig;

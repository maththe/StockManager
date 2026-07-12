import {
  type RouteConfig,
  index,
  prefix,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('register', 'routes/users/RegisterPage.tsx'),
  route('dashboard', 'routes/dashboard/DashboardLayout.tsx', [
    index('routes/dashboard/DashboardIndexRedirect.tsx'),
    route('inventory', 'routes/inventory/InventoryPage.tsx'),
    route('inventory/:categoryId', 'routes/inventory/CategoryDetailsPage.tsx'),
    route('categories', 'routes/categories/CategoriesPage.tsx'),
    route('clients', 'routes/clients/ClientsPage.tsx'),
    route('users', 'routes/users/UsersPage.tsx'),
    ...prefix('rentals', [
      index('routes/rentals/RentalsPage.tsx'),
      route(':rentalId', 'routes/rentals/RentalDetailsPage.tsx'),
      route(':rentalId/items', 'routes/rentals/RentalItemsPage.tsx'),
    ]),
    route('calendar', 'routes/calendar/CalendarPage.tsx'),
    ...prefix('events', [
      index('routes/events/EventsPage.tsx'),
      route(':eventId', 'routes/events/EventDetailsPage.tsx'),
      route(':eventId/items', 'routes/events/EventReservedItemsPage.tsx'),
    ]),
    route('tasks', 'routes/tasks/TasksPage.tsx'),
    route('tasks/:taskId', 'routes/tasks/TaskDetailsPage.tsx'),
    route('maintenance', 'routes/maintenance/MaintenancePage.tsx'),
    route('maintenance/:maintenanceId', 'routes/maintenance/MaintenanceDetailsPage.tsx'),
  ]),
] satisfies RouteConfig;

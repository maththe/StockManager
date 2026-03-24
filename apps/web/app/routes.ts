import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard/DashboardLayout.tsx", [
    index("routes/items/ItemsPage.tsx"),
    route("events", "routes/events/EventsPage.tsx"),
  ]),
] satisfies RouteConfig;

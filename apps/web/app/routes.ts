import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/items/ItemsPage.tsx"),
  route("dashboard/events", "routes/events/EventsPage.tsx"),
] satisfies RouteConfig;

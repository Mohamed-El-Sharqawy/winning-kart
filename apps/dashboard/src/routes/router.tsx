import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import { AuthPage } from "@/pages/auth";

const rootRoute = createRootRoute();

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
});

const routeTree = rootRoute.addChildren([authRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

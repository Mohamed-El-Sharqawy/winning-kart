import { redirect } from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { sessionQueryOptions } from "@/shared/services/session.service";
import { portalClientQueryOptions } from "@/shared/services/portal-client.service";
import { CLIENT_WORKSPACE_TABS } from "@/shared/data/roles.data";
import type { Client } from "@/shared/types/clients.types";
import type { WorkspaceTab } from "./search";

async function loadSession() {
  return queryClient.fetchQuery(sessionQueryOptions());
}

export async function requireAdmin() {
  const session = await loadSession();
  if (!session) throw redirect({ to: "/auth" });
  if (session.role !== "admin") throw redirect({ to: "/portal" });
}

export async function requireClient() {
  const session = await loadSession();
  if (!session) throw redirect({ to: "/auth" });
  if (session.role !== "client") throw redirect({ to: "/overview" });
}

export async function requireWorkspaceAccess(params: { slug: string }, tab: WorkspaceTab) {
  const session = await loadSession();
  if (!session) throw redirect({ to: "/auth" });
  if (session.role === "admin") return;
  let client: Client | null = null;
  if (session.role === "client") {
    try {
      client = await queryClient.fetchQuery(portalClientQueryOptions());
    } catch {
      client = null;
    }
  }
  if (client === null || client.slug !== params.slug) {
    throw redirect({ to: "/portal" });
  }
  if (!CLIENT_WORKSPACE_TABS.includes(tab)) {
    throw redirect({ to: "/clients/$slug", params, search: { tab: "campaigns" } });
  }
}

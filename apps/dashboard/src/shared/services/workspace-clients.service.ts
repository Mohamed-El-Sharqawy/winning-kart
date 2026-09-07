import { useQuery } from "@tanstack/react-query";
import { clientsQueryOptions } from "@/shared/services/clients.service";
import { portalClientQueryOptions } from "@/shared/services/portal-client.service";
import { useSession } from "@/shared/services/session.service";
import type { Client } from "@/shared/types/clients.types";

export interface WorkspaceClientsResult {
  data: Client[] | undefined;
  isPending: boolean;
  isError: boolean;
}

export function useWorkspaceClients(): WorkspaceClientsResult {
  const { data: session, isPending: sessionPending } = useSession();
  const isClient = session?.role === "client";
  const agencyClients = useQuery({
    ...clientsQueryOptions(),
    enabled: !sessionPending && !isClient,
  });
  const portalClient = useQuery({
    ...portalClientQueryOptions(),
    enabled: !sessionPending && isClient,
  });

  if (sessionPending || session === undefined) {
    return { data: undefined, isPending: true, isError: false };
  }
  if (isClient) {
    return {
      data: portalClient.data === undefined ? undefined : [portalClient.data],
      isPending: portalClient.isPending,
      isError: portalClient.isError,
    };
  }
  return {
    data: agencyClients.data,
    isPending: agencyClients.isPending,
    isError: agencyClients.isError,
  };
}

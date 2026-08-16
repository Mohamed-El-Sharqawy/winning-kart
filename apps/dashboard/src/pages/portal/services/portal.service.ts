import { queryOptions, useQuery } from "@tanstack/react-query";
import { asErrorClass, looseApi } from "@/shared/lib/loose-api";
import type { PortalOverviewResponseDto } from "../dto/portal.dto";
import { toPortalOverview } from "../transformers/portal.transformer";
import type { PortalOverview } from "../types/portal.types";

export const NO_CLIENT_ASSIGNMENT = "NO_CLIENT_ASSIGNMENT";

export class PortalApiError extends Error {
  readonly errorClass: string | null;

  constructor(message: string, errorClass: string | null) {
    super(message);
    this.name = "PortalApiError";
    this.errorClass = errorClass;
  }
}

export function portalOverviewQueryOptions(days: number) {
  return queryOptions({
    queryKey: ["portal", "overview", days],
    queryFn: async (): Promise<PortalOverview> => {
      const { data: body, error } = await looseApi.portal.overview.get({ query: { days } });
      if (error) throw new PortalApiError("Failed to load your dashboard", asErrorClass(error));
      const payload = (body as { data: PortalOverviewResponseDto }).data;
      return toPortalOverview(payload);
    },
  });
}

export function usePortalOverview(days: number) {
  return useQuery(portalOverviewQueryOptions(days));
}

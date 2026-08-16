import { queryOptions, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { AuditLogDto } from "../dto/audit-logs.dto";
import { toAuditLogs } from "../transformers/audit-logs.transformer";
import type { AuditLog, AuditLogFilters } from "../types/audit-logs.types";

export function auditLogsQueryOptions(filters: AuditLogFilters) {
  return queryOptions({
    queryKey: ["audit-logs", filters],
    queryFn: async (): Promise<AuditLog[]> => {
      const query: Record<string, string | number> = { days: filters.days };
      if (filters.action.length > 0) query.action = filters.action;
      if (filters.outcome !== "") query.outcome = filters.outcome;
      const { data: body, error } = await looseApi["audit-logs"].get({ query });
      if (error) throw new Error("Failed to load audit log");
      return toAuditLogs((body as { data: AuditLogDto[] }).data);
    },
  });
}

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery(auditLogsQueryOptions(filters));
}

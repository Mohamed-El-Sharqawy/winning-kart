import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed } from "./api-call-error";
import { toAlerts } from "../transformers/alerts.transformer";
import { toTask } from "../transformers/tasks.transformer";
import type { Alert, AlertListStatus, AlertSeverity } from "../types/alerts.types";
import type { AlertDto, OkDto } from "../dto/alerts.dto";
import type { TaskDto } from "../dto/tasks.dto";

export interface AlertsFilter {
  status: AlertListStatus;
  clientId?: string;
  severity?: AlertSeverity;
}

export function alertsQueryOptions({ status, clientId, severity }: AlertsFilter) {
  return queryOptions({
    queryKey: ["alerts", status, clientId ?? null, severity ?? null],
    queryFn: async (): Promise<Alert[]> => {
      const query: Record<string, string> = { status };
      if (clientId !== undefined) query.clientId = clientId;
      if (severity !== undefined) query.severity = severity;
      const { data: body, error } = await looseApi.alerts.get({ query });
      if (error) throw new Error("Failed to load alerts");
      return toAlerts((body as { data: AlertDto[] }).data);
    },
  });
}

export function useAlerts(filter: AlertsFilter) {
  return useQuery(alertsQueryOptions(filter));
}

function useInvalidateAlerts() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    void queryClient.invalidateQueries({ queryKey: ["bell"] });
  };
}

export function useAcknowledgeAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const { data: body, error } = await looseApi.alerts({ id }).acknowledge.post(null);
      if (error) throw callFailed(error, "Failed to acknowledge alert");
      return Boolean((body as { data: OkDto | null }).data?.ok);
    },
    onSettled: invalidate,
  });
}

export function useSnoozeAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: async (input: { id: string; hours: 1 | 24 }): Promise<boolean> => {
      const { data: body, error } = await looseApi.alerts({ id: input.id }).snooze.post({ hours: input.hours });
      if (error) throw callFailed(error, "Failed to snooze alert");
      return Boolean((body as { data: OkDto | null }).data?.ok);
    },
    onSettled: invalidate,
  });
}

export function useDismissAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: async (input: { id: string; reason: string }): Promise<boolean> => {
      const { data: body, error } = await looseApi.alerts({ id: input.id }).dismiss.post({ reason: input.reason });
      if (error) throw callFailed(error, "Failed to dismiss alert");
      return Boolean((body as { data: OkDto | null }).data?.ok);
    },
    onSettled: invalidate,
  });
}

export function useCreateTaskFromAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: body, error } = await looseApi.alerts({ id })["create-task"].post(null);
      if (error) throw callFailed(error, "Failed to create task from alert");
      return toTask((body as { data: TaskDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      void queryClient.invalidateQueries({ queryKey: ["bell"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

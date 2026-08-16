import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import { callFailed } from "./api-call-error";
import { toTask, toTasks } from "../transformers/tasks.transformer";
import type { Task, TaskStatus } from "../types/tasks.types";
import type { CreateTaskDto, TaskDto, TaskListItemDto, TaskPatchDto } from "../dto/tasks.dto";

interface PatchEndpoint {
  patch(body: unknown): Promise<{ data: unknown; error: unknown }>;
}

const patchApi = looseApi as unknown as {
  tasks: (param: string | Record<string, string | number>) => PatchEndpoint;
};

export function tasksQueryOptions(status?: TaskStatus) {
  return queryOptions({
    queryKey: ["tasks", status ?? null],
    queryFn: async (): Promise<Task[]> => {
      const { data: body, error } = await looseApi.tasks.get(
        status !== undefined ? { query: { status } } : undefined,
      );
      if (error) throw new Error("Failed to load tasks");
      return toTasks((body as { data: TaskListItemDto[] }).data);
    },
  });
}

export function useTasks(status?: TaskStatus) {
  return useQuery(tasksQueryOptions(status));
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskDto): Promise<Task> => {
      const { data: body, error } = await looseApi.tasks.post(input);
      if (error) throw callFailed(error, "Failed to create task");
      return toTask((body as { data: TaskDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function usePatchTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & TaskPatchDto): Promise<Task> => {
      const { id, ...patch } = input;
      const { data: body, error } = await patchApi.tasks({ id }).patch(patch);
      if (error) throw callFailed(error, "Failed to update task");
      return toTask((body as { data: TaskDto }).data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

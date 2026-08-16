export type TaskStatusDto = "todo" | "in_progress" | "done" | "skipped";

export type TaskPriorityDto = "low" | "medium" | "high" | "urgent";

export type TaskSourceDto = "manual" | "alert" | "recommendation";

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  adAccountId: string | null;
  entityLevel: string | null;
  entityId: string | null;
  entityName: string | null;
  priority: TaskPriorityDto;
  assigneeUserId: string | null;
  dueDate: string | null;
  status: TaskStatusDto;
  source: TaskSourceDto;
  linkedAlertId: string | null;
  linkedInsightId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListItemDto extends TaskDto {
  assigneeName: string | null;
  clientName: string | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  clientId?: string;
  adAccountId?: string;
  entityLevel?: string;
  entityId?: string;
  entityName?: string;
  priority?: TaskPriorityDto;
  dueDate?: string;
}

export interface TaskPatchDto {
  status?: TaskStatusDto;
  priority?: TaskPriorityDto;
  assigneeUserId?: string;
  dueDate?: string | null;
}

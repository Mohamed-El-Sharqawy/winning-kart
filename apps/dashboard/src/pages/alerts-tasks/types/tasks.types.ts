export type TaskStatus = "todo" | "in_progress" | "done" | "skipped";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskSource = "manual" | "alert" | "recommendation";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  adAccountId: string | null;
  entityLevel: string | null;
  entityId: string | null;
  entityName: string | null;
  priority: TaskPriority;
  assigneeUserId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  source: TaskSource;
  linkedAlertId: string | null;
  linkedInsightId: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientName: string | null;
}

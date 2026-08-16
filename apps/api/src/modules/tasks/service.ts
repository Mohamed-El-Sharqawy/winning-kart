import { problem } from "../../lib/problem";
import type { Task } from "@wk/db";
import type { TaskListFilter, TaskUpdatePatch } from "./model";
import type { TasksModel } from "./model";

export interface CreateTaskInput {
  title: string;
  description?: string;
  clientId?: string;
  adAccountId?: string;
  entityLevel?: Task["entityLevel"];
  entityId?: string;
  entityName?: string;
  priority?: Task["priority"];
  assigneeUserId?: string;
  dueDate?: Date;
  source?: Task["source"];
  linkedAlertId?: string;
  linkedInsightId?: string;
}

export function severityToPriority(
  severity: "critical" | "warning" | "info"
): Task["priority"] {
  if (severity === "critical") {
    return "urgent";
  }
  if (severity === "warning") {
    return "high";
  }
  return "medium";
}

export class TasksService {
  constructor(private readonly model: TasksModel) {}

  list(filter: TaskListFilter): ReturnType<TasksModel["list"]> {
    return this.model.list(filter);
  }

  create(input: CreateTaskInput): Promise<Task> {
    return this.model.insert({
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      clientId: input.clientId,
      adAccountId: input.adAccountId,
      entityLevel: input.entityLevel,
      entityId: input.entityId,
      entityName: input.entityName,
      priority: input.priority ?? "medium",
      assigneeUserId: input.assigneeUserId,
      dueDate: input.dueDate,
      source: input.source ?? "manual",
      linkedAlertId: input.linkedAlertId,
      linkedInsightId: input.linkedInsightId,
    });
  }

  async update(id: string, patch: TaskUpdatePatch): Promise<Task> {
    const existing = await this.model.findById(id);
    if (!existing) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No task with id ${id}`);
    }
    const updated = await this.model.update(id, patch);
    if (!updated) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No task with id ${id}`);
    }
    if (
      patch.status !== undefined &&
      (patch.status === "done" || patch.status === "skipped") &&
      updated.linkedAlertId !== null
    ) {
      await this.model.setAlertStatus(updated.linkedAlertId, "acknowledged");
    }
    return updated;
  }
}

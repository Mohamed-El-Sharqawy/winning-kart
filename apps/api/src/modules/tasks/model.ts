import { and, desc, eq } from "drizzle-orm";
import { alerts, clients, db, tasks, users } from "@wk/db";
import type { Alert, Task } from "@wk/db";

export interface TaskListFilter {
  status?: Task["status"];
  assigneeUserId?: string;
}

export interface TaskCreateValues {
  id: string;
  title: string;
  description?: string | null;
  clientId?: string | null;
  adAccountId?: string | null;
  entityLevel?: Task["entityLevel"];
  entityId?: string | null;
  entityName?: string | null;
  priority: Task["priority"];
  assigneeUserId?: string | null;
  dueDate?: Date | null;
  source: Task["source"];
  linkedAlertId?: string | null;
  linkedInsightId?: string | null;
}

export interface TaskUpdatePatch {
  status?: Task["status"];
  priority?: Task["priority"];
  assigneeUserId?: string | null;
  dueDate?: Date | null;
}

export interface TaskListItem extends Task {
  assigneeName: string | null;
  clientName: string | null;
}

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  clientId: tasks.clientId,
  adAccountId: tasks.adAccountId,
  entityLevel: tasks.entityLevel,
  entityId: tasks.entityId,
  entityName: tasks.entityName,
  priority: tasks.priority,
  assigneeUserId: tasks.assigneeUserId,
  dueDate: tasks.dueDate,
  status: tasks.status,
  source: tasks.source,
  linkedAlertId: tasks.linkedAlertId,
  linkedInsightId: tasks.linkedInsightId,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

export class TasksModel {
  list(filter: TaskListFilter): Promise<TaskListItem[]> {
    const conditions = [
      filter.status !== undefined ? eq(tasks.status, filter.status) : undefined,
      filter.assigneeUserId !== undefined
        ? eq(tasks.assigneeUserId, filter.assigneeUserId)
        : undefined,
    ];
    return db
      .select({ ...taskColumns, assigneeName: users.displayName, clientName: clients.name })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeUserId, users.id))
      .leftJoin(clients, eq(tasks.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  async findById(id: string): Promise<Task | null> {
    const rows = await db.select(taskColumns).from(tasks).where(eq(tasks.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async insert(values: TaskCreateValues): Promise<Task> {
    const rows = await db
      .insert(tasks)
      .values({
        id: values.id,
        title: values.title,
        description: values.description ?? null,
        clientId: values.clientId ?? null,
        adAccountId: values.adAccountId ?? null,
        entityLevel: values.entityLevel ?? null,
        entityId: values.entityId ?? null,
        entityName: values.entityName ?? null,
        priority: values.priority,
        assigneeUserId: values.assigneeUserId ?? null,
        dueDate: values.dueDate ?? null,
        source: values.source,
        linkedAlertId: values.linkedAlertId ?? null,
        linkedInsightId: values.linkedInsightId ?? null,
      })
      .returning();
    return rows[0];
  }

  async update(id: string, patch: TaskUpdatePatch): Promise<Task | null> {
    const rows = await db
      .update(tasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async setAlertStatus(alertId: string, status: Alert["status"]): Promise<void> {
    await db.update(alerts).set({ status }).where(eq(alerts.id, alertId));
  }
}

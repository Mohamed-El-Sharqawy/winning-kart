import { t } from "elysia";

export const taskEntityLevelDto = t.Union([
  t.Literal("account"),
  t.Literal("campaign"),
  t.Literal("adset"),
  t.Literal("ad"),
  t.Literal("client"),
]);

export const taskPriorityDto = t.Union([
  t.Literal("low"),
  t.Literal("medium"),
  t.Literal("high"),
  t.Literal("urgent"),
]);

export const taskStatusDto = t.Union([
  t.Literal("todo"),
  t.Literal("in_progress"),
  t.Literal("done"),
  t.Literal("skipped"),
]);

export const createTaskDto = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String()),
  clientId: t.Optional(t.String()),
  adAccountId: t.Optional(t.String()),
  entityLevel: t.Optional(taskEntityLevelDto),
  entityId: t.Optional(t.String()),
  entityName: t.Optional(t.String()),
  priority: t.Optional(taskPriorityDto),
  dueDate: t.Optional(t.Date()),
});

export const updateTaskDto = t.Object({
  status: t.Optional(taskStatusDto),
  priority: t.Optional(taskPriorityDto),
  assigneeUserId: t.Optional(t.Union([t.String(), t.Null()])),
  dueDate: t.Optional(t.Union([t.Date(), t.Null()])),
});

export const taskListQueryDto = t.Object({
  status: t.Optional(taskStatusDto),
  assignee: t.Optional(t.String()),
});

export const taskDto = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Union([t.String(), t.Null()]),
  clientId: t.Union([t.String(), t.Null()]),
  adAccountId: t.Union([t.String(), t.Null()]),
  entityLevel: t.Union([t.String(), t.Null()]),
  entityId: t.Union([t.String(), t.Null()]),
  entityName: t.Union([t.String(), t.Null()]),
  priority: t.String(),
  assigneeUserId: t.Union([t.String(), t.Null()]),
  dueDate: t.Union([t.Date(), t.Null()]),
  status: t.String(),
  source: t.String(),
  linkedAlertId: t.Union([t.String(), t.Null()]),
  linkedInsightId: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const taskResponseDto = t.Object({ data: taskDto });

export const taskListDto = t.Object({
  data: t.Array(
    t.Intersect([
      taskDto,
      t.Object({
        assigneeName: t.Union([t.String(), t.Null()]),
        clientName: t.Union([t.String(), t.Null()]),
      }),
    ])
  ),
});

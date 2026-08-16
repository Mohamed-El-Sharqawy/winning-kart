import type { TaskDto, TaskListItemDto } from "../dto/tasks.dto";
import type { Task } from "../types/tasks.types";

export function toTask(dto: TaskDto | TaskListItemDto): Task {
  const listItem = dto as TaskListItemDto;
  return {
    ...dto,
    description: dto.description ?? null,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    assigneeName: listItem.assigneeName ?? null,
    clientName: listItem.clientName ?? null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export function toTasks(dtos: TaskListItemDto[]): Task[] {
  return dtos.map(toTask);
}

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { inlineErrorCopy } from "../services/api-call-error";
import { usePatchTask } from "../services/tasks.service";
import type { Task, TaskStatus } from "../types/tasks.types";

export function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const patchTask = usePatchTask();

  const run = (status: TaskStatus) => {
    setError(null);
    patchTask.mutate(
      { id: task.id, status },
      {
        onError: (mutationError) => setError(inlineErrorCopy(mutationError)),
      },
    );
  };

  const advance: { label: string; next: TaskStatus } | null =
    task.status === "todo"
      ? { label: "Start", next: "in_progress" }
      : task.status === "in_progress"
        ? { label: "Mark done", next: "done" }
        : null;

  const meta = [
    task.clientName,
    task.entityName,
    task.dueDate ? `Due ${formatDate(task.dueDate)}` : null,
    `Source ${task.source}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card title={task.title} actions={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-3">
        {task.description ? (
          <p className="text-[13px] text-volt-text-2">{task.description}</p>
        ) : (
          <p className="text-[13px] text-volt-text-3">No description.</p>
        )}
        {meta.length > 0 ? <p className="text-xs text-volt-text-3">{meta}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          {advance ? (
            <Button disabled={patchTask.isPending} onClick={() => run(advance.next)}>
              {advance.label}
            </Button>
          ) : null}
          {task.status === "todo" || task.status === "in_progress" ? (
            <Button variant="ghost-danger" disabled={patchTask.isPending} onClick={() => run("skipped")}>
              Skip
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-xs text-volt-down">{error}</p> : null}
      </div>
    </Card>
  );
}

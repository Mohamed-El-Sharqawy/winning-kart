import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Modal } from "@/shared/components/Modal";
import { inlineErrorCopy } from "../services/api-call-error";
import { usePatchTask } from "../services/tasks.service";
import type { Task, TaskPriority } from "../types/tasks.types";
import { Select } from "./Select";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function toDateInput(value: Date | null): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(toDateInput(task.dueDate));
  const [error, setError] = useState<string | null>(null);
  const patchTask = usePatchTask();

  const submit = () => {
    setError(null);
    patchTask.mutate(
      {
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate || null,
      },
      {
        onError: (mutationError) => setError(inlineErrorCopy(mutationError)),
        onSuccess: onClose,
      },
    );
  };

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Input
            label="Title"
            placeholder="What needs to happen"
            value={title}
            disabled={patchTask.isPending}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional context"
            value={description}
            disabled={patchTask.isPending}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-3">
            <Select
              label="Priority"
              value={priority}
              options={PRIORITY_OPTIONS}
              onChange={(value) => setPriority(value as TaskPriority)}
              className="flex-1"
            />
            <div className="flex-1">
              <Input
                label="Due date"
                type="date"
                value={dueDate}
                disabled={patchTask.isPending}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
        </div>
        {error ? <p className="text-xs text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={patchTask.isPending}>
            Cancel
          </Button>
          <Button disabled={patchTask.isPending || title.trim().length === 0} onClick={submit}>
            {patchTask.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

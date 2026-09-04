import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { inlineErrorCopy } from "../services/api-call-error";
import { useCreateTask } from "../services/tasks.service";
import type { TaskPriority } from "../types/tasks.types";
import { Select } from "./Select";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function NewTaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createTask = useCreateTask();

  const submit = () => {
    setError(null);
    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      },
      {
        onError: (mutationError) => setError(inlineErrorCopy(mutationError)),
        onSuccess: onClose,
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-volt-ground/70 px-4"
      onClick={onClose}
    >
      <section
        className="flex w-full max-w-md flex-col gap-4 rounded-wk border border-volt-border bg-volt-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-volt-text">New task</h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Title"
            placeholder="What needs to happen"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional context"
            value={description}
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
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
        </div>
        {error ? <p className="text-xs text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={createTask.isPending || title.trim().length === 0} onClick={submit}>
            Create task
          </Button>
        </div>
      </section>
    </div>
  );
}

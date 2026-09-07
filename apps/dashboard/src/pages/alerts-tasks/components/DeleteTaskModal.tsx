import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";
import { inlineErrorCopy } from "../services/api-call-error";
import { useDeleteTask } from "../services/tasks.service";
import type { Task } from "../types/tasks.types";

export function DeleteTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const deleteTask = useDeleteTask();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (submitError) {
      setError(inlineErrorCopy(submitError));
    }
  }

  return (
    <Modal title="Delete task" onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-[13px] leading-relaxed text-volt-text-2">
          This permanently removes{" "}
          <span className="font-medium text-volt-text">{task.title}</span>
          {task.linkedAlertId !== null
            ? ". The alert that triggered it will reopen."
            : "."}
        </p>
        {error ? <p className="text-sm text-volt-down">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={deleteTask.isPending}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" disabled={deleteTask.isPending}>
            {deleteTask.isPending ? "Deleting…" : "Delete task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { useTasks } from "../services/tasks.service";
import type { Task } from "../types/tasks.types";
import { DeleteTaskModal } from "./DeleteTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { NewTaskModal } from "./NewTaskModal";
import { SkeletonRows } from "./SkeletonRows";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TasksTable } from "./TasksTable";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; task: Task }
  | { kind: "delete"; task: Task }
  | null;

export function TasksTab() {
  const { data: tasks, isPending, isError } = useTasks();
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = tasks ?? [];
  const selected = list.find((task) => task.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-volt-text-3">
          <span className="font-mono tabular-nums">{list.length}</span> tasks
        </p>
        <Button onClick={() => setModal({ kind: "create" })}>New task</Button>
      </div>
      {isPending ? (
        <SkeletonRows rows={6} columns={8} />
      ) : isError ? (
        <p className="text-sm text-volt-down">Failed to load tasks.</p>
      ) : list.length === 0 ? (
        <EmptyState
          title="Nothing queued"
          hint="Create a task or accept a recommendation to get started."
        />
      ) : (
        <>
          <TasksTable
            tasks={list}
            selectedId={selectedId}
            onRowClick={(task) => setSelectedId((current) => (current === task.id ? null : task.id))}
            onEdit={(task) => setModal({ kind: "edit", task })}
            onDelete={(task) => {
              setSelectedId((current) => (current === task.id ? null : current));
              setModal({ kind: "delete", task });
            }}
          />
          {selected ? <TaskDetailPanel task={selected} onClose={() => setSelectedId(null)} /> : null}
        </>
      )}
      {modal?.kind === "create" ? <NewTaskModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "edit" ? (
        <EditTaskModal task={modal.task} onClose={() => setModal(null)} />
      ) : null}
      {modal?.kind === "delete" ? (
        <DeleteTaskModal
          task={modal.task}
          onClose={() => {
            setSelectedId(null);
            setModal(null);
          }}
        />
      ) : null}
    </div>
  );
}

import { useSearch } from "@tanstack/react-router";
import { AppShell } from "@/shared/layout/AppShell";
import { AlertsTab } from "./components/AlertsTab";
import { RecommendationsTab } from "./components/RecommendationsTab";
import { TabStrip } from "./components/TabStrip";
import { TasksTab } from "./components/TasksTab";

export function AlertsTasksPage() {
  const { tab } = useSearch({ from: "/alerts" });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-volt-text">Alerts & Tasks</h1>
        <TabStrip tab={tab} />
        {tab === "alerts" ? <AlertsTab /> : null}
        {tab === "tasks" ? <TasksTab /> : null}
        {tab === "recommendations" ? <RecommendationsTab /> : null}
      </div>
    </AppShell>
  );
}

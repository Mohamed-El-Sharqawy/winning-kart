import { StatusDot } from "@/shared/components/StatusDot";
import { SYNC_STAGE_LABELS, SYNC_STAGE_ORDER } from "../data/sync-copy.data";

export interface SyncStageView {
  stage: string;
  status: string;
  errorClass?: string;
}

export function SyncStageList({
  stages,
  inFlight,
}: {
  stages: SyncStageView[] | null;
  inFlight: boolean;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {SYNC_STAGE_ORDER.map((stage) => {
        const label = SYNC_STAGE_LABELS[stage] ?? stage;
        const stageResult = stages?.find((entry) => entry.stage === stage);
        let dot = (
          <StatusDot variant="neutral">{inFlight ? "syncing" : "queued"}</StatusDot>
        );
        if (stageResult?.status === "succeeded") {
          dot = <StatusDot variant="up">succeeded</StatusDot>;
        } else if (stageResult?.status === "failed") {
          dot = <StatusDot variant="down">{stageResult.errorClass ?? "failed"}</StatusDot>;
        } else if (stageResult?.status === "running") {
          dot = <StatusDot variant="neutral">syncing</StatusDot>;
        }
        return (
          <li key={stage} className="flex items-center justify-between gap-4">
            <span className="text-sm text-volt-text-2">{label}</span>
            {dot}
          </li>
        );
      })}
    </ol>
  );
}

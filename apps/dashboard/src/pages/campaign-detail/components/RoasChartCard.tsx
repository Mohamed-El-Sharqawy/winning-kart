import { ChartCard } from "@/shared/components/ChartCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { LineChart } from "@/shared/components/LineChart";
import { dayLabel } from "./day-label";
import type { CampaignDayPoint } from "../types/campaign-detail.types";

const SKELETON_CLASS = "h-[260px] animate-pulse rounded-wk bg-volt-surface-2";

export interface RoasChartCardProps {
  points: CampaignDayPoint[];
  loading: boolean;
}

export function RoasChartCard({ points, loading }: RoasChartCardProps) {
  if (loading) {
    return (
      <ChartCard title="ROAS">
        <div className={SKELETON_CLASS} />
      </ChartCard>
    );
  }

  const hasActivity = points.some((point) => point.roas !== null);
  if (points.length === 0 || !hasActivity) {
    return (
      <ChartCard title="ROAS">
        <EmptyState title="No activity in this window" />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="ROAS">
      <LineChart
        ariaLabel="Daily return on ad spend"
        height={260}
        labels={points.map((point) => dayLabel(point.date))}
        series={[{ id: "roas", color: "var(--color-volt-primary)", values: points.map((point) => point.roas) }]}
        yFormat={(value) => `${value.toFixed(1)}x`}
        refLine={{ value: 3, label: "3x" }}
      />
    </ChartCard>
  );
}

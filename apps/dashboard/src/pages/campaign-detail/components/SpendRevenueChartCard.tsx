import { formatNumber } from "@/lib/format";
import { ChartCard } from "@/shared/components/ChartCard";
import { ChartLegendItem } from "@/shared/components/ChartLegendItem";
import { EmptyState } from "@/shared/components/EmptyState";
import { LineChart } from "@/shared/components/LineChart";
import { dayLabel } from "./day-label";
import type { CampaignDayPoint } from "../types/campaign-detail.types";

const SKELETON_CLASS = "h-[260px] animate-pulse rounded-wk bg-volt-surface-2";

export interface SpendRevenueChartCardProps {
  points: CampaignDayPoint[];
  loading: boolean;
}

export function SpendRevenueChartCard({ points, loading }: SpendRevenueChartCardProps) {
  if (loading) {
    return (
      <ChartCard title="Spend vs Revenue">
        <div className={SKELETON_CLASS} />
      </ChartCard>
    );
  }

  const hasActivity = points.some((point) => point.spend > 0 || point.revenue > 0);
  if (points.length === 0 || !hasActivity) {
    return (
      <ChartCard title="Spend vs Revenue">
        <EmptyState title="No activity in this window" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Spend vs Revenue"
      legend={
        <>
          <ChartLegendItem color="var(--color-volt-text-3)" label="Spend" />
          <ChartLegendItem color="var(--color-volt-up)" label="Revenue" />
        </>
      }
    >
      <LineChart
        ariaLabel="Daily spend versus revenue"
        labels={points.map((point) => dayLabel(point.date))}
        series={[
          { id: "spend", color: "var(--color-volt-text-3)", values: points.map((point) => point.spend) },
          { id: "revenue", color: "var(--color-volt-up)", values: points.map((point) => point.revenue) },
        ]}
        yFormat={(value) => formatNumber(value)}
      />
    </ChartCard>
  );
}

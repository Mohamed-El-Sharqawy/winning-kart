import { formatNumber } from "@/lib/format";
import { ChartCard } from "@/shared/components/ChartCard";
import { ChartLegendItem } from "@/shared/components/ChartLegendItem";
import { LineChart } from "@/shared/components/LineChart";
import type { PortalDayPoint } from "../types/portal.types";

export interface PortalChartsProps {
  points: PortalDayPoint[];
}

export function PortalCharts({ points }: PortalChartsProps) {
  const labels = points.map((point) => point.label);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
          labels={labels}
          series={[
            { id: "spend", color: "var(--color-volt-text-3)", values: points.map((point) => point.spend) },
            { id: "revenue", color: "var(--color-volt-up)", values: points.map((point) => point.revenue) },
          ]}
          yFormat={(value) => formatNumber(value)}
        />
      </ChartCard>
      <ChartCard title="Return on ad spend">
        <LineChart
          ariaLabel="Daily return on ad spend"
          labels={labels}
          series={[
            { id: "roas", color: "var(--color-volt-primary)", values: points.map((point) => point.roas) },
          ]}
          yFormat={(value) => `${value.toFixed(1)}x`}
        />
      </ChartCard>
    </div>
  );
}

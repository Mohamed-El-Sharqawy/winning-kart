import { cn } from "@/lib/cn";
import { Card } from "@/shared/components/Card";

export interface ChartCardProps {
  title: string;
  legend?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, legend, className, children }: ChartCardProps) {
  return (
    <Card title={title} className={cn("min-w-0", className)}>
      <div className="flex min-w-0 flex-col gap-3">
        {legend ? (
          <div className="flex flex-wrap items-center gap-4 text-xs text-volt-text-3">{legend}</div>
        ) : null}
        <div className="min-w-0 overflow-hidden">{children}</div>
      </div>
    </Card>
  );
}

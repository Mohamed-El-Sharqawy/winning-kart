export interface ChartLegendItemProps {
  color: string;
  label: string;
}

export function ChartLegendItem({ color, label }: ChartLegendItemProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-block h-[3px] w-4 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

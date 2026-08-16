export interface LineSeries {
  id: string;
  color: string;
  values: Array<number | null>;
  dashed?: boolean;
}

export interface LineChartRef {
  value: number;
  label: string;
}

export interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  yFormat: (value: number) => string;
  refLine?: LineChartRef;
  height?: number;
  ariaLabel: string;
}

const WIDTH = 720;
const PADDING = { top: 12, right: 16, bottom: 30, left: 64 };
const TICK_RATIOS = [0, 0.25, 0.5, 0.75, 1];

function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const base = 10 ** Math.floor(Math.log10(value));
  const scaled = value / base;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * base;
}

function toPath(
  values: Array<number | null>,
  xAt: (index: number) => number,
  yAt: (value: number) => number,
): string {
  let path = "";
  let penDown = false;
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"}${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)}`;
    penDown = true;
  });
  return path;
}

export function LineChart({ labels, series, yFormat, refLine, height = 260, ariaLabel }: LineChartProps) {
  const count = labels.length;
  if (count === 0) return null;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const dataMax = Math.max(0, ...series.flatMap((line) => line.values.map((value) => value ?? 0)), refLine?.value ?? 0);
  const yMax = niceMax(dataMax);
  const xAt = (index: number) =>
    PADDING.left + (count === 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth);
  const yAt = (value: number) => PADDING.top + plotHeight - (value / yMax) * plotHeight;
  const labelStep = Math.max(1, Math.ceil(count / 6));
  const showDots = count <= 32;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={ariaLabel} className="w-full">
      {TICK_RATIOS.map((ratio) => {
        const tick = ratio * yMax;
        return (
          <g key={ratio}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="var(--color-volt-border)"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={yAt(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="tabular text-[10px]"
              fill="var(--color-volt-text-3)"
            >
              {yFormat(tick)}
            </text>
          </g>
        );
      })}
      {refLine ? (
        <g>
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={yAt(refLine.value)}
            y2={yAt(refLine.value)}
            stroke="var(--color-volt-text-3)"
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <text
            x={WIDTH - PADDING.right}
            y={yAt(refLine.value) - 6}
            textAnchor="end"
            className="tabular text-[10px]"
            fill="var(--color-volt-text-3)"
          >
            {refLine.label}
          </text>
        </g>
      ) : null}
      {series.map((line) => (
        <path
          key={line.id}
          d={toPath(line.values, xAt, yAt)}
          fill="none"
          stroke={line.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={line.dashed ? "6 4" : undefined}
        />
      ))}
      {showDots
        ? series.flatMap((line) =>
            line.values.map((value, index) =>
              value === null || !Number.isFinite(value) ? null : (
                <circle key={`${line.id}-${index}`} cx={xAt(index)} cy={yAt(value)} r={2} fill={line.color} />
              ),
            ),
          )
        : null}
      {labels.map((label, index) =>
        index % labelStep === 0 || index === count - 1 ? (
          <text
            key={`${label}-${index}`}
            x={xAt(index)}
            y={height - 8}
            textAnchor={index === count - 1 && (count - 1) % labelStep !== 0 ? "end" : "middle"}
            className="text-[10px]"
            fill="var(--color-volt-text-3)"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

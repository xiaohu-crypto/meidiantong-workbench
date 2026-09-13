interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartWidgetProps {
  title: string;
  data: BarChartItem[];
  height?: number;
  color?: string;
  highlightLast?: boolean;
  valueFormatter?: (v: number) => string;
  horizontal?: boolean;
}

export function BarChartWidget({
  title,
  data,
  height = 160,
  color = "var(--chart-1)",
  highlightLast = false,
  valueFormatter,
  horizontal = false,
}: BarChartWidgetProps) {
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const fmt = valueFormatter ?? ((v: number) => String(v));

  if (data.length === 0) {
    return (
      <div className="card card-pad">
        <div className="h-row"><span className="h-title sm">{title}</span></div>
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>暂无数据</p>
      </div>
    );
  }

  if (horizontal) {
    const rowH = 26;
    const padLeft = 50;
    const padRight = 40;
    const padTop = 8;
    const svgH = data.length * rowH + padTop + 4;
    return (
      <div className="card card-pad">
        <div className="h-row"><span className="h-title sm">{title}</span></div>
        <svg viewBox={`0 0 400 ${svgH}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
          {data.map((d, i) => {
            const y = padTop + i * rowH;
            const barW = ((d.value / maxV) * (400 - padLeft - padRight));
            const barColor = highlightLast && i === data.length - 1 ? "var(--success)" : color;
            return (
              <g key={i}>
                <text x={padLeft - 6} y={y + rowH / 2 + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">
                  {d.label}
                </text>
                <rect
                  x={padLeft}
                  y={y + 3}
                  width={Math.max(barW, 2)}
                  height={rowH - 10}
                  rx={3}
                  fill={barColor}
                  opacity={0.85}
                />
                <text x={padLeft + barW + 6} y={y + rowH / 2 + 4} fontSize="11" fill="var(--ink-2)" className="num">
                  {fmt(d.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const barGap = 10;
  const barW = Math.max(12, (400 - barGap * (data.length + 1)) / data.length);
  const padTop = 28;
  const padBottom = 24;
  const chartH = height - padTop - padBottom;

  return (
    <div className="card card-pad">
      <div className="h-row"><span className="h-title sm">{title}</span></div>
      <svg viewBox={`0 0 400 ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const x = barGap + i * (barW + barGap);
          const barH = Math.max(2, (d.value / maxV) * chartH);
          const y = height - padBottom - barH;
          const barColor = highlightLast && i === data.length - 1 ? "var(--ink-4)" : color;
          return (
            <g key={i}>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="num">
                {d.value ? fmt(d.value) : (highlightLast && i === data.length - 1 ? fmt(0) : "")}
              </text>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={barColor}
                opacity={highlightLast && i === data.length - 1 ? 0.45 : 0.85}
              />
              <text x={x + barW / 2} y={height - padBottom + 14} textAnchor="middle" fontSize="10" fill="var(--ink-4)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

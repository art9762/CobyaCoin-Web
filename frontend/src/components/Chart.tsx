interface ChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  showAxis?: boolean;
}

export function Chart({
  data, color = "#F5B841", height = 220, width = 800,
  fill = true, showAxis = false,
}: ChartProps) {
  if (data.length < 2) {
    return <div style={{ height, color: "var(--fg-4)", display: "grid", placeItems: "center", fontSize: 12 }}>нет данных</div>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const padTop = 16;
  const padBot = showAxis ? 28 : 8;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / span) * (height - padTop - padBot) - padBot,
  ] as [number, number]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  const id = `chart-${color.replace("#", "")}`;
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%" height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity=".45" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      {showAxis && [0.25, 0.5, 0.75].map((y, i) => (
        <line key={i}
              x1={0} y1={padTop + (height - padTop - padBot) * y}
              x2={width} y2={padTop + (height - padTop - padBot) * y}
              stroke="rgb(255 255 255 / .06)" strokeDasharray="2 4" />
      ))}
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} stroke={color} strokeWidth={1.75} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={4} fill={color} />
      <circle cx={last[0]} cy={last[1]} r={9} fill={color} opacity={0.2}>
        <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".4;0;.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

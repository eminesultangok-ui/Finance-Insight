import { AreaChart, Area, YAxis, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number | string;
  height?: number | string;
}

export function Sparkline({ data, isPositive, width = "100%", height = 40 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((val, i) => ({ value: val, index: i }));
  const color = isPositive ? "var(--positive)" : "var(--negative)";
  
  // Optional neutral state handling
  const isNeutral = !isPositive && data[0] === data[data.length - 1];
  const finalColor = isNeutral ? "var(--text-muted)" : color;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.1;

  const gradientId = `colorFill-${isPositive ? 'pos' : 'neg'}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={finalColor} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={finalColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={finalColor}
            fill={isNeutral ? "none" : `url(#${gradientId})`}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

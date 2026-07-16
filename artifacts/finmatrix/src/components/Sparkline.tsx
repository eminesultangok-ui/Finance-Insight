import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number | string;
  height?: number | string;
}

export function Sparkline({ data, isPositive, width = "100%", height = 30 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((val, i) => ({ value: val, index: i }));
  const color = isPositive ? "hsl(var(--positive))" : "hsl(var(--destructive))";

  const min = Math.min(...data);
  const max = Math.max(...data);
  // Add some padding to domain
  const padding = (max - min) * 0.1;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

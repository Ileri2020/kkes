"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { format } from "date-fns";

interface ChartProps {
  data?: { date: string; count: number }[];
  isLoading?: boolean;
}

export function VisitAnalysisChart({ data, isLoading }: ChartProps) {
  if (isLoading && !data)
    return <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />;
  if (!data || !Array.isArray(data) || data.length === 0)
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
        <span className="text-4xl">📊</span>
        <p className="text-sm">No visit data yet — visits will appear here as users browse the site.</p>
      </div>
    );

  const maxCount = Math.max(...data.map((d) => d.count));

  const formattedData = data.map((d) => ({
    ...d,
    dateStr: (() => {
      try {
        return format(new Date(d.date), "MMM d");
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--muted-foreground)/0.15)"
          />
          <XAxis
            dataKey="dateStr"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: any) => [`${value} visits`, "Visits"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.count === maxCount
                    ? "hsl(var(--primary))"
                    : "hsl(var(--primary)/0.5)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

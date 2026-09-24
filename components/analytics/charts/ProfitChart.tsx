"use client";

import { useAnalytics } from "../hooks/useAnalytics";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";

interface ChartProps {
    data?: any;
    isLoading?: boolean;
}

export function ProfitChart({ data, isLoading }: ChartProps) {
    if (isLoading && !data) return <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />;
    if (!data || !Array.isArray(data) || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;

    const formattedData = data.map((d: any) => ({
        ...d,
        dateStr: format(new Date(d.date), "MMM d"),
    }));

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val}`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" barSize={30} />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

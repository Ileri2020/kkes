import { useAnalytics } from "../hooks/useAnalytics";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChartProps {
    data?: any;
    isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: ChartProps) {
    const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");

    if (isLoading && !data) return <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />;
    if (!data || !Array.isArray(data) || data.length === 0) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>;

    // Simple aggregation or formatting if needed
    const formattedData = data.map((d: any) => ({
        ...d,
        dateStr: format(new Date(d.date), "MMM d"),
    }));

    return (
        <div className="space-y-4">
            <div className="flex justify-end space-x-2">
                <Button variant={chartType === "line" ? "default" : "outline"} size="sm" onClick={() => setChartType("line")}>Line</Button>
                <Button variant={chartType === "area" ? "default" : "outline"} size="sm" onClick={() => setChartType("area")}>Area</Button>
                <Button variant={chartType === "bar" ? "default" : "outline"} size="sm" onClick={() => setChartType("bar")}>Bar</Button>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                        <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                            <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val}`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    ) : chartType === "area" ? (
                        <AreaChart data={formattedData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                            <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val}`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    ) : (
                        <BarChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                            <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₦${val}`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#8884d8"];

interface ChartProps {
    data?: any;
    isLoading?: boolean;
}

export function RefundReasonChart({ data, isLoading }: ChartProps) {
    if (isLoading && !data) return <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />;

    // Mock data for reasons if API only returns total list, or if API response structure is just list of amounts
    // For now let's assume we want to visualize this even if data is simple
    // If data is just array of { date, amount }, we can't do reasons.
    // Let's create a derived dummy breakdown or just return null if no reasons data.

    if (isLoading) return <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" />;

    // Placeholder logic until DB supports refund reasons
    const dummyData = [
        { name: "Damaged", value: 4 },
        { name: "Wrong Item", value: 2 },
        { name: "Late Delivery", value: 1 },
        { name: "Changed Mind", value: 3 },
    ];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={dummyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {dummyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

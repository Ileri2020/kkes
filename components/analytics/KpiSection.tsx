"use client";

import { useAnalytics } from "./hooks/useAnalytics";
import { KpiCard } from "./cards/KpiCard";
import { DollarSign, ShoppingCart, Users, ArrowDownRight, Eye } from "lucide-react";

interface KpiSectionProps {
    data?: any;
    isLoading?: boolean;
}

export function KpiSection({ data, isLoading }: KpiSectionProps) {
    if (isLoading && !data) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full h-24 animate-pulse bg-muted rounded-md" />;
    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Revenue"
                    value={`₦${data.totalRevenue?.toLocaleString() || 0}`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <KpiCard
                    title="Total Orders"
                    value={(data.totalOrders || 0).toLocaleString()}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />
                <KpiCard
                    title="Refunds"
                    value={`₦${data.totalRefunds?.toLocaleString() || 0}`}
                    icon={<ArrowDownRight className="h-4 w-4 text-red-500" />}
                />
                <KpiCard
                    title="New Users"
                    value={(data.newUsers || 0).toLocaleString()}
                    description={`of ${(data.totalUsers || 0).toLocaleString()} total`}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="New Products"
                    value={(data.newProducts || 0).toLocaleString()}
                    description={`of ${(data.totalProducts || 0).toLocaleString()} total`}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />
                <KpiCard
                    title="Total Brands"
                    value={(data.totalBrands || 0).toLocaleString()}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />
                <KpiCard
                    title="New Posts"
                    value={(data.newPosts || 0).toLocaleString()}
                    description={`of ${(data.totalPosts || 0).toLocaleString()} total`}
                    icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
                />
                <KpiCard
                    title="Total Visits"
                    value={(data.totalVisits || 0).toLocaleString()}
                    description="All users incl. guests"
                    icon={<Eye className="h-4 w-4 text-primary" />}
                />
            </div>
        </div>
    );
}

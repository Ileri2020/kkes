import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";

interface BrowserVisitCardProps {
    uniqueBrowsers: number;
    isLoading?: boolean;
}

export function BrowserVisitCard({ uniqueBrowsers, isLoading }: BrowserVisitCardProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Browsers</CardTitle>
                <div className="text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isLoading ? "..." : uniqueBrowsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Different browsers that visited the site
                </p>
            </CardContent>
        </Card>
    );
}
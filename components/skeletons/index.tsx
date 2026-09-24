import { Skeleton } from "@/components/ui/skeleton";

/**
 * Product Card Skeleton - Matches product card layout
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-muted bg-card p-4 space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

/**
 * Product Grid Skeleton - Multiple product cards
 */
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * KPI Card Skeleton - Analytics/Dashboard KPI
 */
export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-muted bg-card p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/**
 * KPI Section Skeleton - Multiple KPI cards
 */
export function KpiSectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Chart Skeleton - For dashboard charts
 */
export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-muted bg-card p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-end gap-2 h-12">
            <Skeleton className={`flex-1 rounded-t-sm`} style={{ height: `${Math.random() * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton - Single table row
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table Skeleton - Multiple rows
 */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-muted bg-card overflow-hidden">
      <table className="w-full">
        <thead className="border-b bg-muted/30">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Profile Skeleton - User profile card
 */
export function ProfileSkeleton() {
  return (
    <div className="rounded-lg border border-muted bg-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <Skeleton className="h-px w-full bg-muted" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Dialog Skeleton - Generic dialog loading state
 */
export function DialogSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

/**
 * Hero Section Skeleton - Landing page hero
 */
export function HeroSkeleton() {
  return (
    <div className="w-full h-96 rounded-lg bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse space-y-4 p-8 flex flex-col justify-center">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Page Skeleton - Full page loading
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
}

/**
 * Text Block Skeleton - Multiple text lines
 */
export function TextBlockSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 w-full"
          style={{
            width: i === lines - 1 ? "60%" : "100%"
          }}
        />
      ))}
    </div>
  );
}

/**
 * Form Skeleton - Form fields loading
 */
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Cart Item Skeleton - Shopping cart item
 */
export function CartItemSkeleton() {
  return (
    <div className="rounded-lg border border-muted bg-card p-4 flex gap-4">
      <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * Cart Page Skeleton - Full cart page
 */
export function CartPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-lg border border-muted bg-card p-6 h-fit space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-px w-full bg-muted" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Banner Skeleton - Banner/Hero with image
 */
export function BannerSkeleton() {
  return (
    <Skeleton className="w-full h-64 md:h-96 rounded-xl" />
  );
}

/**
 * Sidebar with Content Skeleton - Sidebar layout
 */
export function SidebarWithContentSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="md:col-span-3">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}

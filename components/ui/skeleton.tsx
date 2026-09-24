import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

import { STATUS_COLORS } from "@/lib/status"
import { cn } from "@/lib/utils"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      STATUS_COLORS[status] ?? "bg-muted text-muted-foreground",
      className
    )}>
      {status}
    </span>
  )
}

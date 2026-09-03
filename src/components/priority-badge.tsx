import { cn } from "@/lib/utils"

const colors: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[priority] ?? "bg-muted text-muted-foreground")}>
      {priority}
    </span>
  )
}

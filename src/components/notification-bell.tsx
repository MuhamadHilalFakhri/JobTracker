import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, isNull, and } from "drizzle-orm"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getUserId } from "@/lib/session"
import { markNotificationAsRead } from "@/app/actions/notifications"

export async function NotificationBell() {
  const userId = await getUserId()
  if (!userId) return null

  const items = await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt)
    .limit(8)

  const unread = items.filter((n) => !n.readAt).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifikasi (${unread} belum dibaca)`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unread > 0 && (
            <form action={async () => { "use server"; await markNotificationAsRead() }}>
              <button type="submit" className="text-xs text-muted-foreground hover:text-foreground">
                Tandai semua dibaca
              </button>
            </form>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada notifikasi
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} className={n.readAt ? "opacity-60" : ""} asChild>
              <Link href={n.entityType && n.entityId ? `/${n.entityType === "application" ? "applications" : n.entityType}s/${n.entityId}` : "#"} className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm font-medium">{n.title}</span>
                {n.message && <span className="text-xs text-muted-foreground">{n.message}</span>}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

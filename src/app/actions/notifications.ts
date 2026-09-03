"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUserId } from "@/lib/session"

export async function markNotificationAsRead(id?: string) {
  const userId = await getUserId()
  if (!userId) return

  if (id) {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
  } else {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  }
  revalidatePath("/dashboard")
}

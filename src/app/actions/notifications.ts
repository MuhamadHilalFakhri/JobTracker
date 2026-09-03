"use server"

import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function markNotificationAsRead(id?: string) {
  const session = await auth()
  if (!session?.user?.id) return

  if (id) {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
  } else {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)))
  }
  revalidatePath("/dashboard")
}

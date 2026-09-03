"use server"

import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { profileSchema } from "@/lib/validations"

export async function updateProfile(input: unknown) {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  const parsed = profileSchema.parse(input)
  await db.update(users).set({
    name: parsed.name,
    timezone: parsed.timezone,
    locale: parsed.locale,
    currency: parsed.currency,
    dateFormat: parsed.dateFormat,
    theme: parsed.theme,
    updatedAt: new Date(),
  }).where(eq(users.id, userId))
  revalidatePath("/settings")
}

export async function deleteAccount() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  await db.delete(users).where(eq(users.id, userId))
  // cascade menghapus seluruh data terkait
  revalidatePath("/")
}

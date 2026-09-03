"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notes, activities } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { noteSchema } from "@/lib/validations"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function createNote(input: unknown) {
  const userId = await requireUser()
  const parsed = noteSchema.parse(input)
  const [note] = await db.insert(notes).values({
    userId,
    applicationId: parsed.applicationId ?? null,
    title: parsed.title,
    content: parsed.content,
  }).returning()

  if (parsed.applicationId) {
    await db.insert(activities).values({
      userId,
      applicationId: parsed.applicationId,
      eventType: "note_added",
      metadata: { title: parsed.title },
    })
  }
  revalidatePath("/dashboard")
  if (parsed.applicationId) revalidatePath(`/applications/${parsed.applicationId}`)
  return { id: note.id }
}

export async function updateNote(id: string, content: string) {
  const userId = await requireUser()
  await db.update(notes).set({ content, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
}

export async function deleteNote(id: string) {
  const userId = await requireUser()
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)))
  revalidatePath("/dashboard")
}

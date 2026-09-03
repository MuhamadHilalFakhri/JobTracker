"use server"

import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { tasks, activities } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { taskSchema } from "@/lib/validations"

async function requireUser() {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function createTask(input: unknown) {
  const userId = await requireUser()
  const parsed = taskSchema.parse(input)
  const [task] = await db.insert(tasks).values({
    userId,
    applicationId: parsed.applicationId ?? null,
    title: parsed.title,
    description: parsed.description ?? null,
    type: parsed.type,
    priority: parsed.priority,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
  }).returning()

  if (parsed.applicationId) {
    await db.insert(activities).values({
      userId,
      applicationId: parsed.applicationId,
      eventType: "task_created",
      metadata: { title: parsed.title },
    })
  }
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  if (parsed.applicationId) revalidatePath(`/applications/${parsed.applicationId}`)
  return { id: task.id }
}

export async function updateTaskStatus(id: string, status: string) {
  const userId = await requireUser()
  const valid = ["To Do", "In Progress", "Completed", "Cancelled"]
  if (!valid.includes(status)) throw new Error("Status task tidak valid")

  const existing = await db.select().from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (existing.length === 0) throw new Error("Task tidak ditemukan")

  const set: Record<string, unknown> = { status, updatedAt: new Date() }
  if (status === "Completed") set.completedAt = new Date()
  else set.completedAt = null
  await db.update(tasks).set(set)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))

  if (status === "Completed") {
    await db.insert(activities).values({
      userId,
      applicationId: existing[0].applicationId ?? null,
      eventType: "task_completed",
      metadata: { title: existing[0].title },
    })
  }
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  if (existing[0].applicationId) revalidatePath(`/applications/${existing[0].applicationId}`)
}

export async function deleteTask(id: string) {
  const userId = await requireUser()
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}

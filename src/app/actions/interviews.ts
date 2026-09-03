"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { interviews, activities } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { interviewSchema } from "@/lib/validations"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function createInterview(input: unknown) {
  const userId = await requireUser()
  const parsed = interviewSchema.parse(input)

  const [iv] = await db.insert(interviews).values({
    userId,
    applicationId: parsed.applicationId ?? null,
    type: parsed.type,
    title: parsed.title,
    startAt: new Date(parsed.startAt),
    endAt: parsed.endAt ? new Date(parsed.endAt) : null,
    timezone: parsed.timezone ?? "Asia/Jakarta",
    mode: parsed.mode,
    location: parsed.location ?? null,
    meetingUrl: parsed.meetingUrl || null,
    interviewerName: parsed.interviewerName ?? null,
    preparationNotes: parsed.preparationNotes ?? null,
    status: parsed.status,
  }).returning()

  if (parsed.applicationId) {
    await db.insert(activities).values({
      userId,
      applicationId: parsed.applicationId,
      eventType: "interview_created",
      metadata: { title: parsed.title, startAt: parsed.startAt },
    })
  }

  revalidatePath("/calendar")
  revalidatePath("/dashboard")
  if (parsed.applicationId) revalidatePath(`/applications/${parsed.applicationId}`)
  return { id: iv.id }
}

export async function updateInterview(id: string, input: unknown) {
  const userId = await requireUser()
  const parsed = interviewSchema.parse(input)
  await db.update(interviews).set({
    applicationId: parsed.applicationId ?? null,
    type: parsed.type,
    title: parsed.title,
    startAt: new Date(parsed.startAt),
    endAt: parsed.endAt ? new Date(parsed.endAt) : null,
    timezone: parsed.timezone ?? "Asia/Jakarta",
    mode: parsed.mode,
    location: parsed.location ?? null,
    meetingUrl: parsed.meetingUrl || null,
    interviewerName: parsed.interviewerName ?? null,
    preparationNotes: parsed.preparationNotes ?? null,
    status: parsed.status,
    updatedAt: new Date(),
  }).where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
  revalidatePath("/calendar")
  if (parsed.applicationId) revalidatePath(`/applications/${parsed.applicationId}`)
}

export async function rescheduleInterview(id: string, startAt: string, endAt?: string) {
  const userId = await requireUser()
  await db.update(interviews).set({
    startAt: new Date(startAt),
    endAt: endAt ? new Date(endAt) : null,
    status: "Rescheduled",
    updatedAt: new Date(),
  }).where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
  revalidatePath("/calendar")
}

export async function deleteInterview(id: string) {
  const userId = await requireUser()
  await db.delete(interviews).where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
  revalidatePath("/calendar")
}

export async function completeInterview(id: string) {
  const userId = await requireUser()
  await db.update(interviews).set({ status: "Completed", updatedAt: new Date() })
    .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
  revalidatePath("/calendar")
}

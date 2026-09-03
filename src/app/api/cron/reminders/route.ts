import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications, interviews, tasks, jobApplications, users } from "@/lib/db/schema"
import { and, eq, isNull, gte, lte, sql } from "drizzle-orm"

/**
 * Cron harian (Vercel Cron / cron-job.org) — buat reminder:
 * 1. Interview besok
 * 2. Interview mulai < 3 jam (aman untuk dipanggil tiap jam)
 * 3. Task deadline <= 2 hari / overdue
 * 4. Lamaran aktif tanpa aktivitas > 14 hari (follow-up / No Response)
 * Idempoten via deduplication_key unik per user+type+entity+tanggal.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  let created = 0

  // 1. Interview besok
  const tomorrowInterviews = await db.select().from(interviews)
    .where(and(
      eq(interviews.status, "Scheduled"),
      gte(interviews.startAt, new Date(tomorrow.toDateString())),
      lte(interviews.startAt, new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)),
    ))

  for (const iv of tomorrowInterviews) {
    const dedup = `interview-tomorrow-${iv.id}-${now.toISOString().slice(0, 10)}`
    const existing = await db.select({ id: notifications.id }).from(notifications)
      .where(eq(notifications.deduplicationKey, dedup)).limit(1)
    if (existing.length === 0) {
      await db.insert(notifications).values({
        userId: iv.userId,
        type: "interview_tomorrow",
        title: "Interview besok",
        message: `"${iv.title}" dijadwalkan besok`,
        entityType: "interview",
        entityId: iv.id,
        deduplicationKey: dedup,
      })
      created++
    }
  }

  // 2. Task overdue / mendekati deadline
  const dueTasks = await db.select().from(tasks)
    .where(and(
      sql`${tasks.status} in ('To Do','In Progress')`,
      lte(tasks.dueAt, twoDays),
    ))

  for (const t of dueTasks) {
    const isOverdue = t.dueAt && t.dueAt < now
    const dedup = `task-${isOverdue ? "overdue" : "due"}-${t.id}-${now.toISOString().slice(0, 10)}`
    const existing = await db.select({ id: notifications.id }).from(notifications)
      .where(eq(notifications.deduplicationKey, dedup)).limit(1)
    if (existing.length === 0) {
      await db.insert(notifications).values({
        userId: t.userId,
        type: isOverdue ? "task_overdue" : "task_due",
        title: isOverdue ? "Task terlambat" : "Task mendekati deadline",
        message: `"${t.title}" ${isOverdue ? "sudah melewati deadline" : "deadline-nya dekat"}`,
        entityType: "task",
        entityId: t.id,
        deduplicationKey: dedup,
      })
      created++
    }
  }

  // 3. Lamaran aktif tanpa aktivitas > 14 hari
  const staleApps = await db.select().from(jobApplications)
    .where(and(
      sql`${jobApplications.status} in ('Applied','Screening','Assessment','HR Interview','User Interview','Final Interview')`,
      lte(jobApplications.lastActivityAt, fourteenDaysAgo),
    ))

  for (const app of staleApps) {
    const dedup = `followup-${app.id}-${now.toISOString().slice(0, 10)}`
    const existing = await db.select({ id: notifications.id }).from(notifications)
      .where(eq(notifications.deduplicationKey, dedup)).limit(1)
    if (existing.length === 0) {
      await db.insert(notifications).values({
        userId: app.userId,
        type: "follow_up",
        title: "Saatnya follow-up",
        message: `"${app.positionTitle}" belum ada aktivitas lebih dari 14 hari`,
        entityType: "application",
        entityId: app.id,
        deduplicationKey: dedup,
      })
      created++
    }
  }

  return NextResponse.json({ ok: true, created })
}

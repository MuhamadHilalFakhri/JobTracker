import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { interviews, jobApplications, tasks } from "@/lib/db/schema"
import { and, eq, isNull, asc } from "drizzle-orm"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CalendarClient } from "./calendar-client"

export const metadata = { title: "Calendar — JobTracker" }

export default async function CalendarPage() {
  const userId = await requireUserId()

  const [allInterviews, allTasks, deadlineApps] = await Promise.all([
    db.select().from(interviews)
      .where(and(eq(interviews.userId, userId)))
      .orderBy(asc(interviews.startAt)),
    db.select().from(tasks)
      .where(and(eq(tasks.userId, userId), isNull(tasks.completedAt)))
      .orderBy(asc(tasks.dueAt)),
    db.select().from(jobApplications)
      .where(and(eq(jobApplications.userId, userId), isNull(jobApplications.deletedAt))),
  ])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Interview, technical test, deadline lamaran, dan task
            </p>
          </div>
        </div>
        <CalendarClient interviews={allInterviews} tasks={allTasks} deadlineApps={deadlineApps} />
      </div>
    </DashboardLayout>
  )
}